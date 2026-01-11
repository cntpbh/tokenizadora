import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK PIX RECEBIDO ===');
  
  try {
    let body: any;
    
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        console.log('Body não é JSON');
        return NextResponse.json({ ok: true });
      }
    }

    console.log('Body:', JSON.stringify(body));

    // Extrair payment ID
    let paymentId: string | null = null;
    
    if (body.data?.id) {
      paymentId = body.data.id.toString();
    } else if (body.id && body.type === 'payment') {
      paymentId = body.id.toString();
    }

    // Ignorar notificações que não são de pagamento
    if (body.type && body.type !== 'payment') {
      console.log('Tipo ignorado:', body.type);
      return NextResponse.json({ ok: true });
    }

    if (!paymentId) {
      console.log('Sem payment ID');
      return NextResponse.json({ ok: true });
    }

    // Ignorar IDs de teste
    if (paymentId === '123456' || paymentId.length < 8) {
      console.log('ID de teste ignorado:', paymentId);
      return NextResponse.json({ ok: true, message: 'Teste ignorado' });
    }

    console.log('Payment ID:', paymentId);

    // Consultar Mercado Pago
    const mp = new MercadoPagoConfig({ accessToken: MP_TOKEN });
    const payment = new Payment(mp);
    
    let info;
    try {
      info = await payment.get({ id: paymentId });
    } catch (mpError: any) {
      console.log('Erro ao consultar MP:', mpError.message);
      // Se o pagamento não existe, ignorar
      if (mpError.message?.includes('not_found') || mpError.status === 404) {
        return NextResponse.json({ ok: true, message: 'Pagamento não encontrado' });
      }
      throw mpError;
    }

    console.log('Status MP:', info.status);
    console.log('External Ref:', info.external_reference);

    if (info.status !== 'approved') {
      console.log('Pagamento não aprovado:', info.status);
      return NextResponse.json({ ok: true, status: info.status });
    }

    const registroId = info.external_reference;
    if (!registroId) {
      console.log('Sem external_reference');
      return NextResponse.json({ ok: true });
    }

    // Atualizar banco
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Verificar se já processado
    const { data: existente } = await supabase
      .from('document_registrations')
      .select('status')
      .eq('id', registroId)
      .single();

    if (existente?.status === 'completed') {
      console.log('Já processado');
      return NextResponse.json({ ok: true, message: 'Já processado' });
    }

    const { error } = await supabase
      .from('document_registrations')
      .update({
        payment_status: 'completed',
        status: 'completed',
        paid_at: new Date().toISOString(),
        tx_hash: `MP-${paymentId}`,
        registered_at: new Date().toISOString(),
      })
      .eq('id', registroId);

    if (error) {
      console.error('Erro update:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ REGISTRO COMPLETADO:', registroId);
    return NextResponse.json({ success: true, registroId });

  } catch (error: any) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    webhook: 'PIX IBEDIS',
    timestamp: new Date().toISOString()
  });
}
