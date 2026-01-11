import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/supabase';

interface PaymentAlertData {
  type: 'pix' | 'crypto';
  buyerEmail: string;
  buyerName: string;
  amount: number;
  priceTotal: number;
  projectName: string;
  tokenId: number;
  paymentMethod?: string; // USDT, USDC, MATIC, PIX
  txHash?: string;
  paymentId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: PaymentAlertData = await request.json();

    // Buscar configurações de email
    const settings = await getSettings();
    
    if (!settings?.email_api_key || !settings?.contact_email) {
      console.log('Alertas de email não configurados');
      return NextResponse.json({ success: false, message: 'Email não configurado' });
    }

    // Montar conteúdo do email
    const typeLabel = data.type === 'pix' ? '💳 PIX' : '🔗 Crypto';
    const methodLabel = data.paymentMethod || (data.type === 'pix' ? 'PIX' : 'Crypto');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-pix { background: #dbeafe; color: #1d4ed8; }
          .badge-crypto { background: #f3e8ff; color: #7c3aed; }
          .info-box { background: white; border-radius: 8px; padding: 15px; margin: 15px 0; border: 1px solid #e5e7eb; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .info-row:last-child { border-bottom: none; }
          .label { color: #6b7280; }
          .value { font-weight: 600; color: #111827; }
          .amount { font-size: 24px; color: #059669; font-weight: bold; }
          a { color: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">💰 Novo Pagamento Recebido!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${typeLabel} • ${methodLabel}</p>
          </div>
          
          <div class="content">
            <p class="amount">R$ ${data.priceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Comprador</span>
                <span class="value">${data.buyerName}</span>
              </div>
              <div class="info-row">
                <span class="label">Email</span>
                <span class="value">${data.buyerEmail}</span>
              </div>
              <div class="info-row">
                <span class="label">Projeto</span>
                <span class="value">Token #${data.tokenId} - ${data.projectName}</span>
              </div>
              <div class="info-row">
                <span class="label">Quantidade</span>
                <span class="value">${data.amount} tokens</span>
              </div>
              <div class="info-row">
                <span class="label">Método</span>
                <span class="value">
                  <span class="badge ${data.type === 'pix' ? 'badge-pix' : 'badge-crypto'}">${methodLabel}</span>
                </span>
              </div>
              ${data.txHash ? `
              <div class="info-row">
                <span class="label">TX Hash</span>
                <span class="value" style="font-family: monospace; font-size: 11px;">
                  <a href="https://polygonscan.com/tx/${data.txHash}" target="_blank">${data.txHash.substring(0, 30)}...</a>
                </span>
              </div>
              ` : ''}
              ${data.paymentId && data.type === 'pix' ? `
              <div class="info-row">
                <span class="label">ID Pagamento</span>
                <span class="value" style="font-family: monospace; font-size: 11px;">${data.paymentId}</span>
              </div>
              ` : ''}
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="https://token.ibedis.com.br" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Ver no Painel Admin
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>IBEDIS Token Platform • Notificação automática de pagamento</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.email_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${settings.email_from_name || 'IBEDIS Token'} <${settings.email_from_address || 'noreply@ibedis.org'}>`,
        to: [settings.contact_email],
        subject: `💰 Novo Pagamento: R$ ${data.priceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via ${methodLabel}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Erro ao enviar alerta:', error);
      return NextResponse.json({ success: false, error });
    }

    const result = await emailResponse.json();
    console.log('Alerta de pagamento enviado:', result.id);

    return NextResponse.json({ success: true, emailId: result.id });

  } catch (error: any) {
    console.error('Erro ao enviar alerta de pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
