import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function verificarAssinatura(payload: any, signature: string): boolean {
  if (!IPN_SECRET) return true;
  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  const hmac = crypto.createHmac('sha512', IPN_SECRET);
  hmac.update(sorted);
  return hmac.digest('hex') === signature;
}

export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK CRIPTO RECEBIDO ===');
  
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-nowpayments-sig') || '';
    
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('JSON inválido');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Payload:', JSON.stringify(body));
    console.log('Status:', body.payment_status);
    console.log('Order ID:', body.order_id);

    if (IPN_SECRET && !verificarAssinatura(body, signature)) {
      console.error('Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { payment_status, order_id, payment_id, pay_currency } = body;

    if (payment_status !== 'finished') {
      console.log('Status não é finished:', payment_status);
      return NextResponse.json({ ok: true, status: payment_status });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (!order_id) {
      console.log('Sem order_id');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    const { data: registro } = await supabase
      .from('document_registrations')
      .select('*')
      .eq('id', order_id)
      .single();

    if (!registro) {
      console.error('Registro não encontrado:', order_id);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const txHash = `NP-${payment_id}-${pay_currency?.toUpperCase() || 'CRYPTO'}`;

    const { error: updateError } = await supabase
      .from('document_registrations')
      .update({
        payment_status: 'completed',
        status: 'completed',
        paid_at: new Date().toISOString(),
        tx_hash: txHash,
        registered_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Erro ao atualizar:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    console.log('✅ REGISTRO COMPLETADO:', order_id);
    console.log('TX Hash:', txHash);

    return NextResponse.json({ success: true, registroId: order_id });

  } catch (error: any) {
    console.error('Erro webhook Cripto:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    service: 'Webhook Cripto NowPayments', 
    status: 'ok',
    ipnConfigured: !!IPN_SECRET
  });
}
