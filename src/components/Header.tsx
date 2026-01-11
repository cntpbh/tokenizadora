'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { Store, CheckCircle, Link2, Sparkles, Settings, User, LogIn, HelpCircle, FileText, Gift, ChevronDown, TrendingUp, Shield, Wallet, Banknote } from "lucide-react";
import { User as UserType } from '@/lib/supabase';
import Link from 'next/link';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  user: UserType | null;
  onLoginClick: () => void;
}

export default function Header({ activeTab, setActiveTab, isAdmin, user, onLoginClick }: HeaderProps) {
  const address = useAddress();
  const router = useRouter();
  const pathname = usePathname();
  const [investorMenuOpen, setInvestorMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  const investorMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Verificar se estamos na página principal
  const isHomePage = pathname === '/';

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (investorMenuRef.current && !investorMenuRef.current.contains(event.target as Node)) {
        setInvestorMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função para navegar para tab na página principal
  const navigateToTab = (tab: string) => {
    setInvestorMenuOpen(false);
    setAdminMenuOpen(false);
    
    if (isHomePage) {
      // Se já está na home, apenas muda a tab
      setActiveTab(tab);
    } else {
      // Se está em outra página, navega para home com a tab
      router.push(`/?tab=${tab}`);
    }
  };

  // Função para clique direto (usado em botões que só mudam tab)
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setInvestorMenuOpen(false);
    setAdminMenuOpen(false);
  };

  return (
    <header className="bg-[#1a3f4d]/5 border-b border-[#1a3f4d]/10 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-2">
          
          {/* Logo IBEDIS - Local */}
          <Link href="/" className="flex-shrink-0 flex items-center cursor-pointer">
            <img 
              src="/logo-ibedis.png" 
              alt="IBEDIS Token" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-xl font-bold text-[#1a3f4d]">IBEDIS</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            
            {/* Marketplace - Link para Home */}
            <Link
              href="/"
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                (isHomePage && activeTab === 'marketplace') || pathname === '/' ? 'bg-[#1a3f4d] text-white' : 'text-[#1a3f4d] hover:bg-[#1a3f4d]/10'
              }`}
            >
              <Store className="w-4 h-4 mr-2" />
              Marketplace
            </Link>

            {/* Menu Investidor - Dropdown */}
            <div className="relative" ref={investorMenuRef}>
              <button
                onClick={() => { setInvestorMenuOpen(!investorMenuOpen); setAdminMenuOpen(false); }}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                  ['custodia', 'transparencia'].includes(activeTab) || pathname === '/transparencia' || pathname === '/carteira'
                    ? 'bg-[#1a3f4d] text-white' 
                    : 'text-[#1a3f4d] hover:bg-[#1a3f4d]/10'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Investidor
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${investorMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Investidor */}
              {investorMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <button
                    onClick={() => navigateToTab('custodia')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#1a3f4d] transition"
                  >
                    <Link2 className="w-4 h-4 mr-3 text-[#1a3f4d]" />
                    <div>
                      <div className="font-medium">Custódia</div>
                      <div className="text-xs text-gray-500">Meus tokens e ativos</div>
                    </div>
                  </button>
                  
                  {/* Link Carteira */}
                  {user && (
                    <Link
                      href="/carteira"
                      onClick={() => setInvestorMenuOpen(false)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#1a3f4d] transition"
                    >
                      <Wallet className="w-4 h-4 mr-3 text-emerald-600" />
                      <div>
                        <div className="font-medium">Carteira</div>
                        <div className="text-xs text-gray-500">Saldo e saques</div>
                      </div>
                    </Link>
                  )}
                  
                  <Link
                    href="/transparencia"
                    onClick={() => setInvestorMenuOpen(false)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#1a3f4d] transition"
                  >
                    <Shield className="w-4 h-4 mr-3 text-[#1a3f4d]" />
                    <div>
                      <div className="font-medium">Transparência</div>
                      <div className="text-xs text-gray-500">Documentos e registros</div>
                    </div>
                  </Link>
                  
                  <Link
                    href="/porque-patrocinar"
                    onClick={() => setInvestorMenuOpen(false)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#1a3f4d] transition"
                  >
                    <HelpCircle className="w-4 h-4 mr-3 text-[#b8963c]" />
                    <div>
                      <div className="font-medium">Por que Investir?</div>
                      <div className="text-xs text-gray-500">Benefícios e impacto</div>
                    </div>
                  </Link>
                  
                  <Link
                    href="/indicacoes"
                    onClick={() => setInvestorMenuOpen(false)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#1a3f4d] transition border-t border-gray-100"
                  >
                    <Gift className="w-4 h-4 mr-3 text-emerald-600" />
                    <div>
                      <div className="font-medium">Indicações</div>
                      <div className="text-xs text-gray-500">Indique e ganhe</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Verificar - Navega para página de verificação */}
            <Link
              href="/registro-documentos/verificar"
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                pathname === '/registro-documentos/verificar'
                  ? 'bg-[#1a3f4d] text-white' 
                  : 'text-[#1a3f4d] hover:bg-[#1a3f4d]/10'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verificar
            </Link>

            {/* Registrar Doc - Link Destacado */}
            <Link
              href="/registro-documentos"
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center border ${
                pathname === '/registro-documentos'
                  ? 'bg-[#b8963c] text-white border-[#b8963c]'
                  : 'bg-[#b8963c]/10 text-[#b8963c] hover:bg-[#b8963c]/20 border-[#b8963c]/30'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Registrar Doc
            </Link>

            {/* Menu Admin - Dropdown (só admin) */}
            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => { setAdminMenuOpen(!adminMenuOpen); setInvestorMenuOpen(false); }}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                    ['admin', 'gestao'].includes(activeTab) || pathname === '/admin/saques' ? 'bg-[#b8963c] text-white' : 'text-[#b8963c] hover:bg-[#b8963c]/10'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Admin */}
                {adminMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <button
                      onClick={() => navigateToTab('admin')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#b8963c] transition"
                    >
                      <Sparkles className="w-4 h-4 mr-3 text-[#b8963c]" />
                      <div>
                        <div className="font-medium">Tokenizar</div>
                        <div className="text-xs text-gray-500">Criar novos tokens</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => navigateToTab('gestao')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#b8963c] transition"
                    >
                      <Settings className="w-4 h-4 mr-3 text-[#b8963c]" />
                      <div>
                        <div className="font-medium">Gestão</div>
                        <div className="text-xs text-gray-500">Configurações da plataforma</div>
                      </div>
                    </button>

                    {/* NOVO: Link Saques Admin */}
                    <Link
                      href="/admin/saques"
                      onClick={() => setAdminMenuOpen(false)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 hover:text-[#b8963c] transition border-t border-gray-100"
                    >
                      <Banknote className="w-4 h-4 mr-3 text-emerald-600" />
                      <div>
                        <div className="font-medium">Saques</div>
                        <div className="text-xs text-gray-500">Gerenciar pagamentos</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Área do Cliente */}
            {user ? (
              <button
                onClick={() => navigateToTab('cliente')}
                className={`px-3 py-2 rounded-lg font-medium transition flex items-center text-sm ${
                  activeTab === 'cliente' ? 'bg-[#1a3f4d] text-white' : 'bg-[#1a3f4d]/10 text-[#1a3f4d] hover:bg-[#1a3f4d]/20'
                }`}
              >
                <User className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{user.full_name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-3 py-2 bg-[#1a3f4d] hover:bg-[#1a3f4d]/90 text-white rounded-lg font-medium transition flex items-center text-sm"
              >
                <LogIn className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
            
            {/* Wallet Connect */}
            <ConnectWallet 
              theme="light"
              btnTitle="Wallet"
              modalTitle="Conectar Carteira"
              modalSize="compact"
              welcomeScreen={{ title: "IBEDIS Token", subtitle: "Conecte sua carteira" }}
              style={{ backgroundColor: '#b8963c', color: 'white', fontSize: '14px', padding: '8px 12px' }}
            />
          </div>
        </div>

        {/* Admin Banner */}
        {isAdmin && (
          <div className="bg-[#b8963c] text-white text-center py-2 text-sm font-medium -mx-4 px-4">
            Modo Administrador
          </div>
        )}

        {/* User Banner */}
        {user && !isAdmin && (
          <div className="bg-[#1a3f4d] text-white text-center py-2 text-sm -mx-4 px-4">
            Bem-vindo, {user.full_name}!
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-[#1a3f4d]/10 overflow-x-auto bg-gray-50">
        <div className="flex px-2 py-2 space-x-1">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
              pathname === '/' && activeTab === 'marketplace' ? 'bg-[#1a3f4d] text-white' : 'text-[#1a3f4d]'
            }`}
          >
            <Store className="w-4 h-4 mr-1" />
            Marketplace
          </Link>
          <button
            onClick={() => navigateToTab('custodia')}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
              activeTab === 'custodia' ? 'bg-[#1a3f4d] text-white' : 'text-[#1a3f4d]'
            }`}
          >
            <Link2 className="w-4 h-4 mr-1" />
            Custódia
          </button>
          {/* Carteira no Mobile */}
          {user && (
            <Link
              href="/carteira"
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
                pathname === '/carteira' ? 'bg-emerald-600 text-white' : 'text-emerald-600'
              }`}
            >
              <Wallet className="w-4 h-4 mr-1" />
              Carteira
            </Link>
          )}
          <Link
            href="/registro-documentos/verificar"
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
              pathname === '/registro-documentos/verificar' ? 'bg-[#1a3f4d] text-white' : 'text-[#1a3f4d]'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Verificar
          </Link>
          <Link
            href="/registro-documentos"
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
              pathname === '/registro-documentos' ? 'bg-[#b8963c] text-white' : 'text-[#b8963c] border border-[#b8963c]/30'
            }`}
          >
            <FileText className="w-4 h-4 mr-1" />
            Registrar
          </Link>
          <Link
            href="/transparencia"
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
              pathname === '/transparencia' ? 'bg-[#1a3f4d] text-white' : 'text-[#1a3f4d]'
            }`}
          >
            <Shield className="w-4 h-4 mr-1" />
            Transparência
          </Link>
          <Link
            href="/indicacoes"
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
              pathname === '/indicacoes' ? 'bg-emerald-600 text-white' : 'text-emerald-600'
            }`}
          >
            <Gift className="w-4 h-4 mr-1" />
            Indicações
          </Link>
          {isAdmin && (
            <>
              <button
                onClick={() => navigateToTab('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
                  activeTab === 'admin' ? 'bg-[#b8963c] text-white' : 'text-[#b8963c]'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Tokenizar
              </button>
              <button
                onClick={() => navigateToTab('gestao')}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
                  activeTab === 'gestao' ? 'bg-[#b8963c] text-white' : 'text-[#b8963c]'
                }`}
              >
                <Settings className="w-4 h-4 mr-1" />
                Gestão
              </button>
              {/* NOVO: Saques no Mobile */}
              <Link
                href="/admin/saques"
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
                  pathname === '/admin/saques' ? 'bg-emerald-600 text-white' : 'text-emerald-600'
                }`}
              >
                <Banknote className="w-4 h-4 mr-1" />
                Saques
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
