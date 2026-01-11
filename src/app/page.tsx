'use client';

import { useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { 
  Search, Filter, ExternalLink, CheckCircle, XCircle, Loader2,
  Trash2, ArrowRight, Clock, Wallet, FileText, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatsBar from '@/components/StatsBar';
import ProjectCard from '@/components/ProjectCard';
import BuyModal from '@/components/BuyModal';
import AdminPanel from '@/components/AdminPanel';
import AuthModal from '@/components/auth/AuthModal';
import ClientArea from '@/components/client/ClientArea';
import SettingsPanel from '@/components/settings/SettingsPanel';
import CertificateView from '@/components/certificate/CertificateView';
import ProjectDetailsModal from '@/components/ProjectDetailsModal';

import { 
  supabase, getProjects, getStats, getTransactions, 
  getCertificateByCode, deleteProject, User, Certificate
} from '@/lib/supabase';

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

const ASSET_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'CARBON_REDD', label: '🌳 REDD+' },
  { value: 'CARBON_FOREST', label: '🌲 Florestal' },
  { value: 'CARBON_BLUE', label: '🌊 Carbono Azul' },
  { value: 'CPR_VERDE', label: '🌾 CPR Verde' },
  { value: 'CONTRACT_ESG', label: '📋 ESG' },
  { value: 'CONTRACT_VISIA', label: '📊 VISIA' },
  { value: 'CONTRACT_PVPE', label: '🤝 PVPE' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [projects, setProjects] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCredits: '0', projects: 0, volume: 'R$ 0', companies: 0 });
  
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  
  const [gestaoTab, setGestaoTab] = useState<'projetos' | 'config'>('projetos');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [detailsProject, setDetailsProject] = useState<any>(null);

  const address = useAddress();
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  useEffect(() => {
    loadData();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
      setUser(data);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        setUser(data);
      } else {
        setUser(null);
      }
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, statsData, txData] = await Promise.all([
        getProjects(),
        getStats(),
        getTransactions(20)
      ]);
      setProjects(projectsData);
      setStats(statsData);
      setTransactions(txData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

  const handleBuy = (project: any) => {
    setSelectedProject(project);
    setShowBuyModal(true);
  };

  const handleLoginRequired = () => {
    setShowBuyModal(false);
    setShowAuthModal(true);
  };

  const handlePurchaseComplete = (certificateCode: string) => {
    setShowBuyModal(false);
    setActiveTab('cliente');
    loadData();
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      setVerifyError('Digite o código do certificado');
      return;
    }
    
    setVerifyLoading(true);
    setVerifyError('');
    setVerifyResult(null);
    
    try {
      const certificate = await getCertificateByCode(verifyCode.trim().toUpperCase());
      if (certificate) {
        setVerifyResult(certificate);
      } else {
        setVerifyError('Certificado não encontrado. Verifique o código e tente novamente.');
      }
    } catch (error) {
      setVerifyError('Erro ao verificar certificado.');
    }
    
    setVerifyLoading(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir projeto.');
    }
    setDeletingId(null);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || p.asset_type === filterType;
    const isActive = p.status === 'active';
    return matchesSearch && matchesType && isActive;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={isAdmin}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
      />
      
      {activeTab === 'marketplace' && <StatsBar stats={stats} />}

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {activeTab === 'marketplace' && (
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhum projeto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onBuy={() => handleBuy(project)}
                    onViewDetails={() => setDetailsProject(project)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transparencia' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Transparência</h2>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Últimas Transações</h3>
              
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma transação registrada.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div key={tx.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'purchase' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {tx.type === 'purchase' ? '💰' : '🔄'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{tx.buyer_name || 'Usuário'}</p>
                          <p className="text-sm text-gray-500">{tx.amount} tokens • {tx.payment_method?.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">R$ {tx.price_total?.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4">🔗 Contrato Inteligente</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Rede</span>
                  <p className="text-purple-300">Polygon (Mainnet)</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Endereço do Contrato</span>
                  <p className="font-mono text-sm break-all">{CONTRACT_ADDRESS}</p>
                </div>
                <a
                  href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-emerald-400 hover:text-emerald-300"
                >
                  Ver no Polygonscan <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verificar' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Verificar Certificado</h2>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <p className="text-gray-600 mb-4">
                Digite o código do certificado para verificar sua autenticidade.
              </p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="Ex: IBEDIS-M5X7K-ABC123"
                  className="flex-1 px-4 py-3 border-2 rounded-xl font-mono text-lg focus:ring-2 focus:ring-emerald-500 uppercase"
                />
                <button
                  onClick={handleVerify}
                  disabled={verifyLoading}
                  className="px-6 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {verifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                </button>
              </div>

              {verifyError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
                  <XCircle className="w-5 h-5 mr-2" />
                  {verifyError}
                </div>
              )}
            </div>

            {verifyResult && (
              <div className="mt-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                  <span className="font-bold text-emerald-800">Certificado Válido e Autêntico!</span>
                </div>
                <CertificateView certificate={verifyResult} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'custodia' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔗 Cadeia de Custódia</h2>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <p className="text-gray-600 mb-6">
                Histórico completo de todas as operações registradas na blockchain.
              </p>

              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum registro na cadeia de custódia.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200" />
                  
                  <div className="space-y-6">
                    {transactions.map((tx, index) => (
                      <div key={tx.id || index} className="relative flex items-start ml-6 pl-8">
                        <div className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center ${
                          tx.type === 'purchase' ? 'bg-emerald-500' : 'bg-blue-500'
                        } text-white text-xs`}>
                          {tx.type === 'purchase' ? '💰' : '🔄'}
                        </div>
                        
                        <div className="flex-1 bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.type === 'purchase' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {tx.type === 'purchase' ? 'Aquisição' : 'Transferência'}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(tx.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Titular:</span>
                              <p className="font-medium text-gray-800">{tx.buyer_name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Quantidade:</span>
                              <p className="font-medium text-gray-800">{tx.amount} tokens</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Pagamento:</span>
                              <p className="font-medium text-gray-800">{tx.payment_method?.toUpperCase() || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Valor:</span>
                              <p className="font-medium text-emerald-600">R$ {tx.price_total?.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                          
                          {tx.certificate_code && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="text-gray-500 text-xs">Certificado:</span>
                              <p className="font-mono text-sm text-emerald-700">{tx.certificate_code}</p>
                            </div>
                          )}
                          
                          {tx.tx_hash && (
                            <a
                              href={`https://polygonscan.com/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-purple-600 hover:text-purple-800 text-xs mt-2"
                            >
                              Ver na blockchain <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cliente' && user && (
          <ClientArea 
            user={user} 
            onLogout={() => {
              supabase.auth.signOut();
              setUser(null);
              setActiveTab('marketplace');
            }}
            onUserUpdate={(updatedUser) => setUser(updatedUser)}
          />
        )}

        {activeTab === 'cliente' && !user && (
          <div className="max-w-md mx-auto text-center py-12">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-6">Faça login para acessar sua área do cliente.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition"
            >
              Entrar / Cadastrar
            </button>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && <AdminPanel />}

        {activeTab === 'gestao' && isAdmin && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Gestão da Plataforma</h2>
            
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setGestaoTab('projetos')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  gestaoTab === 'projetos' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📦 Projetos
              </button>
              <button
                onClick={() => setGestaoTab('config')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  gestaoTab === 'config' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ⚙️ Configurações
              </button>
            </div>

            {gestaoTab === 'projetos' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-bold text-gray-800">Todos os Projetos</h3>
                </div>
                
                {projects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum projeto cadastrado.</p>
                ) : (
                  <div className="divide-y">
                    {projects.map((project) => (
                      <div key={project.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          {project.image_url ? (
                            <img src={project.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">🌳</div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{project.name}</p>
                            <p className="text-sm text-gray-500">
                              Token #{project.token_id} • {project.asset_type} • {project.status}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {project.status === 'active' ? 'Ativo' : project.status}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={deletingId === project.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Excluir projeto"
                          >
                            {deletingId === project.id 
                              ? <Loader2 className="w-5 h-5 animate-spin" /> 
                              : <Trash2 className="w-5 h-5" />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {gestaoTab === 'config' && <SettingsPanel />}
          </div>
        )}

        {/* CTA REGISTRO DE DOCUMENTOS */}
        {activeTab === 'marketplace' && (
          <div className="mt-12 bg-gradient-to-r from-[#1a3f4d] to-[#2d5a6b] rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#b8963c] text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                  🔒 Novo Serviço
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Registro de Documentos
                </h2>
                <p className="text-white/80 text-lg mb-6 max-w-xl">
                  Comprove a autenticidade dos seus documentos com segurança jurídica e validade permanente. 
                  Hash SHA-256 imutável com certificado digital instantâneo.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</span>
                    Certificado digital
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</span>
                    Validade permanente
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</span>
                    Pagamento via PIX
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 text-center shadow-xl min-w-[280px]">
                <p className="text-gray-500 text-sm mb-1">Preço promocional</p>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <span className="text-5xl font-bold text-[#b8963c]">R$ 5</span>
                  <span className="text-gray-400 text-lg">,00</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">por documento registrado</p>
                
                <Link
                  href="/registro-documentos"
                  className="block w-full py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 transition mb-3"
                >
                  📄 Registrar Documento
                </Link>
                <Link
                  href="/registro-documentos/verificar"
                  className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  🔍 Verificar Documento
                </Link>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />

      {showBuyModal && selectedProject && (
        <BuyModal
          project={selectedProject}
          user={user}
          onClose={() => setShowBuyModal(false)}
          onLoginRequired={handleLoginRequired}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            checkAuth();
          }}
        />
      )}

      {detailsProject && (
        <ProjectDetailsModal
          project={detailsProject}
          onClose={() => setDetailsProject(null)}
          onBuy={() => {
            setDetailsProject(null);
            handleBuy(detailsProject);
          }}
        />
      )}
    </div>
  );
}
