'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, FileText, LogOut, Eye, Download, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { supabase, getUserByEmail } from '@/lib/supabase';
import type { User } from '@/lib/supabase';

interface Certificado {
  id: string;
  certificate_code: string;
  document_title: string;
  document_hash: string;
  status: string;
  created_at: string;
  registered_at: string;
}

export default function MeusCertificados() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('registro-documentos');

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthUser(session.user);
        carregarCertificados(session.user.email || '');
        const userData = await getUserByEmail(session.user.email || '');
        if (userData) setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setUser(null);
        setCertificados([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        carregarCertificados(session.user.email || '');
        const userData = await getUserByEmail(session.user.email || '');
        if (userData) setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarCertificados = async (email: string) => {
    if (!email) return;

    try {
      const { data, error } = await supabase
        .from('document_registrations')
        .select('*')
        .eq('requester_email', email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar certificados:', error);
      } else {
        setCertificados(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setAuthUser(session.user);
      carregarCertificados(session.user.email || '');
      const userData = await getUserByEmail(session.user.email || '');
      if (userData) setUser(userData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setUser(null);
    setCertificados([]);
  };

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ Registrado</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">⏳ Pendente</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{status}</span>;
    }
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
              className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verificar
            </Link>
            <Link
              href="/registro-documentos/meus-certificados"
              className="px-4 py-2 rounded-lg font-medium transition flex items-center bg-[#1a3f4d]/10 text-[#1a3f4d]"
            >
              <FileText className="w-4 h-4 mr-2" />
              Meus Certificados
            </Link>
          </nav>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3f4d]">Meus Certificados</h1>
          <p className="text-[#1a3f4d]/60 mt-2">Gerencie seus documentos registrados</p>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3f4d]" />
          </div>
        ) : !authUser ? (
          /* ========== NÃO LOGADO ========== */
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#1a3f4d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#1a3f4d]" />
            </div>
            <h2 className="text-xl font-bold text-[#1a3f4d] mb-2">Faça login para ver seus certificados</h2>
            <p className="text-[#1a3f4d]/60 mb-6">
              Acesse sua conta para visualizar e gerenciar todos os seus documentos registrados.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition"
            >
              Entrar / Criar Conta
            </button>
          </div>
        ) : (
          /* ========== LOGADO ========== */
          <div>
            {/* User Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a3f4d] rounded-full flex items-center justify-center text-white font-bold">
                  {(authUser.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#1a3f4d]">{authUser.email}</p>
                  <p className="text-sm text-[#1a3f4d]/60">{certificados.length} certificado(s)</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>

            {/* Lista de Certificados */}
            {certificados.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-[#1a3f4d] mb-2">Nenhum certificado ainda</h3>
                <p className="text-[#1a3f4d]/60 mb-4">Você ainda não registrou nenhum documento.</p>
                <Link
                  href="/registro-documentos/registrar"
                  className="inline-block px-6 py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition"
                >
                  Registrar Primeiro Documento
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {certificados.map((cert) => (
                  <div key={cert.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-[#1a3f4d]">{cert.document_title}</h3>
                          {getStatusBadge(cert.status)}
                        </div>
                        <p className="font-mono text-sm text-[#1a3f4d]/70 mb-2">
                          Código: <span className="font-bold">{cert.certificate_code}</span>
                        </p>
                        <p className="text-sm text-[#1a3f4d]/60">
                          Registrado em {formatarData(cert.registered_at || cert.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {cert.status === 'completed' && (
                          <>
                            <Link
                              href={`/certificado-documento/${cert.certificate_code}`}
                              className="p-2 bg-[#1a3f4d]/10 text-[#1a3f4d] rounded-lg hover:bg-[#1a3f4d]/20 transition"
                              title="Ver Certificado"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <a
                              href={`/api/certificado/${cert.certificate_code}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-[#b8963c]/10 text-[#b8963c] rounded-lg hover:bg-[#b8963c]/20 transition"
                              title="Baixar PDF"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Hash */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-[#1a3f4d]/50">
                        Hash: <span className="font-mono">{cert.document_hash.slice(0, 40)}...</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Link para registrar mais */}
            {certificados.length > 0 && (
              <div className="mt-6 text-center">
                <Link
                  href="/registro-documentos/registrar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition"
                >
                  <FileText className="w-5 h-5" />
                  Registrar Novo Documento
                </Link>
              </div>
            )}
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
