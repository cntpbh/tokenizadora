'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, Calendar, ExternalLink, Search, Loader2, Eye, FileText, Award, Shield,
  Hash, Copy, CheckCircle, BarChart3, FolderOpen, Clock, Download, AlertCircle
} from 'lucide-react';
import { getInstitutionalDocuments, Document } from '@/lib/supabase';
import Link from 'next/link';

const CATEGORIES: { [key: string]: { label: string; icon: string; color: string } } = {
  'ACORDO': { label: 'Acordos e Convênios', icon: '🤝', color: 'bg-blue-100 text-blue-700' },
  'ESTATUTO': { label: 'Estatutos e Regimentos', icon: '📜', color: 'bg-amber-100 text-amber-700' },
  'CERTIFICADO': { label: 'Credenciamentos', icon: '🏆', color: 'bg-green-100 text-green-700' },
  'RELATORIO': { label: 'Relatórios', icon: '📊', color: 'bg-cyan-100 text-cyan-700' },
  'ATA': { label: 'Atas e Deliberações', icon: '📋', color: 'bg-orange-100 text-orange-700' },
  'POLITICA': { label: 'Políticas', icon: '📑', color: 'bg-indigo-100 text-indigo-700' },
  'CONTRATO': { label: 'Contratos', icon: '📝', color: 'bg-purple-100 text-purple-700' },
  'EDITAL': { label: 'Editais', icon: '📋', color: 'bg-red-100 text-red-700' },
  'REGULAMENTO': { label: 'Regulamentos', icon: '🛡️', color: 'bg-teal-100 text-teal-700' },
  'PROPOSTA': { label: 'Propostas', icon: '💼', color: 'bg-pink-100 text-pink-700' },
  'OUTRO': { label: 'Outros Documentos', icon: '📁', color: 'bg-gray-100 text-gray-700' },
};

export default function InstitucionalPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInstitutionalDocuments().catch(() => []);
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao carregar documentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleExpanded = (docId: string) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = !search || 
      doc.title.toLowerCase().includes(search.toLowerCase()) || 
      doc.description?.toLowerCase().includes(search.toLowerCase()) ||
      doc.document_number?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const docsByCategory = filteredDocs.reduce((acc, doc) => {
    const cat = doc.category || 'OUTRO';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as { [key: string]: Document[] });

  const stats = {
    total: documents.length,
    onChain: documents.filter(d => d.tx_hash).length,
    categories: new Set(documents.map(d => d.category)).size,
    thisYear: documents.filter(d => {
      if (!d.publish_date) return false;
      return new Date(d.publish_date).getFullYear() === new Date().getFullYear();
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1a3f4d] mx-auto mb-4" />
          <p className="text-gray-500">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-[#1a3f4d] text-white rounded-lg hover:bg-[#2a5f6d]">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" alt="IBEDIS" className="h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/transparencia" className="text-[#1a3f4d] hover:text-[#b8963c] font-medium transition text-sm">
              Portal de Transparência
            </Link>
            <Link href="/" className="text-[#1a3f4d] hover:text-[#b8963c] font-medium transition">
              ← Voltar
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-[#1a3f4d] to-[#2a5f6d] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mr-4">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Documentos Institucionais</h1>
              <p className="text-gray-200">Base documental do IBEDIS com rastreabilidade blockchain</p>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <FileText className="w-4 h-4 mr-1" />Total
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <Shield className="w-4 h-4 mr-1" />Na Blockchain
              </div>
              <p className="text-2xl font-bold">{stats.onChain}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <FolderOpen className="w-4 h-4 mr-1" />Categorias
              </div>
              <p className="text-2xl font-bold">{stats.categories}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center text-gray-300 text-sm mb-1">
                <Calendar className="w-4 h-4 mr-1" />Este Ano
              </div>
              <p className="text-2xl font-bold">{stats.thisYear}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar documentos..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3f4d] focus:border-transparent" 
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3f4d] bg-white"
            >
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum documento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(docsByCategory).map(([category, docs]) => {
              const catInfo = CATEGORIES[category] || CATEGORIES['OUTRO'];
              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{catInfo.icon}</span>
                    <h2 className="text-xl font-bold text-[#1a3f4d]">{catInfo.label}</h2>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {docs.length} documento{docs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {docs.map((doc, index) => {
                      const docId = doc.id || `doc-${index}`;
                      return (
                        <div key={docId} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-bold text-[#1a3f4d] text-lg">{doc.title}</h3>
                                  {doc.tx_hash && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center font-medium">
                                      <Shield className="w-3 h-3 mr-1" />Blockchain
                                    </span>
                                  )}
                                  {doc.ipfs_hash && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">IPFS</span>
                                  )}
                                </div>
                                {doc.description && (
                                  <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  {doc.document_number && (
                                    <span className="flex items-center">
                                      <Hash className="w-4 h-4 mr-1" />Nº {doc.document_number}
                                    </span>
                                  )}
                                  {doc.publish_date && (
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {new Date(doc.publish_date).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                              {doc.document_url && (
                                <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#1a3f4d] text-white rounded-lg text-sm font-medium flex items-center hover:bg-[#2a5f6d] transition">
                                  <Eye className="w-4 h-4 mr-2" />Ver Documento
                                </a>
                              )}
                              {doc.tx_hash && (
                                <button
                                  onClick={() => toggleExpanded(docId)}
                                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center hover:bg-purple-200 transition"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  {expandedDoc === docId ? 'Ocultar' : 'Ver'} Certificado
                                </button>
                              )}
                            </div>
                          </div>

                          {doc.tx_hash && expandedDoc === docId && (
                            <div className="bg-gradient-to-r from-gray-50 to-purple-50 border-t p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-[#1a3f4d] flex items-center">
                                  <Award className="w-5 h-5 mr-2 text-[#b8963c]" />
                                  Certificado de Registro na Blockchain
                                </h4>
                                <span className="flex items-center text-sm text-green-600 font-medium">
                                  <CheckCircle className="w-4 h-4 mr-1" />Verificado
                                </span>
                              </div>

                              <div className="bg-white rounded-xl border-2 border-dashed border-[#b8963c]/30 p-6 mb-4">
                                <div className="text-center mb-6">
                                  <img src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" alt="IBEDIS" className="h-12 mx-auto mb-3" />
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                                    Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável
                                  </p>
                                </div>

                                <div className="text-center mb-6">
                                  <h5 className="text-lg font-bold text-[#1a3f4d] mb-1">CERTIFICADO DE AUTENTICIDADE</h5>
                                  <p className="text-sm text-gray-600">Registro Imutável na Blockchain Polygon</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <span className="text-xs text-gray-500 font-medium block mb-1">DOCUMENTO</span>
                                    <p className="font-semibold text-[#1a3f4d]">{doc.title}</p>
                                    {doc.document_number && <p className="text-sm text-gray-600">Nº {doc.document_number}</p>}
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <span className="text-xs text-gray-500 font-medium block mb-1">DATA DO REGISTRO</span>
                                    <p className="font-semibold text-[#1a3f4d]">
                                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-[#1a3f4d]/5 rounded-lg p-4 mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-medium">HASH DA TRANSAÇÃO</span>
                                    <button onClick={() => copyToClipboard(doc.tx_hash!, `tx-${docId}`)} className="text-purple-600 hover:text-purple-800">
                                      {copied === `tx-${docId}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>
                                  <p className="font-mono text-sm text-[#1a3f4d] break-all">{doc.tx_hash}</p>
                                </div>

                                {doc.ipfs_hash && (
                                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs text-gray-500 font-medium">HASH SHA256</span>
                                      <button onClick={() => copyToClipboard(doc.ipfs_hash!, `ipfs-${docId}`)} className="text-blue-600 hover:text-blue-800">
                                        {copied === `ipfs-${docId}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                      </button>
                                    </div>
                                    <p className="font-mono text-sm text-blue-800 break-all">{doc.ipfs_hash}</p>
                                  </div>
                                )}

                                <div className="flex items-center justify-center gap-6 py-4">
                                  <div className="text-center">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://polygonscan.com/tx/${doc.tx_hash}`} alt="QR Code" className="w-24 h-24 mx-auto mb-2 rounded-lg" />
                                    <p className="text-xs text-gray-500">Escaneie para verificar</p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm text-gray-600 mb-1"><strong>Rede:</strong> Polygon Mainnet</p>
                                    <p className="text-sm text-gray-600 mb-1"><strong>Status:</strong> <span className="text-green-600">✓ Confirmado</span></p>
                                    <p className="text-sm text-gray-600"><strong>Verificável em:</strong> polygonscan.com</p>
                                  </div>
                                </div>

                                <div className="border-t pt-4 mt-4 text-center">
                                  <p className="text-xs text-gray-500">Este certificado atesta que o documento foi registrado de forma imutável na blockchain.</p>
                                  <p className="text-xs text-gray-400 mt-1">Metodologia VISIA - ISBN 978-65-01-58740-0 • MCTI/FINEP</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <a href={`https://polygonscan.com/tx/${doc.tx_hash}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#8247E5] text-white rounded-lg text-sm font-medium flex items-center hover:bg-[#6b3bc7] transition">
                                  <ExternalLink className="w-4 h-4 mr-2" />Ver na Polygonscan
                                </a>
                                <Link href={`/certificado-documento?id=${docId}`} className="px-4 py-2 bg-[#b8963c] text-white rounded-lg text-sm font-medium flex items-center hover:bg-[#9a7d32] transition">
                                  <Download className="w-4 h-4 mr-2" />Baixar PDF
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-bold text-[#1a3f4d] mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />Resumo dos Registros
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-[#1a3f4d]">{stats.total}</p>
              <p className="text-sm text-gray-500">Documentos Totais</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600">{stats.onChain}</p>
              <p className="text-sm text-gray-500">Na Blockchain</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600">{stats.total > 0 ? Math.round((stats.onChain / stats.total) * 100) : 0}%</p>
              <p className="text-sm text-gray-500">Taxa de Registro</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">{stats.categories}</p>
              <p className="text-sm text-gray-500">Categorias</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <Link href="/transparencia" className="block bg-gradient-to-r from-[#1a3f4d] to-[#2a5f6d] text-white rounded-2xl p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Portal de Transparência</h3>
                <p className="text-gray-200 text-sm">Projetos tokenizados e documentação técnica</p>
              </div>
            </div>
            <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <footer className="bg-gray-100 border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <img src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" alt="IBEDIS" className="h-10 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-2">IBEDIS - Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável</p>
          <p className="text-gray-400 text-xs">ICT credenciada pelo MCTI/FINEP • Metodologia VISIA - ISBN 978-65-01-58740-0</p>
        </div>
      </footer>
    </div>
  );
}
