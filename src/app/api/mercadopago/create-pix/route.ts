import { NextRequest, NextResponse } from 'next/server';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      description, 
      email, 
      name,
      cpf,
      transactionId 
    } = body;

    if (!amount || !description || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: amount, description, email' },
        { status: 400 }
      );
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Access Token do Mercado Pago não configurado' },
        { status: 500 }
      );
    }

    // Criar pagamento PIX no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': transactionId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(amount),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: name?.split(' ')[0] || 'Cliente',
          last_name: name?.split(' ').slice(1).join(' ') || 'IBEDIS',
          identification: cpf ? {
            type: 'CPF',
            number: cpf.replace(/\D/g, '')
          } : undefined
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ibedis-token-platform.vercel.app'}/api/mercadopago/webhook`,
        external_reference: transactionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data);
      return NextResponse.json(
        { error: data.message || 'Erro ao criar pagamento PIX', details: data },
        { status: response.status }
      );
    }

    // Extrair dados do PIX
    const pixData = data.point_of_interaction?.transaction_data;

    return NextResponse.json({
      success: true,
      payment_id: data.id,
      status: data.status,
      qr_code: pixData?.qr_code,
      qr_code_base64: pixData?.qr_code_base64,
      ticket_url: pixData?.ticket_url,
      expiration_date: data.date_of_expiration,
      amount: data.transaction_amount,
    });

  } catch (error: any) {
    console.error('Erro ao criar PIX:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao criar PIX' },
      { status: 500 }
    );
  }
}
