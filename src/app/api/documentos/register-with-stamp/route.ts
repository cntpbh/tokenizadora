/**
 * API: Register Document with Stamp
 * Nova versão que carimba o documento e gera certificado PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stampDocument } from '@/lib/document-stamper';
import { generateCertificate } from '@/lib/certificate-generator';
import { uploadStampedDocument, uploadCertificate, uploadOriginalDocument } from '@/lib/storage-service';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://token.ibedis.com.br';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

function generateCertificateCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Receber FormData com o arquivo
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const documentTitle = formData.get('documentTitle') as string;
    const documentDescription = formData.get('documentDescription') as string;
    const documentCategory = formData.get('documentCategory') as string;
    const requesterName = formData.get('requesterName') as string;
    const requesterEmail = formData.get('requesterEmail') as string;
    const requesterCpfCnpj = formData.get('requesterCpfCnpj') as string;
    const documentHash = formData.get('documentHash') as string;
    const paymentMethod = formData.get('paymentMethod') as string || 'pix';
    const price = parseFloat(formData.get('price') as string) || 4.90;

    // Validações
    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    }
    
    if (!documentHash || !documentTitle || !requesterName || !requesterEmail) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const fileType = file.type;
    if (!fileType.includes('pdf') && !fileType.includes('jpeg') && !fileType.includes('jpg')) {
      return NextResponse.json({ error: 'Apenas PDF e JPG são aceitos' }, { status: 400 });
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 });
    }

    // Gerar código do certificado
    const certificateCode = generateCertificateCode();
    const registrationDate = new Date().toISOString();

    // Converter arquivo para buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 1. Carimbar o documento
    const stampResult = await stampDocument(fileBuffer, fileType, {
      certificateCode,
      documentHash,
      registrationDate,
      requesterName,
    });

    if (!stampResult.success || !stampResult.stampedBuffer) {
      return NextResponse.json({ 
        error: 'Erro ao carimbar documento: ' + stampResult.error 
      }, { status: 500 });
    }

    // 2. Gerar certificado PDF
    const certificatePdf = await generateCertificate({
      certificateCode,
      documentTitle,
      documentHash,
      requesterName,
      requesterEmail,
      registrationDate,
      fileName: file.name,
      fileSize: file.size,
    });

    // 3. Upload dos arquivos para o Storage
    const [stampedUpload, certificateUpload, originalUpload] = await Promise.all([
      uploadStampedDocument(stampResult.stampedBuffer, certificateCode, file.name, fileType),
      uploadCertificate(certificatePdf, certificateCode),
      uploadOriginalDocument(fileBuffer, certificateCode, file.name, fileType),
    ]);

    if (!stampedUpload.success) {
      console.error('Erro upload carimbado:', stampedUpload.error);
    }
    if (!certificateUpload.success) {
      console.error('Erro upload certificado:', certificateUpload.error);
    }

    // 4. Criar registro no banco
    const { data: registration, error: insertError } = await supabase
      .from('document_registrations')
      .insert({
        requester_name: requesterName,
        requester_email: requesterEmail,
        requester_cpf_cnpj: requesterCpfCnpj || null,
        document_title: documentTitle,
        document_description: documentDescription || null,
        document_category: documentCategory || 'outro',
        file_name: file.name,
        file_size: file.size,
        file_type: fileType,
        document_hash: documentHash,
        certificate_code: certificateCode,
        price: price,
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending',
        // URLs dos arquivos
        original_file_url: originalUpload.url || null,
        stamped_file_url: stampedUpload.url || null,
        certificate_url: certificateUpload.url || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar registro:', insertError);
      return NextResponse.json({ error: 'Erro ao criar registro', details: insertError.message }, { status: 500 });
    }

    // 5. Gerar PIX se necessário
    let pixData = null;
    if (paymentMethod === 'pix' && MERCADOPAGO_ACCESS_TOKEN) {
      try {
        const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `doc-${registration.id}`,
          },
          body: JSON.stringify({
            transaction_amount: price,
            description: `Registro Documento - ${documentTitle.substring(0, 50)}`,
            payment_method_id: 'pix',
            payer: {
              email: requesterEmail,
              first_name: requesterName.split(' ')[0] || 'Cliente',
              last_name: requesterName.split(' ').slice(1).join(' ') || 'IBEDIS',
            },
            notification_url: `${APP_URL}/api/documents/webhook`,
            external_reference: registration.id,
          }),
        });

        const pixResult = await pixResponse.json();

        if (pixResponse.ok) {
          pixData = {
            payment_id: pixResult.id,
            qr_code: pixResult.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: pixResult.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: pixResult.point_of_interaction?.transaction_data?.ticket_url,
          };

          await supabase.from('document_registrations')
            .update({ payment_id: pixResult.id.toString() })
            .eq('id', registration.id);
        }
      } catch (mpError) {
        console.error('Erro MercadoPago:', mpError);
      }
    }

    // 6. Crypto data se necessário
    let cryptoData = null;
    if (paymentMethod === 'crypto') {
      cryptoData = {
        wallet_address: '0xc1b859a61F7Ca2353047147d9B2160c8bfc2460C',
        network: 'Polygon',
        accepted_tokens: ['MATIC', 'USDT', 'USDC'],
      };
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        certificate_code: certificateCode,
        document_hash: documentHash,
        status: 'pending',
        price: price,
      },
      files: {
        original_url: originalUpload.url,
        stamped_url: stampedUpload.url,
        certificate_url: certificateUpload.url,
      },
      pix: pixData,
      crypto: cryptoData,
    });

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    version: 'v2-with-stamp',
    price: 4.90,
    supported_types: ['application/pdf', 'image/jpeg'],
    max_size_mb: 10,
    features: ['stamp', 'certificate', 'storage'],
  });
}
