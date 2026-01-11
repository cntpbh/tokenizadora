import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Templates de email
const templates = {
  certificate: (data: any) => ({
    subject: `🎉 Certificado de Aquisição - ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🌱 ${data.platformName || 'IBEDIS Token'}</h1>
          <p style="color: #a7f3d0; margin: 10px 0 0 0;">Certificado de Aquisição de Tokens</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #059669; margin-top: 0;">Parabéns, ${data.holderName}! 🎉</h2>
          <p>Sua aquisição de tokens foi concluída com sucesso.</p>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Código:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #059669; font-family: monospace; font-size: 16px;">${data.certificateCode}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Projeto:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.projectName}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Quantidade:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.tokenAmount} tokens</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Valor:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">R$ ${data.totalPrice}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Pagamento:</td><td style="padding: 8px 0;">${data.paymentMethod?.toUpperCase()}</td></tr>
            </table>
          </div>
          ${data.txHash ? `<div style="background: #f3e8ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 15px; margin: 20px 0;"><p style="margin: 0; font-size: 14px; color: #7c3aed;"><strong>🔗 Blockchain:</strong> <a href="https://polygonscan.com/tx/${data.txHash}" style="color: #7c3aed;">${data.txHash.slice(0, 20)}...</a></p></div>` : ''}
          <div style="text-align: center; margin: 30px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ibedis-token-platform.vercel.app'}" style="display: inline-block; background: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">📜 Ver Certificado</a></div>
        </div>
        <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;"><p style="color: #9ca3af; margin: 0; font-size: 12px;">${data.platformName || 'IBEDIS Token'} - Ativos Sustentáveis na Blockchain</p></div>
      </body>
      </html>
    `,
  }),

  welcome: (data: any) => ({
    subject: `Bem-vindo ao ${data.platformName || 'IBEDIS Token'}! 🌱`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 ${data.platformName || 'IBEDIS Token'}</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #059669;">Olá, ${data.userName}! 👋</h2>
          <p>Sua conta foi criada com sucesso!</p>
          <div style="text-align: center; margin: 30px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ibedis-token-platform.vercel.app'}" style="display: inline-block; background: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">🚀 Acessar Plataforma</a></div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (data: any) => ({
    subject: `🔐 Redefinir Senha - ${data.platformName || 'IBEDIS Token'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 ${data.platformName || 'IBEDIS Token'}</h1>
          <p style="color: #a7f3d0; margin: 10px 0 0 0;">Redefinição de Senha</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Você solicitou a redefinição de senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" style="display: inline-block; background: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">🔑 Redefinir Senha</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este link expira em 1 hora.</p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${data.resetLink}</p>
        </div>
      </body>
      </html>
    `,
  }),

  test: (data: any) => ({
    subject: `✅ Teste de Email - ${data.platformName || 'IBEDIS Token'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Teste de Email</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
          <div style="font-size: 60px; margin: 20px 0;">🎉</div>
          <h2 style="color: #059669;">Configuração Funcionando!</h2>
          <p>Se você está vendo este email, tudo está configurado corretamente.</p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
            <p style="margin: 0; font-size: 14px;"><strong>Provedor:</strong> ${data.provider || 'Resend'}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Remetente:</strong> ${data.fromEmail}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Enviar via Resend
async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Erro Resend:', data);
    throw new Error(data.message || 'Erro ao enviar via Resend');
  }

  return data;
}

// Enviar via SendGrid
async function sendViaSendGrid(apiKey: string, from: string, to: string, subject: string, html: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Erro ao enviar via SendGrid');
  }

  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, template, data } = body;

    if (!to || !template) {
      return NextResponse.json(
        { error: 'Email destinatário e template são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar configurações de email do banco
    let settings: any = null;
    
    try {
      const { data: dbSettings, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1);
      
      if (!error && dbSettings && dbSettings.length > 0) {
        settings = dbSettings[0];
        console.log('Configurações encontradas no banco:', { 
          provider: settings.email_provider,
          hasKey: !!settings.email_api_key 
        });
      } else {
        console.log('Nenhuma configuração no banco, usando variáveis de ambiente');
      }
    } catch (dbError) {
      console.log('Erro ao buscar do banco:', dbError);
    }

    // Usar configurações do banco OU variáveis de ambiente
    const email_provider = settings?.email_provider || process.env.EMAIL_PROVIDER || 'resend';
    const email_api_key = settings?.email_api_key || process.env.RESEND_API_KEY;
    const email_from_address = settings?.email_from_address || process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
    const email_from_name = settings?.email_from_name || process.env.EMAIL_FROM_NAME || 'IBEDIS Token';
    const platform_name = settings?.platform_name || 'IBEDIS Token';

    console.log('Usando configurações:', { 
      provider: email_provider, 
      fromAddress: email_from_address,
      hasApiKey: !!email_api_key 
    });

    if (!email_api_key) {
      return NextResponse.json(
        { error: 'API Key de email não configurada. Adicione RESEND_API_KEY nas variáveis de ambiente do Vercel.' },
        { status: 500 }
      );
    }

    // Gerar conteúdo do email
    const templateFn = templates[template as keyof typeof templates];
    if (!templateFn) {
      return NextResponse.json(
        { error: `Template "${template}" não encontrado` },
        { status: 400 }
      );
    }

    const emailContent = templateFn({ 
      ...data, 
      platformName: platform_name,
      provider: email_provider,
      fromEmail: email_from_address,
    });
    
    const from = email_from_name ? `${email_from_name} <${email_from_address}>` : email_from_address;

    // Enviar email
    let result;
    
    if (email_provider === 'sendgrid') {
      result = await sendViaSendGrid(email_api_key, email_from_address, to, emailContent.subject, emailContent.html);
    } else {
      // Default: Resend
      result = await sendViaResend(email_api_key, from, to, emailContent.subject, emailContent.html);
    }

    // Log do envio
    try {
      await supabase.from('email_logs').insert({
        to_email: to,
        template,
        provider: email_provider,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (e) {}

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso!',
      provider: email_provider,
    });

  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar email' },
      { status: 500 }
    );
  }
}
