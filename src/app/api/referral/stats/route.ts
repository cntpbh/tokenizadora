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

    // Buscar código do usuário
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_email', email)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json({
        success: true,
        hasCode: false,
        message: 'Usuário ainda não possui código de indicação'
      });
    }

    // Buscar todas as indicações
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_email', email)
      .order('created_at', { ascending: false });

    // Buscar todas as comissões
    const { data: commissions, error: commissionsError } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('referrer_email', email)
      .order('created_at', { ascending: false });

    // Calcular estatísticas
    const totalReferrals = referrals?.length || 0;
    const registeredReferrals = referrals?.filter(r => r.status === 'registered' || r.status === 'purchased').length || 0;
    const purchasedReferrals = referrals?.filter(r => r.status === 'purchased').length || 0;
    
    const totalCommissionPending = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0;
    const totalCommissionApproved = commissions?.filter(c => c.status === 'approved').reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0;
    const totalCommissionPaid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0;

    // Buscar configurações
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('*')
      .single();

    return NextResponse.json({
      success: true,
      hasCode: true,
      code: codeData.code,
      link: `https://token.ibedis.com.br?ref=${codeData.code}`,
      linkDocumentos: `https://token.ibedis.com.br/registro-documentos?ref=${codeData.code}`,
      stats: {
        total_referrals: totalReferrals,
        registered_referrals: registeredReferrals,
        purchased_referrals: purchasedReferrals,
        conversion_rate: totalReferrals > 0 ? ((purchasedReferrals / totalReferrals) * 100).toFixed(1) : 0,
        commission: {
          pending: totalCommissionPending.toFixed(2),
          approved: totalCommissionApproved.toFixed(2),
          paid: totalCommissionPaid.toFixed(2),
          total: (totalCommissionPending + totalCommissionApproved + totalCommissionPaid).toFixed(2)
        }
      },
      referrals: referrals?.map(r => ({
        id: r.id,
        email: r.referred_email,
        name: r.referred_name || 'Não informado',
        status: r.status,
        registration_date: r.registration_date,
        first_purchase_date: r.first_purchase_date,
        total_purchases: r.total_purchases,
        total_spent: r.total_spent,
        created_at: r.created_at
      })) || [],
      commissions: commissions?.map(c => ({
        id: c.id,
        referred_email: c.referred_email,
        purchase_type: c.purchase_type,
        purchase_amount: c.purchase_amount,
        commission_percent: c.commission_percent,
        commission_amount: c.commission_amount,
        status: c.status,
        created_at: c.created_at
      })) || [],
      settings: {
        commission_percent_tokens: settings?.commission_percent_tokens || 10,
        commission_percent_documents: settings?.commission_percent_documents || 10,
        min_withdrawal: settings?.min_withdrawal || 50
      }
    });

  } catch (error) {
    console.error('Erro na API referral/stats:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
