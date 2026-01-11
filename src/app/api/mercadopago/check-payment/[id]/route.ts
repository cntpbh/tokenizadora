import { NextRequest, NextResponse } from 'next/server';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Access Token do Mercado Pago não configurado' },
        { status: 500 }
      );
    }

    // Buscar status do pagamento
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Pagamento não encontrado', details: errorData },
        { status: response.status }
      );
    }

    const payment = await response.json();

    return NextResponse.json({
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      amount: payment.transaction_amount,
      date_approved: payment.date_approved,
      date_created: payment.date_created,
      external_reference: payment.external_reference,
      payer_email: payment.payer?.email,
    });

  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}
