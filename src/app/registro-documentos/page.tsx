'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, FileText, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { supabase, getUserByEmail } from '@/lib/supabase';
import type { User } from '@/lib/supabase';

export default function RegistroDocumentos() {
  const [preco, setPreco] = useState<number>(0.90);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('registro-documentos');

  useEffect(() => {
    carregarPreco();
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

  const carregarPreco = async () => {
    try {
      const res = await fetch('/api/documentos/registrar');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.price) {
          setPreco(data.price);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar preco:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={false}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {/* Sub-navigation for Registro Documentos */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-1 py-2 overflow-x-auto">
            <Link
              href="/registro-documentos"
              className="px-4 py-2 rounded-lg font-medium transition flex items-center bg-[#1a3f4d]/10 text-[#1a3f4d]"
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
              className="px-4 py-2 rounded-lg font-medium transition flex items-center text-[#1a3f4d] hover:bg-[#1a3f4d]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Meus Certificados
            </Link>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#1a3f4d]/5 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#b8963c]/10 text-[#b8963c] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[#b8963c]/20">
            🔒 Registro com Validade Jurídica
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a3f4d] mb-6">
            Registre seus Documentos com <span className="text-[#b8963c]">Segurança</span>
          </h1>
          <p className="text-xl text-[#1a3f4d]/70 mb-8 max-w-2xl mx-auto">
            Comprove a existência e autenticidade de qualquer documento digital. 
            Registro imutável e com reconhecimento legal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registro-documentos/registrar" className="px-8 py-4 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 shadow-lg transition flex items-center justify-center">
              📄 Registrar Documento - R$ {preco.toFixed(2)}
            </Link>
            <Link href="/registro-documentos/verificar" className="px-8 py-4 bg-white text-[#1a3f4d] rounded-xl font-semibold hover:bg-gray-50 border border-[#1a3f4d]/20 transition flex items-center justify-center">
              🔍 Verificar Documento
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-4 border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[#1a3f4d] text-2xl">📄</span>
              <span className="text-3xl font-bold text-[#1a3f4d]">1.000+</span>
            </div>
            <p className="text-[#1a3f4d]/60 text-sm">Documentos Registrados</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[#1a3f4d] text-2xl">✅</span>
              <span className="text-3xl font-bold text-[#1a3f4d]">100%</span>
            </div>
            <p className="text-[#1a3f4d]/60 text-sm">Verificáveis</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[#b8963c] text-2xl">⚡</span>
              <span className="text-3xl font-bold text-[#1a3f4d]">Instant</span>
            </div>
            <p className="text-[#1a3f4d]/60 text-sm">Confirmação</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[#b8963c] text-2xl">🔐</span>
              <span className="text-3xl font-bold text-[#1a3f4d]">SHA-256</span>
            </div>
            <p className="text-[#1a3f4d]/60 text-sm">Criptografia</p>
          </div>
        </div>
      </section>

      {/* Por que Registrar */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-12">Por que Registrar?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg hover:border-[#1a3f4d]/20 transition">
              <div className="w-16 h-16 bg-[#1a3f4d]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-[#1a3f4d] mb-3">Prova de Existência</h3>
              <p className="text-[#1a3f4d]/70">Comprove que seu documento existia em uma data específica com registro imutável.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg hover:border-[#1a3f4d]/20 transition">
              <div className="w-16 h-16 bg-[#b8963c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚖️</span>
              </div>
              <h3 className="text-xl font-bold text-[#1a3f4d] mb-3">Validade Jurídica</h3>
              <p className="text-[#1a3f4d]/70">Reconhecimento legal conforme Lei 14.063/2020 e Marco Civil da Internet.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg hover:border-[#1a3f4d]/20 transition">
              <div className="w-16 h-16 bg-[#1a3f4d]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-[#1a3f4d] mb-3">Privacidade Total</h3>
              <p className="text-[#1a3f4d]/70">Apenas o hash do documento é registrado. Seu arquivo nunca é armazenado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Documentos */}
      <section className="py-16 px-4 bg-[#1a3f4d]/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-12">Tipos de Documentos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: '📜', titulo: 'Contratos' },
              { icon: '💡', titulo: 'Patentes' },
              { icon: '📝', titulo: 'Projetos' },
              { icon: '🎓', titulo: 'Diplomas' },
              { icon: '📋', titulo: 'Laudos' },
              { icon: '📸', titulo: 'Fotos e Vídeos' },
              { icon: '✍️', titulo: 'Obras Autorais' },
              { icon: '🏠', titulo: 'Inventários' },
              { icon: '📊', titulo: 'Balanços' },
              { icon: '📑', titulo: 'Atas' },
              { icon: '🔬', titulo: 'Pesquisas' },
              { icon: '📄', titulo: 'Outros' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-[#1a3f4d]/30 hover:bg-[#1a3f4d]/5 transition">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-semibold text-[#1a3f4d] mt-3">{item.titulo}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section className="py-16 px-4 bg-[#1a3f4d]">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
            <h3 className="text-2xl font-bold text-[#1a3f4d] mb-4">Registro de Documento</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-[#b8963c]">R$ {preco.toFixed(2)}</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-3 text-[#1a3f4d]/80">
                <span className="w-6 h-6 bg-[#1a3f4d]/10 text-[#1a3f4d] rounded-full flex items-center justify-center text-sm">✓</span>
                Certificado digital
              </li>
              <li className="flex items-center gap-3 text-[#1a3f4d]/80">
                <span className="w-6 h-6 bg-[#1a3f4d]/10 text-[#1a3f4d] rounded-full flex items-center justify-center text-sm">✓</span>
                Validade permanente
              </li>
              <li className="flex items-center gap-3 text-[#1a3f4d]/80">
                <span className="w-6 h-6 bg-[#1a3f4d]/10 text-[#1a3f4d] rounded-full flex items-center justify-center text-sm">✓</span>
                Pagamento via PIX
              </li>
              <li className="flex items-center gap-3 text-[#1a3f4d]/80">
                <span className="w-6 h-6 bg-[#1a3f4d]/10 text-[#1a3f4d] rounded-full flex items-center justify-center text-sm">✓</span>
                Confirmação instantânea
              </li>
            </ul>
            <Link href="/registro-documentos/registrar" className="block w-full py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition">
              Registrar Agora
            </Link>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-12">Como Funciona?</h2>
          <div className="space-y-4">
            {[
              { num: '1', titulo: 'Envie o Documento', desc: 'Faça upload - apenas o hash é gerado, seu arquivo não é armazenado.' },
              { num: '2', titulo: 'Preencha os Dados', desc: 'Informe título, seu nome e email para o certificado.' },
              { num: '3', titulo: 'Pague via PIX', desc: 'Escaneie o QR Code e pague instantaneamente.' },
              { num: '4', titulo: 'Receba o Certificado', desc: 'Certificado emitido automaticamente após confirmação.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1a3f4d]/30 transition">
                <div className="w-10 h-10 bg-[#1a3f4d] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1a3f4d]">{step.titulo}</h3>
                  <p className="text-[#1a3f4d]/70">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
