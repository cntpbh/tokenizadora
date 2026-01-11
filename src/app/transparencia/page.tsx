'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Calendar, ExternalLink, Search, Loader2, Eye, Shield, 
  Building2, Hash, Copy, CheckCircle, BarChart3, Boxes, Clock
} from 'lucide-react';
import { supabase, getProjects, Project, User, getUserByEmail } from '@/lib/supabase';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';

interface DocumentData {
  id: string;
  tx_hash?: string;
  status?: string;
  category?: string;
  title?: string;
}

export default function TransparenciaPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('transparencia');

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar projetos
      const projectsData = await getProjects();
      setProjects((projectsData || []).filter(p => p.token_id || p.tx_hash));
      
      // Carregar documentos institucionais diretamente
      try {
        const { data: docsData, error } = await supabase
          .from('documents')
          .select('id, tx_hash, status, category, title')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        
        if (!error && docsData) {
          setDocuments(docsData);
        } else {
          console.log('Documentos não encontrados ou tabela não existe');
          setDocuments([]);
        }
      } catch (docError) {
        console.log('Erro ao carregar documentos:', docError);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const userData = await getUserByEmail(session.user.email);
      if (userData) setUser(userData);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredProjects = search 
    ? projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase())
      ) 
    : projects;

  const stats = {
    totalProjects: projects.length,
    totalTokens: projects.reduce((sum, p) => sum + (p.total_credits || 0), 0),
    totalDocs: documents.length,
    docsOnChain: documents.filter(d => d.tx_hash).length,
    projectsOnChain: projects.filter(p => p.tx_hash).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={false}
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#1a3f4d] mx-auto mb-4" />
            <p className="text-gray-500">Carregando dados da blockchain...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
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

      <div className="bg-gradient-to-r from-[#1a3f4d] to-[#2a5f6d] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mr-4">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Portal de Transparência</h1>
              <p className="text-gray-200">Rastreabilidade blockchain dos ativos tokenizados</p>
            </div>
          </div>
          <p className="text-gray-200 max-w-2xl mt-4">
            Acesso público aos projetos e documentos registrados na blockchain Polygon. 
            Todos os registros são imutáveis e verificáveis publicamente.
          </p>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <Boxes className="w-4 h-4 mr-1" />Projetos
              </div>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <Hash className="w-4 h-4 mr-1" />Tokens
              </div>
              <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <FileText className="w-4 h-4 mr-1" />Documentos
              </div>
              <p className="text-2xl font-bold">{stats.totalDocs}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <Shield className="w-4 h-4 mr-1" />Na Blockchain
              </div>
              <p className="text-2xl font-bold">{stats.projectsOnChain + stats.docsOnChain}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <BarChart3 className="w-4 h-4 mr-1" />Rede
              </div>
              <p className="text-lg font-bold flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>Polygon
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6 w-full">
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar projetos..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3f4d] focus:border-transparent" 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h2 className="text-xl font-bold text-[#1a3f4d] mb-6 flex items-center">
          <Boxes className="w-6 h-6 mr-2" />
          Projetos Tokenizados ({filteredProjects.length})
        </h2>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum projeto tokenizado encontrado.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map(project => {
              const projectId = project.id || '';
              return (
                <div key={projectId} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-[#1a3f4d] text-xl">{project.name}</h3>
                          {project.token_id && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              Token #{project.token_id}
                            </span>
                          )}
                          {project.tx_hash && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center font-medium">
                              <Shield className="w-3 h-3 mr-1" />Verificado
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {project.location && (
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />{project.location}
                            </span>
                          )}
                          {project.total_credits > 0 && (
                            <span className="flex items-center">
                              <Hash className="w-4 h-4 mr-1" />{project.total_credits.toLocaleString()} tokens
                            </span>
                          )}
                          {project.created_at && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(project.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      {project.image_url && (
                        <img src={project.image_url} alt={project.name} className="w-24 h-24 rounded-xl object-cover ml-4 border" />
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#1a3f4d]/5 to-purple-50 border-t p-6">
                    <h4 className="font-bold text-[#1a3f4d] mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-purple-600" />
                      Registro na Blockchain Polygon
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {project.contract_address && (
                        <div className="bg-white rounded-xl p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-medium">CONTRATO (ERC-1155)</span>
                            <button onClick={() => copyToClipboard(project.contract_address!, `contract-${projectId}`)} className="text-purple-600 hover:text-purple-800">
                              {copied === `contract-${projectId}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="font-mono text-sm text-[#1a3f4d] break-all">{project.contract_address}</p>
                          <a href={`https://polygonscan.com/address/${project.contract_address}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 mt-2">
                            Ver no Polygonscan <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}
                      {project.token_id && (
                        <div className="bg-white rounded-xl p-4 border">
                          <span className="text-xs text-gray-500 font-medium block mb-2">TOKEN ID</span>
                          <p className="font-mono text-2xl font-bold text-purple-600">#{project.token_id}</p>
                          <p className="text-xs text-gray-500 mt-1">Identificador único no contrato</p>
                        </div>
                      )}
                    </div>

                    {project.tx_hash && (
                      <div className="bg-white rounded-xl p-4 border mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 font-medium">HASH DA TRANSAÇÃO (MINT)</span>
                          <button onClick={() => copyToClipboard(project.tx_hash!, `tx-${projectId}`)} className="text-purple-600 hover:text-purple-800">
                            {copied === `tx-${projectId}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="font-mono text-sm text-[#1a3f4d] break-all">{project.tx_hash}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {project.tx_hash && (
                        <a href={`https://polygonscan.com/tx/${project.tx_hash}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#8247E5] text-white rounded-lg text-sm font-medium flex items-center hover:bg-[#6b3bc7] transition">
                          <ExternalLink className="w-4 h-4 mr-2" />Ver Transação
                        </a>
                      )}
                      {project.contract_address && project.token_id && (
                        <a href={`https://polygonscan.com/token/${project.contract_address}?a=${project.token_id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center hover:bg-purple-200 transition">
                          <Hash className="w-4 h-4 mr-2" />Ver Token
                        </a>
                      )}
                      <Link href={`/?projeto=${projectId}`} className="px-4 py-2 bg-[#1a3f4d] text-white rounded-lg text-sm font-medium flex items-center hover:bg-[#2a5f6d] transition">
                        <Eye className="w-4 h-4 mr-2" />Ver no Marketplace
                      </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <Shield className="w-4 h-4 mr-2 text-green-500" />
                        Registro imutável na rede Polygon (Mainnet) • Padrão ERC-1155 • Metodologia VISIA
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Link href="/institucional" className="block bg-gradient-to-r from-[#1a3f4d] to-[#2a5f6d] text-white rounded-2xl p-6 hover:shadow-lg transition group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Documentos Institucionais</h3>
                  <p className="text-gray-200 text-sm">Acordos, estatutos e credenciamentos • {stats.docsOnChain} registros na blockchain</p>
                </div>
              </div>
              <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

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
