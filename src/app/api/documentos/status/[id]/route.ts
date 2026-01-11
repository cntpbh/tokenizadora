import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from('document_registrations')
      .select('id, certificate_code, document_title, payment_status, status, tx_hash, registered_at, paid_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      certificado: data.certificate_code,
      titulo: data.document_title,
      paymentStatus: data.payment_status,
      status: data.status,
      txHash: data.tx_hash,
      registradoEm: data.registered_at,
      pagoEm: data.paid_at,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
