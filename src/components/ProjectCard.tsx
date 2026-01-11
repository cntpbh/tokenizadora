'use client';

import { MapPin, Hash, ExternalLink, Eye, ShoppingCart } from 'lucide-react';

interface ProjectCardProps {
  project: any;
  onBuy: () => void;
  onViewDetails?: () => void;
}

const TYPE_LABELS: { [key: string]: { emoji: string; label: string; color: string; gradient: string } } = {
  CARBON_REDD: { emoji: '🌳', label: 'REDD+', color: 'bg-green-100 text-green-700', gradient: 'from-green-700 to-green-500' },
  CARBON_FOREST: { emoji: '🌲', label: 'Florestal', color: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-700 to-emerald-500' },
  CARBON_BLUE: { emoji: '🌊', label: 'Carbono Azul', color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-700 to-blue-500' },
  CPR_VERDE: { emoji: '🌾', label: 'CPR Verde', color: 'bg-lime-100 text-lime-700', gradient: 'from-lime-700 to-lime-500' },
  CONTRACT_ESG: { emoji: '📋', label: 'Contrato ESG', color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-700 to-purple-500' },
  CONTRACT_VISIA: { emoji: '📊', label: 'VISIA', color: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-700 to-indigo-500' },
  CONTRACT_PVPE: { emoji: '🤝', label: 'PVPE', color: 'bg-pink-100 text-pink-700', gradient: 'from-pink-700 to-pink-500' },
  RENEWABLE_ENERGY: { emoji: '⚡', label: 'Energia', color: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-600 to-yellow-400' },
  WASTE_MANAGEMENT: { emoji: '♻️', label: 'Resíduos', color: 'bg-teal-100 text-teal-700', gradient: 'from-teal-700 to-teal-500' },
  WATER_CONSERVATION: { emoji: '💧', label: 'Água', color: 'bg-cyan-100 text-cyan-700', gradient: 'from-cyan-700 to-cyan-500' },
  BIODIVERSITY: { emoji: '🦋', label: 'Biodiversidade', color: 'bg-orange-100 text-orange-700', gradient: 'from-orange-600 to-orange-400' },
  SOCIAL_IMPACT: { emoji: '👥', label: 'Social', color: 'bg-rose-100 text-rose-700', gradient: 'from-rose-600 to-rose-400' },
  OTHER: { emoji: '📦', label: 'Outro', color: 'bg-gray-100 text-gray-700', gradient: 'from-gray-700 to-gray-500' },
};

export default function ProjectCard({ project, onBuy, onViewDetails }: ProjectCardProps) {
  const typeInfo = TYPE_LABELS[project.asset_type] || TYPE_LABELS.OTHER;
  const available = project.available_supply ?? project.available_credits ?? project.total_credits;
  const progress = project.total_credits > 0 
    ? ((project.total_credits - available) / project.total_credits) * 100 
    : 0;
  
  // Verifica se há tokens disponíveis
  const isAvailable = available > 0 && project.status === 'active';
  const isSoldOut = available <= 0;

  // Verificar se a imagem é válida
  const hasValidImage = project.image_url && 
    !project.image_url.includes('undefined') && 
    project.image_url.startsWith('http');

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
      {/* Imagem */}
      <div className="relative h-48 overflow-hidden">
        {hasValidImage ? (
          <img 
            src={project.image_url} 
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Se a imagem falhar, mostrar placeholder
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.classList.add('show-placeholder');
            }}
          />
        ) : null}
        
        {/* Placeholder quando não tem imagem ou imagem falha */}
        <div className={`absolute inset-0 bg-gradient-to-br ${typeInfo.gradient} flex flex-col items-center justify-center ${hasValidImage ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-7xl mb-2 opacity-80">{typeInfo.emoji}</span>
          <span className="text-white/70 text-sm font-medium">{typeInfo.label}</span>
        </div>
        
        {/* Badge de tipo */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color} shadow-md`}>
          {typeInfo.emoji} {typeInfo.label}
        </div>

        {/* Status */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-md ${
            isSoldOut 
              ? 'bg-red-500 text-white'
              : project.status === 'active' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-500 text-white'
          }`}>
            {isSoldOut ? '● Esgotado' : project.status === 'active' ? '● Disponível' : project.status}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">{project.name}</h3>
        
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
          {project.description || 'Projeto de ativo sustentável tokenizado na blockchain Polygon.'}
        </p>

        {/* Localização */}
        {project.location && (
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {/* Token ID ou ISIN */}
        <div className="flex items-center text-gray-400 text-xs mb-4">
          <Hash className="w-3 h-3 mr-1" />
          {project.isin || `Token #${project.token_id || '—'}`}
        </div>

        {/* Barra de progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Disponível</span>
            <span>{(project.available_supply ?? project.available_credits ?? project.total_credits).toLocaleString()} / {project.total_credits.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isSoldOut ? 'bg-red-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Preço */}
        <div className="mb-4">
          <p className="text-xs text-gray-500">Preço/Token</p>
          <p className="text-xl font-bold text-emerald-700">
            R$ {project.price_brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Detalhes
            </button>
          )}
          
          <button
            onClick={onBuy}
            disabled={!isAvailable}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              isAvailable 
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:from-emerald-800 hover:to-emerald-700 hover:shadow-lg cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {isAvailable ? 'Comprar' : 'Esgotado'}
          </button>
        </div>
      </div>
    </div>
  );
}
