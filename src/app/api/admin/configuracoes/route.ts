import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Buscar todas as configurações
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .order('chave');

    if (error) throw error;

    return NextResponse.json({ configuracoes: data || [] });
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Atualizar uma configuração
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chave, valor } = body;

    if (!chave || valor === undefined) {
      return NextResponse.json(
        { error: 'Chave e valor são obrigatórios' },
        { status: 400 }
      );
    }

    // Upsert (insere se não existe, atualiza se existe)
    const { data, error } = await supabase
      .from('configuracoes')
      .upsert(
        {
          chave,
          valor: String(valor),
          atualizado_em: new Date().toISOString()
        },
        { onConflict: 'chave' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Configuração atualizada com sucesso',
      configuracao: data
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
