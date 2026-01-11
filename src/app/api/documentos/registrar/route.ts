// src/app/api/documentos/registrar/route.ts
// API completa de registro de documentos com IPFS + Blockchain

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadToPinata, uploadJSONToPinata, isIPFSConfigured, getIPFSUrl } from '@/lib/ipfs-service';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://token.ibedis.com.br';

// Polygon contract para registro (opcional)
const POLYGON_RPC = 'https://polygon-rpc.com';
const REGISTRY_CONTRACT = process.env.DOCUMENT_REGISTRY_CONTRACT || '';

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

function generateCertificateCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}

// GET - Retorna preço e configurações
export async function GET() {
  const supabase = getSupabase();

  let price = 0.90; // Preço padrão

  if (supabase) {
    try {
      const { data } = await supabase
        .from('document_registry_config')
        .select('config_value')
        .eq('config_key', 'price_pix')
        .eq('is_active', true)
        .single();

      if (data?.config_value?.price) {
        price = Number(data.config_value.price);
      }
    } catch (e) {
      console.log('Usando preço padrão');
    }
  }

  return NextResponse.json({
    success: true,
    price,
    currency: 'BRL',
    ipfs_enabled: isIPFSConfigured(),
    features: ['hash_sha256', 'certificate_pdf', 'ipfs_storage', 'qr_code'],
    max_file_size_mb: 50,
  });
}

// POST - Criar registro de documento
export async function POST(request: NextRequest) {
  console.log('=== REGISTRO DE DOCUMENTO ===');

  try {
    const formData = await request.formData();

    // Extrair dados do form
    const file = formData.get('file') as File | null;
    const titulo = formData.get('titulo') as string;
    const nome = formData.get('nome') as string;
    const email = formData.get('email') as string;
    const cpfCnpj = formData.get('cpfCnpj') as string;
    const hash = formData.get('hash') as string;
    const categoria = formData.get('categoria') as string || 'documento';
    const descricao = formData.get('descricao') as string;

    // Validações
    if (!hash || !titulo || !nome || !email) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: hash, titulo, nome, email'
      }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Banco de dados não configurado'
      }, { status: 500 });
    }

    // Buscar preço configurado
    let preco = 0.90;
    try {
      const { data: configData } = await supabase
        .from('document_registry_config')
        .select('config_value')
        .eq('config_key', 'price_pix')
        .eq('is_active', true)
        .single();

      if (configData?.config_value?.price) {
        preco = Number(configData.config_value.price);
      }
    } catch (e) { }

    // Gerar código do certificado
    const certificado = generateCertificateCode();
    const dataRegistro = new Date().toISOString();

    // Preparar dados do arquivo
    let fileName = '';
    let fileSize = 0;
    let fileType = '';

    if (file) {
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;
    }

    // ==========================================
    // 1. UPLOAD PARA IPFS (se configurado e arquivo presente)
    // ==========================================
    let ipfsData = {
      documentHash: null as string | null,
      documentUrl: null as string | null,
      metadataHash: null as string | null,
      metadataUrl: null as string | null,
    };

    if (file && isIPFSConfigured()) {
      console.log('📤 Fazendo upload para IPFS...');

      // Upload do documento
      const docUpload = await uploadToPinata(file, {
        certificate: certificado,
        sha256: hash,
        owner: nome,
        date: dataRegistro,
      });

      if (docUpload.success) {
        ipfsData.documentHash = docUpload.ipfsHash || null;
        ipfsData.documentUrl = docUpload.gatewayUrl || null;
        console.log('✅ Documento no IPFS:', docUpload.ipfsHash);
      }

      // Upload da metadata JSON
      const metadata = {
        name: titulo,
        description: descricao || `Documento registrado em ${new Date().toLocaleDateString('pt-BR')}`,
        certificate_code: certificado,
        document_hash: hash,
        owner: {
          name: nome,
          email: email,
          cpf_cnpj: cpfCnpj || null,
        },
        file: {
          name: fileName,
          size: fileSize,
          type: fileType,
          ipfs_hash: ipfsData.documentHash,
        },
        registration: {
          date: dataRegistro,
          platform: 'IBEDIS Token',
          version: '2.0',
        },
        verification_url: `${APP_URL}/certificado-documento/${certificado}`,
      };

      const metaUpload = await uploadJSONToPinata(metadata, `${certificado}_metadata.json`);
      if (metaUpload.success) {
        ipfsData.metadataHash = metaUpload.ipfsHash || null;
        ipfsData.metadataUrl = metaUpload.gatewayUrl || null;
        console.log('✅ Metadata no IPFS:', metaUpload.ipfsHash);
      }
    }

    // ==========================================
    // 2. CRIAR REGISTRO NO BANCO DE DADOS
    // ==========================================
    const { data: registro, error: erroInsert } = await supabase
      .from('document_registrations')
      .insert({
        document_hash: hash,
        document_title: titulo,
        document_description: descricao || null,
        document_category: categoria,
        file_name: fileName || null,
        file_size: fileSize || null,
        file_type: fileType || null,
        requester_name: nome,
        requester_email: email,
        requester_cpf_cnpj: cpfCnpj || null,
        certificate_code: certificado,
        price: preco,
        payment_method: 'pix',
        payment_status: 'pending',
        status: 'pending',
        // Dados IPFS
        ipfs_document_hash: ipfsData.documentHash,
        ipfs_document_url: ipfsData.documentUrl,
        ipfs_metadata_hash: ipfsData.metadataHash,
        ipfs_metadata_url: ipfsData.metadataUrl,
      })
      .select()
      .single();

    if (erroInsert) {
      console.error('Erro ao criar registro:', erroInsert);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar registro: ' + erroInsert.message
      }, { status: 500 });
    }

    console.log('✅ Registro criado:', registro.id);

    // ==========================================
    // 3. CRIAR PIX NO MERCADO PAGO
    // ==========================================
    let pixData = null;

    if (MP_TOKEN) {
      try {
        const { MercadoPagoConfig, Payment } = await import('mercadopago');
        const mp = new MercadoPagoConfig({ accessToken: MP_TOKEN });
        const payment = new Payment(mp);

        const pagamento = await payment.create({
          body: {
            transaction_amount: preco,
            description: `IBEDIS Doc - ${titulo.substring(0, 50)}`,
            payment_method_id: 'pix',
            payer: {
              email: email,
              first_name: nome.split(' ')[0] || 'Cliente',
              last_name: nome.split(' ').slice(1).join(' ') || 'IBEDIS',
            },
            notification_url: `${APP_URL}/api/documentos/webhook-pix`,
            external_reference: registro.id,
          },
        });

        const pixInfo = pagamento.point_of_interaction?.transaction_data;

        if (pixInfo?.qr_code) {
          pixData = {
            payment_id: pagamento.id,
            qr_code: pixInfo.qr_code,
            qr_code_base64: pixInfo.qr_code_base64,
          };

          // Atualizar registro com ID do pagamento
          await supabase
            .from('document_registrations')
            .update({ payment_id: pagamento.id?.toString() })
            .eq('id', registro.id);

          console.log('✅ PIX gerado:', pagamento.id);
        }
      } catch (mpError: any) {
        console.error('Erro MercadoPago:', mpError?.message || mpError);
        console.error('Detalhes:', JSON.stringify(mpError?.cause || mpError, null, 2));
        // Armazena erro para retornar ao frontend
        pixData = { error: mpError?.message || 'Falha ao gerar PIX' } as any;
      }
    }

    // ==========================================
    // 4. RETORNAR RESULTADO
    // ==========================================
    return NextResponse.json({
      success: true,
      registro: {
        id: registro.id,
        certificado: certificado,
        hash: hash,
        preco: preco,
        status: 'pending',
      },
      ipfs: {
        enabled: isIPFSConfigured(),
        document_hash: ipfsData.documentHash,
        document_url: ipfsData.documentUrl,
        metadata_hash: ipfsData.metadataHash,
        metadata_url: ipfsData.metadataUrl,
      },
      pix: pixData?.error ? null : (pixData ? {
        payment_id: pixData.payment_id,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
      } : null),
      pix_error: pixData?.error || null,
      verificacao_url: `${APP_URL}/certificado-documento/${certificado}`,
    });

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno'
    }, { status: 500 });
  }
}
