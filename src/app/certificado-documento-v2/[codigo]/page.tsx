'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Store, CheckCircle, FileText, Mail, Globe, ExternalLink, 
  Shield, Printer, Download, FileDown, Award, Loader2 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const CONTRACT_ADDRESS = '0xc1b859a61F7Ca2353047147d9B2160c8bfc2460C';

interface Registro {
  id: string;
  certificate_code: string;
  document_title: string;
  document_hash: string;
  requester_name: string;
  requester_email: string;
  tx_hash: string;
  status: string;
  created_at: string;
  registered_at: string;
  file_name: string;
  file_size: number;
  original_file_url: string;
  stamped_file_url: string;
  certificate_url: string;
}

export default function CertificadoDocumentoV2() {
  const params = useParams();
  const codigo = params.codigo as string;
  
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

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
      } else if (data.status !== 'completed' && data.payment_status !== 'completed') {
        setErro('Registro ainda não foi confirmado');
      } else {
        setRegistro(data);
      }
      
      setCarregando(false);
    }

    carregar();
  }, [codigo]);

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', { 
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function formatarTamanho(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async function handleDownload(type: 'stamped' | 'certificate' | 'original', url: string, fileName: string) {
    if (!url) return;
    setDownloading(type);
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erro no download:', error);
      window.open(url, '_blank');
    }
    
    setDownloading(null);
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a3f4d] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1a3f4d]/60">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  if (erro || !registro) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-[#1a3f4d]/5 border-b border-[#1a3f4d]/10 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between py-3 gap-4">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <img src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" alt="IBEDIS Token" className="h-10 w-auto" />
              </Link>
              <Link href="/registro-documentos" className="px-4 py-2 text-[#1a3f4d] hover:bg-[#1a3f4d]/10 rounded-lg font-medium transition">
                ← Voltar
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a3f4d]">{erro}</h1>
            <p className="text-[#1a3f4d]/60 mt-2">Código: {codigo}</p>
            <Link href="/registro-documentos" className="mt-6 inline-block px-6 py-3 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#1a3f4d]/90 transition">
              Fazer novo registro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#1a3f4d]/5 border-b border-[#1a3f4d]/10 shadow-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 gap-4">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" alt="IBEDIS Token" className="h-10 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center">
              <Link href="/" className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10">
                <Store className="w-4 h-4 mr-2" /> Marketplace
              </Link>
              <Link href="/registro-documentos/verificar" className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10">
                <CheckCircle className="w-4 h-4 mr-2" /> Verificar
              </Link>
            </nav>
            <Link href="/registro-documentos" className="px-4 py-2 text-[#1a3f4d] hover:bg-[#1a3f4d]/10 rounded-lg font-medium transition">
              ← Voltar
            </Link>
          </div>
        </div>
      </header>

      {/* Certificado */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            {/* Header do Certificado */}
            <div className="bg-[#1a3f4d] text-white p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold">CERTIFICADO DE AUTENTICIDADE</h1>
              <p className="text-white/80 mt-2">Registro Digital de Documento em Blockchain</p>
            </div>

            {/* Corpo do Certificado */}
            <div className="p-8">
              {/* Código */}
              <div className="text-center mb-8">
                <p className="text-sm text-[#1a3f4d]/60">Código do Certificado</p>
                <p className="text-3xl font-mono font-bold text-[#b8963c] mt-1">{registro.certificate_code}</p>
              </div>

              {/* Badge Verificado */}
              <div className="flex justify-center mb-8">
                <div className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-semibold flex items-center gap-2 border border-green-200">
                  <CheckCircle className="w-5 h-5" />
                  DOCUMENTO VERIFICADO E REGISTRADO
                </div>
              </div>

              {/* Detalhes */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-[#1a3f4d]/60">Título do Documento</p>
                  <p className="font-semibold text-[#1a3f4d]">{registro.document_title}</p>
                </div>

                {registro.file_name && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-[#1a3f4d]/60">Arquivo Original</p>
                    <p className="font-semibold text-[#1a3f4d]">{registro.file_name}</p>
                    {registro.file_size && (
                      <p className="text-sm text-[#1a3f4d]/60 mt-1">{formatarTamanho(registro.file_size)}</p>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-[#1a3f4d]/60">Hash SHA-256 (Impressão Digital)</p>
                  <p className="font-mono text-sm text-[#1a3f4d] break-all">{registro.document_hash}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-[#1a3f4d]/60">Solicitante</p>
                    <p className="font-semibold text-[#1a3f4d]">{registro.requester_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-[#1a3f4d]/60">Data de Registro</p>
                    <p className="font-semibold text-[#1a3f4d]">{formatarData(registro.registered_at || registro.created_at)}</p>
                  </div>
                </div>

                {registro.tx_hash && (
                  <div className="bg-[#1a3f4d]/5 rounded-xl p-4 border border-[#1a3f4d]/20">
                    <p className="text-sm text-[#1a3f4d]/60 font-medium mb-1">🔐 Registro Blockchain</p>
                    <p className="font-mono text-sm text-[#1a3f4d] break-all">{registro.tx_hash}</p>
                  </div>
                )}
              </div>

              {/* Downloads */}
              <div className="mt-8 p-6 bg-[#b8963c]/10 rounded-xl border border-[#b8963c]/30">
                <h3 className="font-bold text-[#1a3f4d] mb-4 flex items-center gap-2">
                  <FileDown className="w-5 h-5" />
                  Downloads Disponíveis
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {registro.stamped_file_url && (
                    <button
                      onClick={() => handleDownload('stamped', registro.stamped_file_url, `${registro.certificate_code}-carimbado.pdf`)}
                      disabled={downloading === 'stamped'}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#1a3f4d]/90 transition disabled:opacity-50"
                    >
                      {downloading === 'stamped' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Documento Carimbado
                    </button>
                  )}
                  {registro.certificate_url && (
                    <button
                      onClick={() => handleDownload('certificate', registro.certificate_url, `${registro.certificate_code}-certificado.pdf`)}
                      disabled={downloading === 'certificate'}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#b8963c] text-white rounded-lg hover:bg-[#b8963c]/90 transition disabled:opacity-50"
                    >
                      {downloading === 'certificate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      Certificado PDF
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#1a3f4d]/60 mt-3 text-center">
                  O documento carimbado possui marca de autenticidade em todas as páginas
                </p>
              </div>

              {/* Link Blockchain */}
              <div className="mt-4 text-center">
                <a 
                  href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#b8963c] hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Contrato na Polygon
                </a>
              </div>

              {/* Logo e Assinatura */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <img src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" alt="IBEDIS Token" className="h-12 mx-auto mb-2" />
                <p className="text-sm text-[#1a3f4d]/70">Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável</p>
                <p className="text-xs text-[#1a3f4d]/50 mt-1">Credenciado MCTI/FINEP • Metodologia VISIA - ISBN 978-65-01-58740-0</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6 flex justify-center gap-4 print:hidden">
            <button onClick={() => window.print()} className="px-6 py-2 bg-white border border-gray-300 text-[#1a3f4d] rounded-lg hover:bg-gray-50 transition flex items-center">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </button>
            <Link href="/registro-documentos/registrar" className="px-6 py-2 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#1a3f4d]/90 transition flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Novo Registro
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 text-[#1a3f4d] py-6 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#1a3f4d]/60 text-sm">© {new Date().getFullYear()} IBEDIS. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
