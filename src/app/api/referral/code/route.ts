import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Gerar código único de 8 caracteres
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - Obter código de indicação do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Buscar código existente
    const { data: existing, error: fetchError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_email', email)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        code: existing.code,
        stats: {
          total_referrals: existing.total_referrals,
          total_purchases: existing.total_purchases,
          total_commission: existing.total_commission
        },
        link: `https://token.ibedis.com.br?ref=${existing.code}`
      });
    }

    // Se não existe, gerar novo código
    let code = generateCode();
    let attempts = 0;

    // Garantir código único
    while (attempts < 10) {
      const { data: check } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', code)
        .single();

      if (!check) break;
      code = generateCode();
      attempts++;
    }

    // Buscar user_id se existir
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // Criar novo código
    const { data: newCode, error: insertError } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user?.id || null,
        user_email: email,
        code: code
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar código:', insertError);
      return NextResponse.json({ error: 'Erro ao criar código de indicação' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code: newCode.code,
      stats: {
        total_referrals: 0,
        total_purchases: 0,
        total_commission: 0
      },
      link: `https://token.ibedis.com.br?ref=${newCode.code}`,
      isNew: true
    });

  } catch (error) {
    console.error('Erro na API referral/code:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Validar código de indicação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('referral_codes')
      .select('code, user_email, is_active')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Código inválido ou inativo' });
    }

    return NextResponse.json({
      valid: true,
      code: data.code,
      referrer_email: data.user_email
    });

  } catch (error) {
    console.error('Erro ao validar código:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
