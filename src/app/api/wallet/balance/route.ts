import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Buscar ou criar carteira
    let { data: wallet, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      // Carteira não existe, criar
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert([{
          user_id: user?.id,
          user_email: email.toLowerCase(),
        }])
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Erro ao criar carteira' }, { status: 500 });
      }

      wallet = newWallet;
    }

    // Buscar configurações de saque
    const { data: settings } = await supabase
      .from('withdrawal_settings')
      .select('*')
      .single();

    // Verificar se pode sacar (cooldown)
    let canWithdraw = true;
    let nextWithdrawalDate = null;
    
    if (wallet?.last_withdrawal_at) {
      const lastWithdrawal = new Date(wallet.last_withdrawal_at);
      const cooldownDays = settings?.withdrawal_cooldown_days || 7;
      const nextDate = new Date(lastWithdrawal);
      nextDate.setDate(nextDate.getDate() + cooldownDays);
      
      if (new Date() < nextDate) {
        canWithdraw = false;
        nextWithdrawalDate = nextDate.toISOString();
      }
    }

    // Verificar se há saque pendente
    const { data: pendingWithdrawal } = await supabase
      .from('withdrawal_requests')
      .select('id, amount, currency, status, created_at')
      .eq('user_email', email.toLowerCase())
      .in('status', ['pending', 'approved'])
      .single();

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance_matic: parseFloat(wallet.balance_matic || 0),
        balance_usdt: parseFloat(wallet.balance_usdt || 0),
        balance_usdc: parseFloat(wallet.balance_usdc || 0),
        commission_balance: parseFloat(wallet.commission_balance || 0),
        total_withdrawn: parseFloat(wallet.total_withdrawn || 0),
        total_commission_earned: parseFloat(wallet.total_commission_earned || 0),
      },
      withdrawal: {
        canWithdraw: canWithdraw && !pendingWithdrawal,
        nextWithdrawalDate,
        pendingWithdrawal,
        minAmount: settings?.min_withdrawal_usd || 20,
        maxAmount: settings?.max_withdrawal_usd || 1000,
        cooldownDays: settings?.withdrawal_cooldown_days || 7,
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar saldo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
