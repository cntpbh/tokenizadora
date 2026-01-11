import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar todas as solicitações de saque (para admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'paid', 'all'

    let query = supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
    }

    // Estatísticas
    const stats = {
      pending: withdrawals?.filter(w => w.status === 'pending').length || 0,
      approved: withdrawals?.filter(w => w.status === 'approved').length || 0,
      paid: withdrawals?.filter(w => w.status === 'paid').length || 0,
      rejected: withdrawals?.filter(w => w.status === 'rejected').length || 0,
      totalPendingAmount: withdrawals
        ?.filter(w => w.status === 'pending' || w.status === 'approved')
        .reduce((sum, w) => sum + parseFloat(w.amount), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
      stats
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Ações do admin: aprovar, pagar, rejeitar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, withdrawal_id, admin_email, tx_hash, rejection_reason, admin_notes } = body;

    if (!action || !withdrawal_id) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: action, withdrawal_id' 
      }, { status: 400 });
    }

    // Buscar solicitação
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    const now = new Date().toISOString();

    switch (action) {
      // ==================== APROVAR ====================
      case 'approve':
        if (withdrawal.status !== 'pending') {
          return NextResponse.json({ 
            error: 'Apenas solicitações pendentes podem ser aprovadas' 
          }, { status: 400 });
        }

        const { error: approveError } = await supabase
          .from('withdrawal_requests')
          .update({
            status: 'approved',
            admin_notes: admin_notes || 'Aprovado para pagamento',
            updated_at: now
          })
          .eq('id', withdrawal_id);

        if (approveError) {
          return NextResponse.json({ error: 'Erro ao aprovar' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Solicitação aprovada! Agora você pode realizar o pagamento.',
          status: 'approved'
        });

      // ==================== PAGAR (com tx_hash) ====================
      case 'pay':
        if (withdrawal.status !== 'approved' && withdrawal.status !== 'pending') {
          return NextResponse.json({ 
            error: 'Apenas solicitações aprovadas/pendentes podem ser pagas' 
          }, { status: 400 });
        }

        if (!tx_hash) {
          return NextResponse.json({ 
            error: 'Hash da transação (tx_hash) é obrigatório' 
          }, { status: 400 });
        }

        // Validar formato do hash
        if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
          return NextResponse.json({ 
            error: 'Formato de tx_hash inválido. Use o hash completo da transação.' 
          }, { status: 400 });
        }

        // Atualizar solicitação como paga
        const { error: payError } = await supabase
          .from('withdrawal_requests')
          .update({
            status: 'paid',
            tx_hash,
            paid_at: now,
            paid_by: admin_email || 'admin',
            admin_notes: admin_notes || `Pago em ${new Date().toLocaleString('pt-BR')}`,
            updated_at: now
          })
          .eq('id', withdrawal_id);

        if (payError) {
          return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
        }

        // Atualizar carteira do usuário
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_email', withdrawal.user_email)
          .single();

        if (wallet) {
          // Debitar do saldo (primeiro das comissões, depois do cripto)
          let amountToDebit = parseFloat(withdrawal.amount);
          let newCommissionBalance = parseFloat(wallet.commission_balance || 0);
          let newCryptoBalance = parseFloat(wallet[`balance_${withdrawal.currency.toLowerCase()}`] || 0);

          if (newCommissionBalance >= amountToDebit) {
            newCommissionBalance -= amountToDebit;
          } else {
            amountToDebit -= newCommissionBalance;
            newCommissionBalance = 0;
            newCryptoBalance -= amountToDebit;
          }

          await supabase
            .from('user_wallets')
            .update({
              commission_balance: newCommissionBalance,
              [`balance_${withdrawal.currency.toLowerCase()}`]: Math.max(0, newCryptoBalance),
              total_withdrawn: parseFloat(wallet.total_withdrawn || 0) + parseFloat(withdrawal.amount),
              last_withdrawal_at: now,
              updated_at: now
            })
            .eq('id', wallet.id);

          // Registrar transação
          await supabase
            .from('wallet_transactions')
            .insert([{
              wallet_id: wallet.id,
              user_email: withdrawal.user_email,
              type: 'withdrawal',
              amount: -parseFloat(withdrawal.amount),
              currency: withdrawal.currency,
              amount_usd: parseFloat(withdrawal.amount_usd || withdrawal.amount),
              balance_after: newCommissionBalance + newCryptoBalance,
              reference_id: withdrawal_id,
              reference_type: 'withdrawal_request',
              tx_hash,
              description: `Saque de ${withdrawal.amount} ${withdrawal.currency}`,
              status: 'completed'
            }]);
        }

        // TODO: Enviar email de confirmação para o usuário

        return NextResponse.json({
          success: true,
          message: 'Pagamento registrado com sucesso!',
          status: 'paid',
          tx_hash
        });

      // ==================== REJEITAR ====================
      case 'reject':
        if (withdrawal.status === 'paid') {
          return NextResponse.json({ 
            error: 'Solicitações já pagas não podem ser rejeitadas' 
          }, { status: 400 });
        }

        const { error: rejectError } = await supabase
          .from('withdrawal_requests')
          .update({
            status: 'rejected',
            rejected_at: now,
            rejected_by: admin_email || 'admin',
            rejection_reason: rejection_reason || 'Solicitação rejeitada pelo administrador',
            admin_notes,
            updated_at: now
          })
          .eq('id', withdrawal_id);

        if (rejectError) {
          return NextResponse.json({ error: 'Erro ao rejeitar' }, { status: 500 });
        }

        // TODO: Enviar email informando rejeição

        return NextResponse.json({
          success: true,
          message: 'Solicitação rejeitada',
          status: 'rejected'
        });

      default:
        return NextResponse.json({ 
          error: 'Ação inválida. Use: approve, pay, reject' 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
