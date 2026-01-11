'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, FileText, Search, Upload, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { supabase, getUserByEmail } from '@/lib/supabase';
import type { User } from '@/lib/supabase';

interface Registro {
  id: string;
  certificate_code: string;
  document_title: string;
  document_hash: string;
  requester_name: string;
  status: string;
  created_at: string;
  registered_at: string;
  tx_hash: string;
}

async function calcularHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

export default function VerificarDocumento() {
  const [metodo, setMetodo] = useState<'codigo' | 'arquivo' | 'hash'>('codigo');
  const [codigo, setCodigo] = useState('');
  const [hash, setHash] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Registro | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState('');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('registro-documentos');

  useEffect(() => {
    loadUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const userData = await getUserByEmail(session.user.email);
        if (userData) setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const userData = await getUserByEmail(session.user.email);
        if (userData) setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar usuario:', error);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const userData = await getUserByEmail(session.user.email);
      if (userData) setUser(userData);
    }
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo 50MB.');
      return;
    }
    setArquivo(file);
    const h = await calcularHash(file);
    setHash(h);
    setErro('');
  }

  async function verificar() {
    setCarregando(true);
    setResultado(null);
    setNaoEncontrado(false);
    setErro('');

    try {
      let query;

      if (metodo === 'codigo') {
        if (!codigo.trim()) {
          setErro('Digite o código do certificado');
          setCarregando(false);
          return;
        }
        query = supabase
          .from('document_registrations')
          .select('*')
          .eq('certificate_code', codigo.trim().toUpperCase())
          .eq('status', 'completed')
          .single();
      } else if (metodo === 'hash') {
        if (!hash.trim()) {
          setErro('Digite o hash do documento');
          setCarregando(false);
          return;
        }
        query = supabase
          .from('document_registrations')
          .select('*')
          .eq('document_hash', hash.trim().toLowerCase())
          .eq('status', 'completed')
          .single();
      } else {
        if (!arquivo) {
          setErro('Selecione um arquivo');
          setCarregando(false);
          return;
        }
        query = supabase
          .from('document_registrations')
          .select('*')
          .eq('document_hash', hash)
          .eq('status', 'completed')
          .single();
      }

      const { data, error } = await query;

      if (error || !data) {
        setNaoEncontrado(true);
      } else {
        setResultado(data);
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao verificar');
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function limpar() {
    setResultado(null);
    setNaoEncontrado(false);
    setCodigo('');
    setHash('');
    setArquivo(null);
    setErro('');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={false}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-1 py-2 overflow-x-auto">
            <Link
              href="/registro-documentos"
              className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Início
            </Link>
            <Link
              href="/registro-documentos/registrar"
              className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Registrar
            </Link>
            <Link
              href="/registro-documentos/verificar"
              className="px-4 py-2 rounded-lg font-medium transition flex items-center bg-[#1a3f4d]/10 text-[#1a3f4d]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verificar
            </Link>
            <Link
              href="/registro-documentos/meus-certificados"
              className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Meus Certificados
            </Link>
          </nav>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3f4d]">Verificar Documento</h1>
          <p className="text-[#1a3f4d]/60 mt-2">Confira a autenticidade de um documento registrado</p>
        </div>

        {!resultado && !naoEncontrado ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            {/* Seletor de método */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'codigo', label: 'Código', icon: Search },
                { id: 'arquivo', label: 'Arquivo', icon: Upload },
                { id: 'hash', label: 'Hash', icon: FileText },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMetodo(m.id as any); setErro(''); }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    metodo === m.id
                      ? 'bg-[#1a3f4d] text-white'
                      : 'bg-gray-100 text-[#1a3f4d] hover:bg-gray-200'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Input por método */}
            {metodo === 'codigo' && (
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-2">Código do Certificado</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ex: DOC-XXXXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3f4d] focus:border-[#1a3f4d] font-mono text-lg uppercase"
                />
              </div>
            )}

            {metodo === 'arquivo' && (
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-2">Arquivo para Verificar</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#1a3f4d] transition"
                  onClick={() => document.getElementById('arquivo')?.click()}
                >
                  <input id="arquivo" type="file" className="hidden" onChange={handleUpload} />
                  {arquivo ? (
                    <div>
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-[#1a3f4d]">{arquivo.name}</p>
                      <p className="text-sm text-[#1a3f4d]/60 mt-1">Hash: {hash.slice(0, 20)}...</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-[#1a3f4d]">Clique para selecionar</p>
                      <p className="text-sm text-[#1a3f4d]/50">Máximo 50MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {metodo === 'hash' && (
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-2">Hash SHA-256</label>
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value.toLowerCase())}
                  placeholder="Cole o hash do documento aqui"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3f4d] focus:border-[#1a3f4d] font-mono text-sm"
                />
              </div>
            )}

            {erro && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {erro}
              </div>
            )}

            <button
              onClick={verificar}
              disabled={carregando}
              className="mt-6 w-full py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verificar Documento
                </>
              )}
            </button>
          </div>
        ) : resultado ? (
          /* ========== RESULTADO: ENCONTRADO ========== */
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-700">Documento Verificado!</h2>
              <p className="text-green-600 mt-1">Este documento está registrado e é autêntico</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#1a3f4d] mb-4">Detalhes do Registro</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-[#1a3f4d]/60">Código do Certificado</p>
                  <p className="font-mono font-bold text-[#1a3f4d]">{resultado.certificate_code}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-[#1a3f4d]/60">Título do Documento</p>
                  <p className="font-semibold text-[#1a3f4d]">{resultado.document_title}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-[#1a3f4d]/60">Hash SHA-256</p>
                  <p className="font-mono text-sm text-[#1a3f4d] break-all">{resultado.document_hash}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-[#1a3f4d]/60">Solicitante</p>
                    <p className="font-semibold text-[#1a3f4d]">{resultado.requester_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-[#1a3f4d]/60">Data de Registro</p>
                    <p className="font-semibold text-[#1a3f4d] text-sm">{formatarData(resultado.registered_at || resultado.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Link
                  href={'/certificado-documento/' + resultado.certificate_code}
                  className="flex-1 py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition text-center"
                >
                  📜 Ver Certificado Completo
                </Link>
                <button
                  onClick={limpar}
                  className="px-6 py-3 border border-gray-300 text-[#1a3f4d] rounded-xl hover:bg-gray-50 transition"
                >
                  Nova Verificação
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========== RESULTADO: NÃO ENCONTRADO ========== */
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-700">Documento Não Encontrado</h2>
              <p className="text-red-600 mt-1">Não foi possível localizar um registro para este documento</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[#1a3f4d] mb-4">Possíveis Motivos</h3>
              <ul className="space-y-2 text-[#1a3f4d]/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b8963c]">•</span>
                  O documento ainda não foi registrado na plataforma
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b8963c]">•</span>
                  O código do certificado foi digitado incorretamente
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b8963c]">•</span>
                  O arquivo enviado é diferente do original registrado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b8963c]">•</span>
                  O pagamento do registro ainda não foi confirmado
                </li>
              </ul>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={limpar}
                  className="flex-1 py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition"
                >
                  Tentar Novamente
                </button>
                <Link
                  href="/registro-documentos/registrar"
                  className="flex-1 py-3 border border-[#1a3f4d] text-[#1a3f4d] rounded-xl font-semibold hover:bg-[#1a3f4d]/5 transition text-center"
                >
                  Registrar Documento
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
