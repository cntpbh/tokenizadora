// src/app/api/mercadopago/webhook/route.ts
// WEBHOOK MERCADOPAGO - VERSÃO CORRIGIDA

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(request: NextRequest) {
  console.log('\n=== 💳 WEBHOOK MERCADOPAGO ===');
  
  try {
    const body = await request.json();
    console.log('📥 Payload recebido:', JSON.stringify(body, null, 2));
    
    // MercadoPago envia notificações em formato: { action, data: { id }, type }
    if (body.type !== 'payment' && body.action !== 'payment.updated') {
      console.log('⚠️ Evento ignorado:', body.type || body.action);
      return NextResponse.json({ message: 'Evento ignorado' });
    }
    
    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('⚠️ Sem payment ID');
      return NextResponse.json({ message: 'Sem payment ID' });
    }
    
    console.log('🔍 Buscando pagamento:', paymentId);
    
    // Buscar informações do pagamento no MercadoPago
    if (!MP_TOKEN) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json({ error: 'MP token not configured' }, { status: 500 });
    }
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`
      }
    });
    
    if (!mpResponse.ok) {
      console.error('❌ Erro ao buscar pagamento no MP');
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    const payment = await mpResponse.json();
    console.log('💰 Status do pagamento:', payment.status);
    console.log('🆔 External reference:', payment.external_reference);
    
    // Verificar se foi aprovado
    if (payment.status !== 'approved') {
      console.log('⏳ Pagamento ainda não aprovado');
      return NextResponse.json({ message: 'Payment not approved yet' });
    }
    
    // Buscar registro no banco
    const supabase = getSupabase();
    if (!supabase) {
      console.error('❌ Supabase não configurado');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const registroId = payment.external_reference;
    if (!registroId) {
      console.error('❌ Sem external_reference');
      return NextResponse.json({ error: 'No external reference' }, { status: 400 });
    }
    
    const { data: registro, error } = await supabase
      .from('document_registrations')
      .select('*')
      .eq('id', registroId)
      .single();
    
    if (error || !registro) {
      console.error('❌ Registro não encontrado:', registroId);
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    
    // Verificar se já foi processado
    if (registro.payment_status === 'completed') {
      console.log('✅ Pagamento já processado anteriormente');
      return NextResponse.json({ message: 'Already processed' });
    }
    
    console.log('✅ Atualizando registro para completed...');
    
    // Atualizar status
    const { error: updateError } = await supabase
      .from('document_registrations')
      .update({
        payment_status: 'completed',
        status: 'completed',
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', registroId);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    console.log('🎉 PAGAMENTO CONFIRMADO!');
    console.log('📧 Email:', registro.user_email);
    console.log('🎫 Certificado:', registro.certificate_code);
    
    // TODO: Enviar email com certificado (se Resend configurado)
    // TODO: Registrar na blockchain (se configurado)
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment processed successfully',
      certificate_code: registro.certificate_code
    });
    
  } catch (error: any) {
    console.error('❌ ERRO NO WEBHOOK:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// GET para teste
export async function GET() {
  return NextResponse.json({
    service: 'MercadoPago Webhook',
    status: 'active',
    method: 'POST only'
  });
}
