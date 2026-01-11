import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Registrar uma nova indicação (quando alguém usa o link de indicação)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referral_code, referred_email, referred_name, user_id } = body;

    if (!referral_code || !referred_email) {
      return NextResponse.json({ 
        error: 'Código de indicação e email são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o código existe e está ativo
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', referral_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json({ 
        error: 'Código de indicação inválido ou inativo' 
      }, { status: 400 });
    }

    // Não permitir auto-indicação
    if (codeData.user_email.toLowerCase() === referred_email.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Não é possível usar seu próprio código de indicação' 
      }, { status: 400 });
    }

    // Verificar se já existe indicação para este email
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_email', referred_email.toLowerCase())
      .single();

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        message: 'Indicação já registrada anteriormente',
        already_exists: true
      });
    }

    // Criar nova indicação
    const { data: newReferral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_code: codeData.code,
        referrer_email: codeData.user_email,
        referred_email: referred_email.toLowerCase(),
        referred_name: referred_name || null,
        referred_user_id: user_id || null,
        status: user_id ? 'registered' : 'pending',
        registration_date: user_id ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar indicação:', insertError);
      return NextResponse.json({ error: 'Erro ao registrar indicação' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Indicação registrada com sucesso',
      referral_id: newReferral.id,
      referrer: codeData.user_email
    });

  } catch (error) {
    console.error('Erro na API referral/track:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar status da indicação (quando indicado faz registro ou compra)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referred_email, status, user_id, purchase_amount, purchase_type, transaction_id } = body;

    if (!referred_email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Buscar indicação existente
    const { data: referral, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_email', referred_email.toLowerCase())
      .single();

    if (fetchError || !referral) {
      return NextResponse.json({
        success: false,
        message: 'Indicação não encontrada'
      });
    }

    // Atualizar dados da indicação
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status === 'registered' && referral.status === 'pending') {
      updateData.status = 'registered';
      updateData.registration_date = new Date().toISOString();
      if (user_id) updateData.referred_user_id = user_id;
    }

    if (status === 'purchased') {
      updateData.status = 'purchased';
      if (!referral.first_purchase_date) {
        updateData.first_purchase_date = new Date().toISOString();
      }
      updateData.total_purchases = (referral.total_purchases || 0) + 1;
      updateData.total_spent = parseFloat(referral.total_spent || 0) + parseFloat(purchase_amount || 0);
    }

    // Atualizar indicação
    await supabase
      .from('referrals')
      .update(updateData)
      .eq('id', referral.id);

    // Se foi uma compra, criar comissão
    if (status === 'purchased' && purchase_amount > 0) {
      // Buscar configurações de comissão
      const { data: settings } = await supabase
        .from('referral_settings')
        .select('*')
        .single();

      const commissionPercent = purchase_type === 'document' 
        ? (settings?.commission_percent_documents || 10)
        : (settings?.commission_percent_tokens || 10);

      const commissionAmount = (parseFloat(purchase_amount) * commissionPercent) / 100;

      // Criar comissão
      await supabase
        .from('referral_commissions')
        .insert({
          referral_id: referral.id,
          referrer_email: referral.referrer_email,
          referred_email: referred_email.toLowerCase(),
          transaction_id: transaction_id || null,
          purchase_type: purchase_type || 'token',
          purchase_amount: purchase_amount,
          commission_percent: commissionPercent,
          commission_amount: commissionAmount,
          status: 'pending'
        });

      return NextResponse.json({
        success: true,
        message: 'Compra registrada e comissão criada',
        commission: {
          amount: commissionAmount,
          percent: commissionPercent
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Indicação atualizada'
    });

  } catch (error) {
    console.error('Erro na API referral/track PUT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
