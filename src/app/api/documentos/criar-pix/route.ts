import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  console.log('=== CRIAR PIX ===');
  
  try {
    const body = await request.json();
    console.log('Body recebido:', body);

    const { hash, titulo, nomeArquivo, tamanhoArquivo, tipoArquivo, nome, email, preco } = body;

    if (!hash || !titulo || !nome || !email) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    if (!MP_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json({ success: false, error: 'Mercado Pago não configurado' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Gerar código do certificado
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificado = `DOC-${timestamp.toString(36).toUpperCase()}-${random}`;

    // Criar registro no banco
    const { data: registro, error: erroInsert } = await supabase
      .from('document_registrations')
      .insert({
        document_hash: hash,
        document_title: titulo,
        document_category: 'documento',
        file_name: nomeArquivo || 'documento',
        file_size: tamanhoArquivo || 0,
        file_type: tipoArquivo || 'application/octet-stream',
        requester_name: nome,
        requester_email: email,
        certificate_code: certificado,
        price: preco || 1,
        payment_method: 'pix',
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (erroInsert) {
      console.error('Erro ao criar registro:', erroInsert);
      return NextResponse.json({ success: false, error: 'Erro ao criar registro: ' + erroInsert.message }, { status: 500 });
    }

    console.log('Registro criado:', registro.id);

    // Criar pagamento no Mercado Pago
    const mp = new MercadoPagoConfig({ accessToken: MP_TOKEN });
    const payment = new Payment(mp);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://token.ibedis.com.br';

    const pagamento = await payment.create({
      body: {
        transaction_amount: preco || 1,
        description: `IBEDIS - ${titulo.substring(0, 50)}`,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: nome.split(' ')[0] || 'Cliente',
          last_name: nome.split(' ').slice(1).join(' ') || 'IBEDIS',
        },
        notification_url: `${baseUrl}/api/documentos/webhook-pix`,
        external_reference: registro.id,
      },
    });

    console.log('Pagamento MP criado:', pagamento.id);
    console.log('Status:', pagamento.status);

    const pixData = pagamento.point_of_interaction?.transaction_data;

    if (!pixData?.qr_code) {
      console.error('QR Code não gerado');
      return NextResponse.json({ success: false, error: 'Erro ao gerar QR Code PIX' }, { status: 500 });
    }

    // Atualizar registro com ID do pagamento
    await supabase
      .from('document_registrations')
      .update({ payment_id: pagamento.id?.toString() })
      .eq('id', registro.id);

    console.log('PIX gerado com sucesso');

    return NextResponse.json({
      success: true,
      registroId: registro.id,
      certificado,
      paymentId: pagamento.id,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64,
    });

  } catch (error: any) {
    console.error('Erro criar-pix:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}
