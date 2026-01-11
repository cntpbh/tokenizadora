'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, Award, Calculator, FileCheck, Lock, 
  ChevronDown, ChevronUp, ArrowRight, Building2
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { supabase, User as UserType, getUserByEmail } from '@/lib/supabase';

export default function PorquePatrocinarPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('porque-patrocinar');

  // Carregar usuário logado
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const userData = await getUserByEmail(session.user.email);
          if (userData) setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
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

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const userData = await getUserByEmail(session.user.email);
      if (userData) setUser(userData);
    }
  };

  const beneficios = [
    {
      icon: Shield,
      title: 'Registro em Blockchain',
      desc: 'Token de comprovação imutável na Polygon como evidência permanente do seu investimento'
    },
    {
      icon: Calculator,
      title: 'Benefício Fiscal',
      desc: 'Dedução via Lei do Bem (Lei 11.196/2005) de até 34% do valor investido'
    },
    {
      icon: Award,
      title: 'Pontuação ESG',
      desc: 'Melhore seus indicadores de sustentabilidade para relatórios e compliance'
    },
    {
      icon: FileCheck,
      title: 'Rastreabilidade Total',
      desc: 'Acompanhe cada etapa do projeto com relatórios, fotos e documentação'
    },
    {
      icon: Lock,
      title: 'Garantia de Execução',
      desc: 'Relatórios técnicos, prestação de contas e verificação independente'
    },
    {
      icon: Building2,
      title: 'ICT Credenciada',
      desc: 'IBEDIS credenciado por FINEP, CNPq e FAPDF'
    }
  ];

  const categorias = [
    { emoji: '🌳', nome: 'REDD+', desc: 'Desmatamento evitado, conservação florestal' },
    { emoji: '🌲', nome: 'Florestal', desc: 'Reflorestamento, restauração ecológica' },
    { emoji: '🌊', nome: 'Carbono Azul', desc: 'Manguezais, ecossistemas costeiros' },
    { emoji: '🌾', nome: 'CPR Verde', desc: 'Agricultura sustentável, agrofloresta' },
    { emoji: '📋', nome: 'ESG-I', desc: 'Certificação ESG com Inovação' },
    { emoji: '📊', nome: 'VISIA', desc: 'Avaliação de impacto social' },
    { emoji: '🤝', nome: 'PVPE', desc: 'Programa de Voluntariado Empresarial' },
  ];

  const simulacao = [
    { investimento: 'R$ 100.000', economia: 'R$ 34.000', custo: 'R$ 66.000' },
    { investimento: 'R$ 500.000', economia: 'R$ 170.000', custo: 'R$ 330.000' },
    { investimento: 'R$ 1.000.000', economia: 'R$ 340.000', custo: 'R$ 660.000' },
  ];

  const faqs = [
    {
      q: 'O Token P&D+ESG é um valor mobiliário?',
      a: 'NÃO. O Token é um comprovante digital de patrocínio, não um investimento especulativo. Não há expectativa de lucro, não é negociável em mercado secundário e está vinculado ao CNPJ do patrocinador. Conforme Resolução CVM 193/2023, não se enquadra como valor mobiliário.'
    },
    {
      q: 'Quais empresas podem utilizar a Lei do Bem?',
      a: 'Empresas no regime de Lucro Real que realizam atividades de P&D&I. Para empresas no Lucro Presumido, o investimento é dedutível como despesa operacional (100% dedutível no IRPJ e CSLL).'
    },
    {
      q: 'Como funciona a comprovação fiscal?',
      a: 'Você recebe nota fiscal do IBEDIS, contrato de cooperação técnica, relatórios de execução e o Token blockchain como comprovante imutável. Toda documentação necessária para prestação de contas ao fisco.'
    },
    {
      q: 'O que é a blockchain Polygon?',
      a: 'Polygon é uma rede blockchain de alta velocidade e baixo custo, compatível com Ethereum. Os tokens são registrados de forma imutável e verificável publicamente em polygonscan.com.'
    },
    {
      q: 'Posso acompanhar a execução do projeto?',
      a: 'Sim! A plataforma oferece dashboard com relatórios mensais, fotos georreferenciadas, vídeos e documentação técnica. Total transparência durante toda a execução.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={false}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1a3f4d] to-[#2a5f6d] text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Programa de Captação<br />
            <span className="text-[#b8963c]">TOKEN P&D+ESG</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Patrocínio com Rastreabilidade, Benefício Fiscal e Comprovação ESG
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              🌐 token.ibedis.com.br
            </div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              ⛓️ Polygon Blockchain
            </div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              🏛️ ICT Credenciada FINEP
            </div>
          </div>
        </div>
      </section>

      {/* O que você recebe */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-4">
            O que você recebe ao patrocinar
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Investimento em P&D&I com contrapartidas tangíveis e documentadas
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficios.map((b, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition hover:border-[#b8963c]/30">
                <div className="w-12 h-12 bg-[#1a3f4d]/10 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-[#1a3f4d]" />
                </div>
                <h3 className="font-bold text-[#1a3f4d] mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-16 px-4 bg-[#1a3f4d]/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-4">
            Categorias de Projetos
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Escolha projetos alinhados aos seus objetivos ESG
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categorias.map((c, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition text-center border border-gray-100 hover:border-[#b8963c]/30">
                <div className="text-4xl mb-2">{c.emoji}</div>
                <h3 className="font-bold text-[#1a3f4d]">{c.nome}</h3>
                <p className="text-sm text-gray-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefício Fiscal */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-4">
            💰 Economia Tributária
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Simulação de economia com a Lei do Bem (Lucro Real)
          </p>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-3 bg-[#1a3f4d] text-white font-bold text-center py-3">
              <div>Investimento</div>
              <div>Economia Fiscal</div>
              <div>Custo Líquido</div>
            </div>
            {simulacao.map((s, i) => (
              <div key={i} className={`grid grid-cols-3 text-center py-4 ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                <div className="font-medium text-[#1a3f4d]">{s.investimento}</div>
                <div className="text-[#b8963c] font-bold">{s.economia}</div>
                <div className="text-gray-600">{s.custo}</div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 text-center mt-4">
            * Considerando alíquota IRPJ+CSLL de 34% e dedução adicional de 50% (ICT)
          </p>
        </div>
      </section>

      {/* Não é valor mobiliário */}
      <section className="py-16 px-4 bg-[#b8963c]/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-8">
            ⚖️ Por que NÃO é Valor Mobiliário
          </h2>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#b8963c]/20">
            <div className="space-y-4">
              {[
                { vm: 'Expectativa de lucro/retorno financeiro', token: 'Sem expectativa de retorno - é patrocínio' },
                { vm: 'Esforço de terceiros gera ganho', token: 'Benefício fiscal próprio, não dependente de terceiros' },
                { vm: 'Negociável em mercado secundário', token: 'Intransferível - vinculado ao CNPJ patrocinador' },
                { vm: 'Promessa de valorização', token: 'Valor fixo = valor do patrocínio realizado' },
                { vm: 'Participação nos resultados', token: 'Nenhuma participação - apenas comprovação' },
              ].map((item, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-red-600 flex items-start gap-2">
                    <span className="text-lg">❌</span>
                    <span className="text-sm">{item.vm}</span>
                  </div>
                  <div className="text-[#1a3f4d] flex items-start gap-2">
                    <span className="text-lg">✅</span>
                    <span className="text-sm">{item.token}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-[#1a3f4d]/10 rounded-xl text-center">
              <p className="text-[#1a3f4d] font-medium">
                Fundamentação: Resolução CVM nº 193/2023 e Lei nº 15.042/2024
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1a3f4d] mb-8">
            ❓ Perguntas Frequentes
          </h2>
          
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow border border-gray-100">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full p-4 flex justify-between items-center text-left"
                >
                  <span className="font-medium text-[#1a3f4d]">{faq.q}</span>
                  {faqOpen === i ? (
                    <ChevronUp className="w-5 h-5 text-[#b8963c]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4 text-gray-600 text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#1a3f4d] to-[#2a5f6d] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para investir em P&D com benefício fiscal?
          </h2>
          <p className="text-gray-200 mb-8">
            Acesse a plataforma e escolha seu projeto
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="bg-white text-[#1a3f4d] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition flex items-center gap-2"
            >
              Ver Projetos <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/5511958270951"
              target="_blank"
              className="bg-[#b8963c] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#a07f2f] transition"
            >
              Falar com Especialista
            </a>
          </div>
          
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-300">Email</p>
              <p className="font-medium">token@ibedis.org</p>
            </div>
            <div>
              <p className="text-gray-300">WhatsApp</p>
              <p className="font-medium">(11) 95827-0951</p>
            </div>
            <div>
              <p className="text-gray-300">Site</p>
              <p className="font-medium">ibedis.org</p>
            </div>
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
