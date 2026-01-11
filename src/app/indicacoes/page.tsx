'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Gift, Copy, Check, Loader2, 
  TrendingUp, DollarSign, UserPlus, ShoppingCart,
  Link2, Share2, Clock, CheckCircle,
  User, LogIn, Wallet, ArrowRight
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { supabase, User as UserType, getUserByEmail } from '@/lib/supabase';
import Link from 'next/link';

interface ReferralStats {
  total_referrals: number;
  registered_referrals: number;
  purchased_referrals: number;
  conversion_rate: string | number;
  commission: {
    pending: string;
    approved: string;
    paid: string;
    total: string;
  };
}

interface Referral {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'registered' | 'purchased';
  registration_date: string | null;
  first_purchase_date: string | null;
  total_purchases: number;
  total_spent: number;
  created_at: string;
}

interface Commission {
  id: string;
  referred_email: string;
  purchase_type: 'token' | 'document';
  purchase_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  created_at: string;
}

export default function IndicacoesPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('indicacoes');
  
  const [hasCode, setHasCode] = useState(false);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [linkDocumentos, setLinkDocumentos] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [copied, setCopied] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const loadReferralData = useCallback(async (email: string) => {
    try {
      const response = await fetch(`/api/referral/stats?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setHasCode(data.hasCode);
        if (data.hasCode) {
          setCode(data.code);
          setLink(data.link);
          setLinkDocumentos(data.linkDocumentos);
          setStats(data.stats);
          setReferrals(data.referrals || []);
          setCommissions(data.commissions || []);
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  const loadUserData = useCallback(async (email: string) => {
    console.log('📧 Carregando dados do usuário:', email);
    try {
      // Usar a função do supabase.ts
      const userData = await getUserByEmail(email);
      console.log('👤 Usuário encontrado:', userData);
      
      if (userData) {
        setUser(userData);
      } else {
        // Se não encontrou na tabela users, criar objeto mínimo
        setUser({ email, full_name: email.split('@')[0] } as UserType);
      }
      
      await loadReferralData(email);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setUser({ email, full_name: email.split('@')[0] } as UserType);
      await loadReferralData(email);
    } finally {
      setLoading(false);
    }
  }, [loadReferralData]);

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      console.log('🔐 Inicializando auth...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        console.log('📋 Sessão atual:', session?.user?.email || 'Nenhuma');
        
        if (session?.user?.email && mounted) {
          await loadUserData(session.user.email);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user?.email) {
        setLoading(true);
        await loadUserData(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setHasCode(false);
        setCode('');
        setLink('');
        setLinkDocumentos('');
        setStats(null);
        setReferrals([]);
        setCommissions([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const handleAuthSuccess = async () => {
    console.log('✅ Auth success callback');
    setShowAuthModal(false);
    
    // Aguardar sessão estar disponível
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Sessão após login:', session?.user?.email);
      
      if (session?.user?.email) {
        await loadUserData(session.user.email);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro após auth success:', error);
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!user?.email) return;
    
    try {
      setGeneratingCode(true);
      const response = await fetch(`/api/referral/code?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        setHasCode(true);
        setCode(data.code);
        setLink(data.link);
        setLinkDocumentos(`https://token.ibedis.com.br/registro-documentos?ref=${data.code}`);
        setStats({
          total_referrals: 0,
          registered_referrals: 0,
          purchased_referrals: 0,
          conversion_rate: 0,
          commission: { pending: '0.00', approved: '0.00', paid: '0.00', total: '0.00' }
        });
      }
    } catch (error) {
      console.error('Erro ao gerar código:', error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pendente</span>;
      case 'registered':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Cadastrado</span>;
      case 'purchased':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Comprou</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Aprovada</span>;
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Paga</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Cancelada</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calcular saldo disponível para saque (aprovado)
  const saldoDisponivel = parseFloat(stats?.commission?.approved || '0');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={false}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#1a3f4d] to-[#2d5a6b] rounded-3xl p-8 md:p-12 text-white mb-8">
          <div className="flex items-center justify-center mb-4">
            <Gift className="w-16 h-16 text-[#b8963c]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Programa de Indicações
          </h1>
          <p className="text-white/90 text-center text-lg max-w-2xl mx-auto">
            Indique amigos e ganhe comissões sobre todas as compras de tokens e registro de documentos!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/20 rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#b8963c]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">1. Compartilhe</h3>
              <p className="text-sm text-white/80">Envie seu link exclusivo para amigos</p>
            </div>
            
            <div className="bg-white/20 rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#b8963c]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">2. Eles Compram</h3>
              <p className="text-sm text-white/80">Tokens ou registram documentos</p>
            </div>
            
            <div className="bg-white/20 rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#b8963c]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">3. Você Ganha</h3>
              <p className="text-sm text-white/80">10% de comissão por compra!</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3f4d] mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        )}

        {!loading && !user && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Entre para Participar</h2>
            <p className="text-gray-600 mb-6">
              Faça login ou crie uma conta para gerar seu código de indicação!
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 bg-[#1a3f4d] text-white rounded-xl font-bold hover:bg-[#1a3f4d]/90 transition"
            >
              <LogIn className="w-5 h-5 mr-2 inline" />
              Entrar / Cadastrar
            </button>
          </div>
        )}

        {!loading && user && !hasCode && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Gift className="w-16 h-16 text-[#b8963c] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Olá, {user.full_name || user.email}!
            </h2>
            <p className="text-gray-600 mb-6">
              Clique abaixo para gerar seu código único!
            </p>
            <button
              onClick={generateCode}
              disabled={generatingCode}
              className="px-8 py-3 bg-[#b8963c] text-white rounded-xl font-bold hover:bg-[#b8963c]/90 transition disabled:opacity-50 flex items-center justify-center mx-auto"
            >
              {generatingCode ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Gift className="w-5 h-5 mr-2" />}
              Gerar Meu Código
            </button>
          </div>
        )}

        {!loading && user && hasCode && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Link2 className="w-5 h-5 mr-2 text-[#1a3f4d]" />
                Seus Links de Indicação
              </h2>
              
              <div className="bg-[#1a3f4d]/5 border border-[#1a3f4d]/20 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-[#1a3f4d] mb-2">Seu código exclusivo:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-bold text-[#1a3f4d] font-mono tracking-wider">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code, 'code')}
                    className="p-2 bg-[#1a3f4d]/10 rounded-lg hover:bg-[#1a3f4d]/20 transition"
                  >
                    {copied === 'code' ? <Check className="w-5 h-5 text-[#1a3f4d]" /> : <Copy className="w-5 h-5 text-[#1a3f4d]" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Link para Marketplace</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={link} readOnly className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono text-gray-600" />
                    <button onClick={() => copyToClipboard(link, 'link')} className="px-4 py-2 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#1a3f4d]/90 transition">
                      {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Link para Documentos</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={linkDocumentos} readOnly className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono text-gray-600" />
                    <button onClick={() => copyToClipboard(linkDocumentos, 'linkDoc')} className="px-4 py-2 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#1a3f4d]/90 transition">
                      {copied === 'linkDoc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Indicações</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.total_referrals || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Cadastrados</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.registered_referrals || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Compraram</p>
                    <p className="text-2xl font-bold text-[#1a3f4d]">{stats?.purchased_referrals || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#1a3f4d]/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-[#1a3f4d]" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversão</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.conversion_rate || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-[#b8963c]/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#b8963c]" />
                  </div>
                </div>
              </div>
            </div>

            {/* NOVO: Card de Carteira e Saque */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Sua Carteira</h3>
                    <p className="text-emerald-100">Saldo disponível para saque</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="text-center md:text-right">
                    <p className="text-sm text-emerald-100">Disponível</p>
                    <p className="text-3xl font-bold">R$ {saldoDisponivel.toFixed(2)}</p>
                  </div>
                  
                  <Link
                    href="/carteira"
                    className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition flex items-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Acessar Carteira
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-emerald-100">Pendente</p>
                  <p className="text-lg font-bold">R$ {stats?.commission?.pending || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100">Aprovado</p>
                  <p className="text-lg font-bold">R$ {stats?.commission?.approved || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100">Já Sacado</p>
                  <p className="text-lg font-bold">R$ {stats?.commission?.paid || '0.00'}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm text-emerald-100">
                💡 <strong>Dica:</strong> Na carteira você pode solicitar saque das comissões aprovadas via USDT, USDC ou MATIC na rede Polygon. Mínimo: $20 | 1 saque por semana.
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#b8963c]" />
                Suas Comissões
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-yellow-50 rounded-xl text-center">
                  <p className="text-sm text-yellow-700">Pendente</p>
                  <p className="text-xl font-bold text-yellow-700">R$ {stats?.commission?.pending || '0.00'}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <p className="text-sm text-emerald-700">Aprovada</p>
                  <p className="text-xl font-bold text-emerald-700">R$ {stats?.commission?.approved || '0.00'}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <p className="text-sm text-purple-700">Paga</p>
                  <p className="text-xl font-bold text-purple-700">R$ {stats?.commission?.paid || '0.00'}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-xl text-center">
                  <p className="text-sm text-gray-700">Total</p>
                  <p className="text-xl font-bold text-gray-800">R$ {stats?.commission?.total || '0.00'}</p>
                </div>
              </div>

              {commissions.length > 0 ? (
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Indicado</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tipo</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Valor</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Comissão</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(commission.created_at)}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{commission.referred_email}</td>
                          <td className="px-4 py-3 text-sm">{commission.purchase_type === 'token' ? 'Token' : 'Documento'}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-800">R$ {parseFloat(commission.purchase_amount?.toString() || '0').toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-[#1a3f4d]">R$ {parseFloat(commission.commission_amount?.toString() || '0').toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(commission.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Você ainda não tem comissões. Compartilhe seu link!</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#1a3f4d]" />
                Pessoas Indicadas ({referrals.length})
              </h2>

              {referrals.length > 0 ? (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          referral.status === 'purchased' ? 'bg-emerald-100' : referral.status === 'registered' ? 'bg-blue-100' : 'bg-yellow-100'
                        }`}>
                          {referral.status === 'purchased' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : referral.status === 'registered' ? <User className="w-5 h-5 text-blue-600" /> : <Clock className="w-5 h-5 text-yellow-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{referral.name || referral.email}</p>
                          <p className="text-sm text-gray-500">{referral.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(referral.status)}
                        {referral.total_purchases > 0 && <p className="text-sm text-[#1a3f4d] mt-1">{referral.total_purchases} compra(s) - R$ {parseFloat(referral.total_spent?.toString() || '0').toFixed(2)}</p>}
                        <p className="text-xs text-gray-400 mt-1">Indicado em {formatDate(referral.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Você ainda não indicou ninguém. Compartilhe seu link!</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-[#1a3f4d] to-[#2d5a6b] rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Como funciona?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="font-bold">Tokens</p>
                  <p className="text-2xl font-bold text-[#b8963c]">{settings?.commission_percent_tokens || 10}%</p>
                  <p className="text-sm opacity-80">de comissão por compra</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="font-bold">Documentos</p>
                  <p className="text-2xl font-bold text-[#b8963c]">{settings?.commission_percent_documents || 10}%</p>
                  <p className="text-sm opacity-80">de comissão por registro</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="font-bold">Saque Mínimo</p>
                  <p className="text-2xl font-bold text-[#b8963c]">$20</p>
                  <p className="text-sm opacity-80">via cripto (Polygon)</p>
                </div>
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
