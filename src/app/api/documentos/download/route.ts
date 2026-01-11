/**
 * API: Download Document Files
 * Permite download do documento carimbado e certificado
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'stamped', 'certificate', 'original'

  if (!code) {
    return NextResponse.json({ error: 'Código do certificado obrigatório' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 });
  }

  // Buscar registro
  const { data: registration, error } = await supabase
    .from('document_registrations')
    .select('*')
    .eq('certificate_code', code)
    .single();

  if (error || !registration) {
    return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
  }

  // Verificar se pagamento foi confirmado
  if (registration.status !== 'completed' && registration.payment_status !== 'completed') {
    return NextResponse.json({ error: 'Pagamento ainda não confirmado' }, { status: 402 });
  }

  // Retornar URLs de acordo com o tipo solicitado
  let url: string | null = null;
  let fileName: string = '';

  switch (type) {
    case 'stamped':
      url = registration.stamped_file_url;
      fileName = `${code}-carimbado.${registration.file_type?.includes('pdf') ? 'pdf' : 'jpg'}`;
      break;
    case 'certificate':
      url = registration.certificate_url;
      fileName = `${code}-certificado.pdf`;
      break;
    case 'original':
      url = registration.original_file_url;
      fileName = registration.file_name || `${code}-original`;
      break;
    default:
      // Retornar todas as URLs
      return NextResponse.json({
        success: true,
        certificate_code: registration.certificate_code,
        document_title: registration.document_title,
        files: {
          original: {
            url: registration.original_file_url,
            name: registration.file_name,
          },
          stamped: {
            url: registration.stamped_file_url,
            name: `${code}-carimbado.${registration.file_type?.includes('pdf') ? 'pdf' : 'jpg'}`,
          },
          certificate: {
            url: registration.certificate_url,
            name: `${code}-certificado.pdf`,
          },
        },
      });
  }

  if (!url) {
    return NextResponse.json({ error: 'Arquivo não disponível' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    url,
    fileName,
  });
}
