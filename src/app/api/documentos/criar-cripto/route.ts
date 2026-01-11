import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://token.ibedis.com.br';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hash, titulo, categoria, nomeArquivo, tamanhoArquivo, tipoArquivo, nome, email, cpfCnpj, preco, moeda } = body;

    if (!hash || !titulo || !nome || !email) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    if (!NOWPAYMENTS_API_KEY) {
      return NextResponse.json({ success: false, error: 'NowPayments não configurado' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificado = `DOC-${timestamp.toString(36).toUpperCase()}-${random}`;

    const { data: registro, error: erroInsert } = await supabase
      .from('document_registrations')
      .insert({
        document_hash: hash,
        document_title: titulo,
        document_category: categoria || 'outro',
        file_name: nomeArquivo,
        file_size: tamanhoArquivo,
        file_type: tipoArquivo,
        requester_name: nome,
        requester_email: email,
        requester_cpf_cnpj: cpfCnpj || null,
        certificate_code: certificado,
        price: preco || 2.00,
        payment_method: 'crypto',
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (erroInsert) {
      console.error('Erro ao criar registro:', erroInsert);
      return NextResponse.json({ success: false, error: 'Erro ao criar registro' }, { status: 500 });
    }

    const invoiceResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: preco || 2.00,
        price_currency: 'usd',
        pay_currency: moeda || 'usdttrc20',
        order_id: registro.id,
        order_description: `IBEDIS - ${titulo.substring(0, 50)}`,
        ipn_callback_url: `${APP_URL}/api/documentos/webhook-cripto`,
        success_url: `${APP_URL}/registro-documentos?sucesso=true&codigo=${certificado}`,
        cancel_url: `${APP_URL}/registro-documentos?cancelado=true`,
      }),
    });

    const invoiceData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
      console.error('Erro NowPayments:', invoiceData);
      return NextResponse.json({ success: false, error: 'Erro ao criar pagamento cripto' }, { status: 500 });
    }

    await supabase
      .from('document_registrations')
      .update({ payment_id: invoiceData.id?.toString() })
      .eq('id', registro.id);

    return NextResponse.json({
      success: true,
      registroId: registro.id,
      certificado,
      paymentId: invoiceData.id,
      invoiceUrl: invoiceData.invoice_url,
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
