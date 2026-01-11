import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Solicitar saque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, currency, wallet_address, notes } = body;

    // Validações básicas
    if (!email || !amount || !currency || !wallet_address) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: email, amount, currency, wallet_address' 
      }, { status: 400 });
    }

    // Validar endereço de carteira (formato básico)
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return NextResponse.json({ 
        error: 'Endereço de carteira inválido. Use formato: 0x...' 
      }, { status: 400 });
    }

    // Buscar carteira do usuário
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email.toLowerCase())
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 });
    }

    // Buscar configurações
    const { data: settings } = await supabase
      .from('withdrawal_settings')
      .select('*')
      .single();

    const minAmount = settings?.min_withdrawal_usd || 20;
    const maxAmount = settings?.max_withdrawal_usd || 1000;
    const cooldownDays = settings?.withdrawal_cooldown_days || 7;

    // Validar valor mínimo
    if (amount < minAmount) {
      return NextResponse.json({ 
        error: `Valor mínimo para saque: $${minAmount}` 
      }, { status: 400 });
    }

    // Validar valor máximo
    if (amount > maxAmount) {
      return NextResponse.json({ 
        error: `Valor máximo para saque: $${maxAmount}` 
      }, { status: 400 });
    }

    // Verificar saldo disponível
    const balanceField = `balance_${currency.toLowerCase()}`;
    const commissionBalance = parseFloat(wallet.commission_balance || 0);
    const cryptoBalance = parseFloat(wallet[balanceField] || 0);
    const totalAvailable = commissionBalance + cryptoBalance;

    if (amount > totalAvailable) {
      return NextResponse.json({ 
        error: `Saldo insuficiente. Disponível: $${totalAvailable.toFixed(2)}` 
      }, { status: 400 });
    }

    // Verificar cooldown (1 saque por semana)
    if (wallet.last_withdrawal_at) {
      const lastWithdrawal = new Date(wallet.last_withdrawal_at);
      const nextAllowed = new Date(lastWithdrawal);
      nextAllowed.setDate(nextAllowed.getDate() + cooldownDays);

      if (new Date() < nextAllowed) {
        const daysLeft = Math.ceil((nextAllowed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return NextResponse.json({ 
          error: `Aguarde ${daysLeft} dia(s) para solicitar novo saque. Próximo saque disponível em: ${nextAllowed.toLocaleDateString('pt-BR')}` 
        }, { status: 400 });
      }
    }

    // Verificar se já tem saque pendente
    const { data: pendingRequest } = await supabase
      .from('withdrawal_requests')
      .select('id')
      .eq('user_email', email.toLowerCase())
      .in('status', ['pending', 'approved'])
      .single();

    if (pendingRequest) {
      return NextResponse.json({ 
        error: 'Você já possui uma solicitação de saque em andamento' 
      }, { status: 400 });
    }

    // Buscar nome do usuário
    const { data: user } = await supabase
      .from('users')
      .select('full_name, id')
      .eq('email', email.toLowerCase())
      .single();

    // Criar solicitação de saque
    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawal_requests')
      .insert([{
        wallet_id: wallet.id,
        user_id: user?.id,
        user_email: email.toLowerCase(),
        user_name: user?.full_name || email,
        amount,
        currency: currency.toUpperCase(),
        amount_usd: amount, // Assumindo 1:1 para stablecoins
        wallet_address,
        network: 'polygon',
        status: 'pending',
        user_notes: notes || null,
      }])
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar solicitação:', createError);
      return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 });
    }

    // TODO: Enviar notificação para admin (email)

    return NextResponse.json({
      success: true,
      message: 'Solicitação de saque criada com sucesso!',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
        created_at: withdrawal.created_at,
      }
    });

  } catch (error: any) {
    console.error('Erro ao solicitar saque:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - Histórico de saques do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || []
    });

  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
