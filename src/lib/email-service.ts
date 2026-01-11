// src/lib/email-service.ts
// Serviço de email centralizado com múltiplos provedores

import { getConfig, EMAIL_CONFIG } from './config';

// ============================================
// TIPOS
// ============================================
interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  provider?: string;
}

// ============================================
// PROVEDORES DE EMAIL
// ============================================

async function sendViaResend(
  apiKey: string,
  from: string,
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string
): Promise<EmailResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Resend:', data);
      return { success: false, error: data.message || 'Erro ao enviar via Resend', provider: 'resend' };
    }

    return { success: true, id: data.id, provider: 'resend' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMsg, provider: 'resend' };
  }
}

async function sendViaSendGrid(
  apiKey: string,
  from: string,
  to: string | string[],
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    const toArray = Array.isArray(to) ? to : [to];
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: toArray.map(email => ({ email })) }],
        from: { email: from },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || 'Erro ao enviar via SendGrid', provider: 'sendgrid' };
    }

    return { success: true, provider: 'sendgrid' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMsg, provider: 'sendgrid' };
  }
}

// ============================================
// FUNÇÃO PRINCIPAL DE ENVIO
// ============================================

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, html, replyTo, from } = params;
  
  // Tentar buscar configurações do banco, senão usar variáveis de ambiente
  let apiKey = process.env.RESEND_API_KEY;
  let provider = 'resend';
  let fromAddress = from || `${EMAIL_CONFIG.from_name} <${EMAIL_CONFIG.from_address}>`;
  
  try {
    const config = await getConfig();
    
    if (config.email_api_key) {
      apiKey = config.email_api_key;
    }
    if (config.email_provider) {
      provider = config.email_provider;
    }
    if (config.email_from_name && config.email_from_address) {
      fromAddress = from || `${config.email_from_name} <${config.email_from_address}>`;
    }
  } catch (e) {
    console.log('Usando configurações de email do .env');
  }
  
  // Verificar se temos API key
  if (!apiKey) {
    // Em desenvolvimento, apenas logar
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Email simulado:', { to, subject });
      return { success: true, id: 'dev-mock', provider: 'mock' };
    }
    return { success: false, error: 'API Key de email não configurada' };
  }
  
  // Selecionar provedor
  if (provider === 'sendgrid') {
    return sendViaSendGrid(apiKey, fromAddress.replace(/<|>/g, '').split(' ').pop() || '', to, subject, html);
  }
  
  // Default: Resend
  return sendViaResend(apiKey, fromAddress, to, subject, html, replyTo);
}

// ============================================
// TEMPLATES DE EMAIL
// ============================================

export const emailTemplates = {
  // Confirmação de registro de documento
  documentRegistration: (data: {
    name: string;
    documentTitle: string;
    certificateCode: string;
    verifyUrl: string;
  }) => ({
    subject: `📜 Documento Registrado - ${data.certificateCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #1a3f4d 0%, #2d5a6b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📜 IBEDIS Token</h1>
          <p style="color: #b8963c; margin: 10px 0 0 0; font-weight: bold;">Registro de Documento</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #1a3f4d; margin-top: 0;">Olá, ${data.name}!</h2>
          <p>Seu documento foi registrado com sucesso em blockchain.</p>
          
          <div style="background: #f8f9fa; border: 2px solid #1a3f4d; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">Código do Certificado</p>
            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #1a3f4d; font-family: monospace;">${data.certificateCode}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Documento:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${data.documentTitle}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verifyUrl}" style="display: inline-block; background: #b8963c; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">✅ Verificar Certificado</a>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Este é um email automático. Guarde o código do certificado para consultas futuras.
          </p>
        </div>
        <div style="background: #1a3f4d; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #a0a0a0; margin: 0; font-size: 12px;">IBEDIS - Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Certificado de compra de tokens
  tokenPurchase: (data: {
    name: string;
    projectName: string;
    tokenAmount: number;
    totalPrice: number;
    certificateCode: string;
    txHash?: string;
    paymentMethod: string;
  }) => ({
    subject: `🎉 Certificado de Aquisição - ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #1a3f4d 0%, #2d5a6b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🌱 IBEDIS Token</h1>
          <p style="color: #b8963c; margin: 10px 0 0 0; font-weight: bold;">Certificado de Aquisição</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #1a3f4d; margin-top: 0;">Parabéns, ${data.name}! 🎉</h2>
          <p>Sua aquisição de tokens foi concluída com sucesso.</p>
          
          <div style="background: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Código:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #1a3f4d; font-family: monospace;">${data.certificateCode}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Projeto:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">${data.projectName}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Quantidade:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">${data.tokenAmount} tokens</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Valor:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #b8963c;">R$ ${data.totalPrice.toFixed(2)}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Pagamento:</td><td style="padding: 8px 0;">${data.paymentMethod.toUpperCase()}</td></tr>
            </table>
          </div>
          
          ${data.txHash ? `
          <div style="background: #e8f4fd; border: 1px solid #b8d4e8; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1a3f4d;">
              <strong>🔗 Blockchain:</strong><br>
              <a href="https://polygonscan.com/tx/${data.txHash}" style="color: #1a3f4d; word-break: break-all;">${data.txHash}</a>
            </p>
          </div>
          ` : ''}
        </div>
        <div style="background: #1a3f4d; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #a0a0a0; margin: 0; font-size: 12px;">IBEDIS - Ativos Sustentáveis na Blockchain</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Pagamento confirmado
  paymentConfirmed: (data: {
    name: string;
    amount: number;
    certificateCode: string;
    type: 'document' | 'token';
  }) => ({
    subject: `✅ Pagamento Confirmado - ${data.certificateCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #059669; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Pagamento Confirmado!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1a3f4d;">Olá, ${data.name}!</h2>
          <p>Seu pagamento de <strong>R$ ${data.amount.toFixed(2)}</strong> foi confirmado.</p>
          <p>Código: <strong style="font-family: monospace; color: #1a3f4d;">${data.certificateCode}</strong></p>
          ${data.type === 'document' ? '<p>Seu documento foi registrado em blockchain e o certificado está disponível.</p>' : '<p>Seus tokens foram creditados com sucesso.</p>'}
        </div>
        <div style="background: #1a3f4d; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #a0a0a0; margin: 0; font-size: 12px;">IBEDIS Token</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Teste de configuração
  test: (data: {
    provider: string;
    fromEmail: string;
  }) => ({
    subject: `✅ Teste de Email - IBEDIS Token`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a3f4d; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Teste de Email</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
          <div style="font-size: 60px; margin: 20px 0;">🎉</div>
          <h2 style="color: #1a3f4d;">Configuração Funcionando!</h2>
          <p>Se você está vendo este email, tudo está configurado corretamente.</p>
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
            <p style="margin: 0; font-size: 14px;"><strong>Provedor:</strong> ${data.provider}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Remetente:</strong> ${data.fromEmail}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div style="background: #1a3f4d; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #a0a0a0; margin: 0; font-size: 12px;">IBEDIS Token - Plataforma de Ativos Sustentáveis</p>
        </div>
      </body>
      </html>
    `,
  }),
};

// ============================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================

export async function sendDocumentRegistrationEmail(
  email: string,
  name: string,
  documentTitle: string,
  certificateCode: string
): Promise<EmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://token.ibedis.com.br';
  const verifyUrl = `${appUrl}/certificado-documento/${certificateCode}`;
  
  const template = emailTemplates.documentRegistration({
    name,
    documentTitle,
    certificateCode,
    verifyUrl,
  });
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendTokenPurchaseEmail(
  email: string,
  data: {
    name: string;
    projectName: string;
    tokenAmount: number;
    totalPrice: number;
    certificateCode: string;
    txHash?: string;
    paymentMethod: string;
  }
): Promise<EmailResult> {
  const template = emailTemplates.tokenPurchase(data);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPaymentConfirmedEmail(
  email: string,
  name: string,
  amount: number,
  certificateCode: string,
  type: 'document' | 'token'
): Promise<EmailResult> {
  const template = emailTemplates.paymentConfirmed({
    name,
    amount,
    certificateCode,
    type,
  });
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendTestEmail(email: string): Promise<EmailResult> {
  const config = await getConfig();
  
  const template = emailTemplates.test({
    provider: config.email_provider,
    fromEmail: config.email_from_address,
  });
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}
