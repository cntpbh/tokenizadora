'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Store, CheckCircle, FileText, Mail, Globe, ExternalLink, Shield, Printer, Download } from 'lucide-react';

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
}

export default function Certificado() {
  const params = useParams();
  const codigo = params.codigo as string;
  
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(function carregarCertificado() {
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
    return new Date(data).toLocaleString('pt-BR', { 
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-[#1a3f4d]/5 border-b border-[#1a3f4d]/10 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between py-3 gap-4">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <img 
                  src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
                  alt="IBEDIS Token" 
                  className="h-10 w-auto"
                />
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

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 text-[#1a3f4d] py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[#1a3f4d]/60 text-sm">© {new Date().getFullYear()} IBEDIS. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  if (!registro) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ==================== HEADER (hide on print) ==================== */}
      <header className="bg-[#1a3f4d]/5 border-b border-[#1a3f4d]/10 shadow-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 gap-4">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img 
                src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
                alt="IBEDIS Token" 
                className="h-10 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center">
              <Link href="/" className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10">
                <Store className="w-4 h-4 mr-2" />
                Marketplace
              </Link>
              <Link href="/registro-documentos/verificar" className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar
              </Link>
              <Link href="/registro-documentos/meus-certificados" className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10">
                <FileText className="w-4 h-4 mr-2" />
                Meus Certificados
              </Link>
            </nav>

            <Link href="/registro-documentos" className="px-4 py-2 text-[#1a3f4d] hover:bg-[#1a3f4d]/10 rounded-lg font-medium transition">
              ← Voltar
            </Link>
          </div>
        </div>
      </header>

      {/* ==================== CERTIFICADO ==================== */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Certificado Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg print:shadow-none print:border-gray-300">
            {/* Header do Certificado */}
            <div className="bg-[#1a3f4d] text-white p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold">CERTIFICADO DE AUTENTICIDADE</h1>
              <p className="text-white/80 mt-2">Registro Digital de Documento</p>
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

                {/* Comprovante de Pagamento */}
                <div className="bg-[#1a3f4d]/5 rounded-xl p-4 border border-[#1a3f4d]/20">
                  <p className="text-sm text-[#1a3f4d]/60 font-medium mb-1">🔐 Comprovante de Pagamento</p>
                  <p className="font-mono text-sm text-[#1a3f4d]">{registro.tx_hash}</p>
                </div>

                {/* Link Blockchain */}
                <div className="bg-[#b8963c]/10 rounded-xl p-4 border border-[#b8963c]/20">
                  <p className="text-sm text-[#b8963c] font-medium mb-2">🔗 Verificação Blockchain</p>
                  <a 
                    href={'https://polygonscan.com/address/' + CONTRACT_ADDRESS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#b8963c] text-white rounded-lg hover:bg-[#b8963c]/90 text-sm font-medium transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Contrato na Polygon
                  </a>
                  <p className="text-xs text-[#b8963c]/70 mt-2">Rede Polygon (MATIC) - Contrato IBEDIS Token</p>
                </div>
              </div>

              {/* Logo e Assinatura */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <img 
                  src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
                  alt="IBEDIS Token" 
                  className="h-12 mx-auto mb-2"
                />
                <p className="text-sm text-[#1a3f4d]/70">Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável</p>
                <p className="text-xs text-[#1a3f4d]/50 mt-1">Credenciado MCTI/FINEP</p>
              </div>
            </div>

            {/* Rodapé do Certificado */}
            <div className="bg-gray-50 px-8 py-4 text-center text-sm text-[#1a3f4d]/60 border-t border-gray-200">
              <p>Este certificado atesta que o documento foi registrado digitalmente.</p>
              <p className="mt-1">O hash SHA-256 garante a integridade e autenticidade do arquivo original.</p>
            </div>
          </div>

          {/* Ações (hide on print) */}
          <div className="mt-6 flex justify-center gap-4 print:hidden">
            <button 
              onClick={function() { window.print(); }} 
              className="px-6 py-2 bg-white border border-gray-300 text-[#1a3f4d] rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </button>
            <Link 
              href="/registro-documentos/registrar" 
              className="px-6 py-2 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#1a3f4d]/90 transition flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Novo Registro
            </Link>
          </div>

          {/* URL de Verificação (hide on print) */}
          <div className="mt-8 text-center text-sm text-[#1a3f4d]/50 print:hidden">
            <p>Para verificar este certificado, acesse:</p>
            <p className="font-mono text-[#1a3f4d]">token.ibedis.com.br/certificado-documento/{registro.certificate_code}</p>
          </div>
        </div>
      </main>

      {/* ==================== FOOTER (hide on print) ==================== */}
      <footer className="bg-gray-50 border-t border-gray-200 text-[#1a3f4d] py-8 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
                  alt="IBEDIS Token" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-[#1a3f4d]/70 text-sm leading-relaxed">
                Plataforma de tokenização de ativos sustentáveis desenvolvida pelo IBEDIS - 
                Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável.
                Credenciado MCTI/FINEP.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-[#1a3f4d]">Links</h4>
              <ul className="space-y-2 text-[#1a3f4d]/70 text-sm">
                <li>
                  <a href="https://ibedis.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#b8963c] flex items-center transition">
                    <Globe className="w-4 h-4 mr-2" />
                    ibedis.org
                  </a>
                </li>
                <li>
                  <a href="mailto:contato@ibedis.org" className="hover:text-[#b8963c] flex items-center transition">
                    <Mail className="w-4 h-4 mr-2" />
                    contato@ibedis.org
                  </a>
                </li>
                <li>
                  <a 
                    href={'https://polygonscan.com/address/' + CONTRACT_ADDRESS} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#b8963c] flex items-center transition"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Verificar Contrato
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-[#1a3f4d]">Segurança</h4>
              <ul className="space-y-2 text-[#1a3f4d]/70 text-sm">
                <li className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#b8963c]" />
                  Smart Contract Auditado
                </li>
                <li className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#b8963c]" />
                  Polygon Mainnet
                </li>
                <li className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#b8963c]" />
                  ERC-1155 Standard
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-[#1a3f4d]/60 text-sm">
                © {new Date().getFullYear()} IBEDIS. Todos os direitos reservados.
              </p>
              <p className="text-[#b8963c] text-xs mt-2 md:mt-0">
                Metodologia VISIA - ISBN 978-65-01-58740-0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
