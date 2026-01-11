'use client';

import { useState } from 'react';
import { 
  X, MapPin, Building, User, Wallet, FileText, Video, Globe,
  Award, Shield, ExternalLink, Hash, Calendar, Coins, Info,
  Download, Eye
} from 'lucide-react';

interface ProjectDetailsModalProps {
  project: any;
  onClose: () => void;
  onBuy: () => void;
}

const TYPE_LABELS: { [key: string]: { emoji: string; label: string; color: string } } = {
  CARBON_REDD: { emoji: '🌳', label: 'REDD+', color: 'bg-green-100 text-green-700' },
  CARBON_FOREST: { emoji: '🌲', label: 'Florestal', color: 'bg-emerald-100 text-emerald-700' },
  CARBON_BLUE: { emoji: '🌊', label: 'Carbono Azul', color: 'bg-blue-100 text-blue-700' },
  CPR_VERDE: { emoji: '🌾', label: 'CPR Verde', color: 'bg-lime-100 text-lime-700' },
  CONTRACT_ESG: { emoji: '📋', label: 'Contrato ESG', color: 'bg-purple-100 text-purple-700' },
  CONTRACT_VISIA: { emoji: '📊', label: 'VISIA', color: 'bg-indigo-100 text-indigo-700' },
  CONTRACT_PVPE: { emoji: '🤝', label: 'PVPE', color: 'bg-pink-100 text-pink-700' },
  RENEWABLE_ENERGY: { emoji: '⚡', label: 'Energia', color: 'bg-yellow-100 text-yellow-700' },
  WASTE_MANAGEMENT: { emoji: '♻️', label: 'Resíduos', color: 'bg-teal-100 text-teal-700' },
  WATER_CONSERVATION: { emoji: '💧', label: 'Água', color: 'bg-cyan-100 text-cyan-700' },
  BIODIVERSITY: { emoji: '🦋', label: 'Biodiversidade', color: 'bg-orange-100 text-orange-700' },
  SOCIAL_IMPACT: { emoji: '👥', label: 'Social', color: 'bg-rose-100 text-rose-700' },
  OTHER: { emoji: '📦', label: 'Outro', color: 'bg-gray-100 text-gray-700' },
};

export default function ProjectDetailsModal({ project, onClose, onBuy }: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'video' | 'docs'>('info');
  const typeInfo = TYPE_LABELS[project.asset_type] || TYPE_LABELS.OTHER;
  
  const hasValidImage = project.image_url && 
    !project.image_url.includes('undefined') && 
    project.image_url.startsWith('http');

  const progress = project.total_credits > 0 
    ? ((project.total_credits - (project.available_credits || project.total_credits)) / project.total_credits) * 100 
    : 0;

  // Extrair ID do vídeo do YouTube
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(project.video_url);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header com imagem */}
        <div className="relative h-56 md:h-72 flex-shrink-0">
          {hasValidImage ? (
            <img 
              src={project.image_url} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 flex flex-col items-center justify-center`}>
              <span className="text-8xl mb-3 opacity-80">{typeInfo.emoji}</span>
              <span className="text-white/80 text-lg font-medium">{typeInfo.label}</span>
            </div>
          )}
          
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color} shadow-md`}>
              {typeInfo.emoji} {typeInfo.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-md ${
              project.status === 'active' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-500 text-white'
            }`}>
              {project.status === 'active' ? '● Disponível' : project.status}
            </span>
          </div>

          {/* Título sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{project.name}</h2>
            {project.location && (
              <div className="flex items-center text-white/80">
                <MapPin className="w-4 h-4 mr-1" />
                {project.location}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0">
          {[
            { id: 'info', label: 'Informações', icon: Info },
            { id: 'video', label: 'Vídeo', icon: Video, disabled: !youtubeId },
            { id: 'docs', label: 'Documentos', icon: FileText, disabled: !project.document_url },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? 'text-emerald-700 border-b-2 border-emerald-700'
                  : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Descrição */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-emerald-600" />
                  Sobre o Projeto
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {project.description || 'Projeto de ativo sustentável tokenizado na blockchain Polygon. Adquira tokens para apoiar iniciativas ambientais e sociais verificadas.'}
                </p>
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <Coins className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Total Tokens</p>
                  <p className="font-bold text-gray-800">{project.total_credits?.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Award className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Disponível</p>
                  <p className="font-bold text-gray-800">{(project.available_credits || project.total_credits)?.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <Hash className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Token ID</p>
                  <p className="font-bold text-gray-800">#{project.token_id || '—'}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Criado em</p>
                  <p className="font-bold text-gray-800">
                    {project.created_at 
                      ? new Date(project.created_at).toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso de vendas</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Owner */}
              {project.owner_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-gray-600" />
                    Proprietário / Desenvolvedor
                  </h4>
                  <p className="text-gray-700">{project.owner_name}</p>
                  {project.owner_wallet && (
                    <a
                      href={`https://polygonscan.com/address/${project.owner_wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:underline flex items-center mt-1"
                    >
                      <Wallet className="w-3 h-3 mr-1" />
                      {project.owner_wallet.slice(0, 10)}...{project.owner_wallet.slice(-8)}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              {/* Instituição */}
              {project.institution_name && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Instituição Certificadora
                  </h4>
                  <p className="font-medium text-gray-800">{project.institution_name}</p>
                  {project.institution_description && (
                    <p className="text-gray-600 text-sm mt-1">{project.institution_description}</p>
                  )}
                  {project.institution_url && (
                    <a
                      href={project.institution_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center mt-2"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Visitar site
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              {/* Blockchain */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-600" />
                  Informações Blockchain
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rede:</span>
                    <span className="font-medium text-gray-800">Polygon Mainnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Padrão:</span>
                    <span className="font-medium text-gray-800">ERC-1155</span>
                  </div>
                  {project.contract_address && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Contrato:</span>
                      <a
                        href={`https://polygonscan.com/address/${project.contract_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-purple-600 hover:underline flex items-center"
                      >
                        {project.contract_address.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                  {project.isin && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ISIN:</span>
                      <span className="font-mono text-gray-800">{project.isin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Vídeo */}
          {activeTab === 'video' && youtubeId && (
            <div>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Vídeo do projeto"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">
                Vídeo explicativo sobre o projeto e seus impactos
              </p>
            </div>
          )}

          {/* Tab: Documentos */}
          {activeTab === 'docs' && (
            <div>
              {project.document_url ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-800 mb-2">Documento do Projeto</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Acesse a documentação completa, certificações e laudos técnicos.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <a
                        href={project.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar
                      </a>
                      <a
                        href={project.document_url}
                        download
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum documento disponível</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com preço e botão comprar */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500">Preço por token</p>
            <p className="text-2xl font-bold text-emerald-700">
              R$ {project.price_brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={onBuy}
            disabled={project.status !== 'active'}
            className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-800 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            Comprar Tokens
          </button>
        </div>
      </div>
    </div>
  );
}
