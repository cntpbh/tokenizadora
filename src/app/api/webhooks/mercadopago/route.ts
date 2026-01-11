import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCertificadoPDF } from '@/lib/pdf-generator';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Webhook MercadoPago recebido:', body);

    // Verificar tipo de evento
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = String(body.data.id);

      // Buscar documento pendente
      const { data: doc, error } = await supabase
        .from('documentos_registrados')
        .select('*')
        .eq('mercadopago_payment_id', paymentId)
        .eq('status', 'pendente')
        .single();

      if (error || !doc) {
        console.log('❌ Documento não encontrado para payment:', paymentId);
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        );
      }

      // Atualizar status
      await supabase
        .from('documentos_registrados')
        .update({
          status: 'confirmado',
          confirmado_em: new Date().toISOString()
        })
        .eq('id', doc.id);

      console.log('✅ Documento confirmado:', doc.id);

      // Gerar certificado PDF (se configurado)
      if (process.env.RESEND_API_KEY && doc.ipfs_hash) {
        try {
          const pdfBuffer = await generateCertificadoPDF(doc);

          // Enviar email
          const emailResult = await resend.emails.send({
            from: 'IBEDIS Token <noreply@ibedis.org>',
            to: doc.email_usuario,
            subject: `Certificado de Registro IPFS - ${doc.titulo}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">🎉 Registro Confirmado!</h2>
                
                <p><strong>Documento:</strong> ${doc.titulo}</p>
                <p><strong>Hash SHA-256:</strong> <code>${doc.hash}</code></p>
                <p><strong>IPFS:</strong> <a href="https://gateway.pinata.cloud/ipfs/${doc.ipfs_hash}">${doc.ipfs_hash}</a></p>
                <p><strong>Data:</strong> ${new Date(doc.criado_em).toLocaleString('pt-BR')}</p>
                
                <p style="margin-top: 20px;">
                  O certificado em PDF está anexo a este email.
                </p>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                  IBEDIS - Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável
                </p>
              </div>
            `,
            attachments: [
              {
                filename: `certificado-${doc.hash.substring(0, 8)}.pdf`,
                content: pdfBuffer
              }
            ]
          });

          console.log('📧 Email enviado:', emailResult);
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Não falha o webhook se email falhar
        }
      }

      return NextResponse.json({
        success: true,
        documento_id: doc.id
      });
    }

    return NextResponse.json({ message: 'Evento ignorado' });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
