'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface Registro {
  id: string;
  certificate_code: string;
  document_title: string;
  document_hash: string;
  document_category: string;
  requester_name: string;
  requester_email: string;
  file_name: string;
  payment_method: string;
  tx_hash: string;
  status: string;
  created_at: string;
  registered_at: string;
}

export default function Certificado() {
  const params = useParams();
  const codigo = params.codigo as string;
  
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      if (!supabase || !codigo) return;

      const { data, error } = await supabase
        .from('document_registrations')
        .select('*')
        .eq('certificate_code', codigo)
        .single();

      if (error || !data) {
        setErro('Certificado não encontrado');
      } else if (data.status !== 'completed') {
        setErro('Registro ainda não foi confirmado');
      } else {
        setRegistro(data);
      }
      
      setCarregando(false);
    }

    carregar();
  }, [codigo]);

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-pulse">⏳</span>
          <p className="mt-4 text-gray-600">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-6xl">❌</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">{erro}</h1>
          <p className="text-gray-500 mt-2">Código: {codigo}</p>
          <a href="/registro-documentos" className="mt-6 inline-block px-6 py-2 bg-emerald-500 text-white rounded-lg">
            Fazer novo registro
          </a>
        </div>
      </div>
    );
  }

  if (!registro) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📜</span>
            </div>
            <h1 className="text-3xl font-bold">CERTIFICADO DE AUTENTICIDADE</h1>
            <p className="text-emerald-100 mt-2">Registro Digital de Documento</p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500">Código do Certificado</p>
              <p className="text-3xl font-mono font-bold text-emerald-600 mt-1">{registro.certificate_code}</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full font-semibold flex items-center gap-2">
                <span>✅</span> DOCUMENTO VERIFICADO E REGISTRADO
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Título do Documento</p>
                <p className="font-semibold text-gray-800">{registro.document_title}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Hash SHA-256 (Impressão Digital)</p>
                <p className="font-mono text-sm text-gray-700 break-all">{registro.document_hash}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Solicitante</p>
                  <p className="font-semibold text-gray-800">{registro.requester_name}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="font-semibold text-gray-800 capitalize">{registro.document_category}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Data de Registro</p>
                  <p className="font-semibold text-gray-800">{formatarData(registro.registered_at)}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Método de Pagamento</p>
                  <p className="font-semibold text-gray-800">
                    {registro.payment_method === 'pix' ? '🇧🇷 PIX' : '💎 Criptomoeda'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 font-medium mb-2">🔐 Comprovação do Registro</p>
                <p className="font-mono text-sm text-blue-800 break-all">{registro.tx_hash}</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">IB</span>
              </div>
              <p className="font-bold text-gray-800 mt-2">IBEDIS</p>
              <p className="text-sm text-gray-500">Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável</p>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-500">
            <p>Este certificado atesta que o documento acima foi registrado digitalmente.</p>
            <p className="mt-1">O hash SHA-256 garante a integridade e autenticidade do arquivo original.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => window.print()} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            🖨️ Imprimir
          </button>
          <a href="/registro-documentos" className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
            📄 Novo Registro
          </a>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Para verificar este certificado, acesse:</p>
          <p className="font-mono text-emerald-600">token.ibedis.com.br/certificado-documento/{registro.certificate_code}</p>
        </div>
      </div>
    </div>
  );
}
