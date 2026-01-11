'use client';

import { useState, useEffect } from 'react';
import { MapPin, ExternalLink, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://token.ibedis.com.br';

const TYPE_LABELS: { [key: string]: { emoji: string; label: string; color: string; gradient: string } } = {
  CARBON_REDD: { emoji: '🌳', label: 'REDD+', color: 'bg-green-500', gradient: 'from-green-600 to-green-400' },
  CARBON_FOREST: { emoji: '🌲', label: 'Florestal', color: 'bg-emerald-500', gradient: 'from-emerald-600 to-emerald-400' },
  CARBON_BLUE: { emoji: '🌊', label: 'Carbono Azul', color: 'bg-blue-500', gradient: 'from-blue-600 to-blue-400' },
  CPR_VERDE: { emoji: '🌾', label: 'CPR Verde', color: 'bg-lime-500', gradient: 'from-lime-600 to-lime-400' },
  CONTRACT_ESG: { emoji: '📋', label: 'ESG', color: 'bg-purple-500', gradient: 'from-purple-600 to-purple-400' },
  CONTRACT_VISIA: { emoji: '📊', label: 'VISIA', color: 'bg-indigo-500', gradient: 'from-indigo-600 to-indigo-400' },
  CONTRACT_PVPE: { emoji: '🤝', label: 'PVPE', color: 'bg-pink-500', gradient: 'from-pink-600 to-pink-400' },
  RENEWABLE_ENERGY: { emoji: '⚡', label: 'Energia', color: 'bg-yellow-500', gradient: 'from-yellow-500 to-yellow-400' },
  WASTE_MANAGEMENT: { emoji: '♻️', label: 'Resíduos', color: 'bg-teal-500', gradient: 'from-teal-600 to-teal-400' },
  WATER_CONSERVATION: { emoji: '💧', label: 'Água', color: 'bg-cyan-500', gradient: 'from-cyan-600 to-cyan-400' },
  BIODIVERSITY: { emoji: '🦋', label: 'Biodiversidade', color: 'bg-orange-500', gradient: 'from-orange-500 to-orange-400' },
  SOCIAL_IMPACT: { emoji: '👥', label: 'Social', color: 'bg-rose-500', gradient: 'from-rose-600 to-rose-400' },
  OTHER: { emoji: '📦', label: 'Outro', color: 'bg-gray-500', gradient: 'from-gray-600 to-gray-400' },
};

interface Project {
  id: string;
  token_id?: number;
  name: string;
  description?: string;
  asset_type: string;
  location?: string;
  total_credits: number;
  available_credits?: number;
  price_brl: number;
  image_url?: string;
  status?: string;
}

export default function WidgetPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // Buscar projetos ativos do Supabase (máximo 4)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setProjects([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-emerald-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-[200px] flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
        <div className="text-center">
          <span className="text-4xl mb-2 block">🌱</span>
          <p className="text-gray-500 text-sm">Nenhum token disponível</p>
          <a 
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline text-sm mt-2 inline-block"
          >
            Visitar plataforma →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white min-h-[200px] font-sans">
      {/* Header do Widget */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🌱</span>
          <span className="text-white font-bold text-sm">IBEDIS Token</span>
          <span className="text-emerald-200 text-xs hidden sm:inline">| Ativos Sustentáveis</span>
        </div>
        <a 
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-200 hover:text-white text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"
        >
          Ver todos <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Grid de Projetos - Responsivo */}
      <div className="p-4">
        <div className={`grid gap-3 ${
          projects.length === 1 ? 'grid-cols-1' :
          projects.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          projects.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {projects.map((project) => {
            const typeInfo = TYPE_LABELS[project.asset_type] || TYPE_LABELS.OTHER;
            const available = project.available_credits ?? project.total_credits;
            const isSoldOut = available <= 0;
            
            // Verificar se a imagem é válida
            const hasValidImage = project.image_url && 
              !project.image_url.includes('undefined') && 
              project.image_url.startsWith('http');

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
              >
                {/* Imagem */}
                <div className="relative h-28 sm:h-32 overflow-hidden">
                  {hasValidImage ? (
                    <img 
                      src={project.image_url} 
                      alt={project.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {/* Placeholder */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center ${hasValidImage ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-4xl opacity-60">{typeInfo.emoji}</span>
                  </div>
                  
                  {/* Badge de tipo */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-medium ${typeInfo.color} shadow`}>
                    {typeInfo.emoji} {typeInfo.label}
                  </div>

                  {/* Status */}
                  {isSoldOut && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium shadow">
                      Esgotado
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-3">
                  <h3 className="font-bold text-gray-800 text-sm mb-1 truncate" title={project.name}>
                    {project.name}
                  </h3>
                  
                  {project.location && (
                    <div className="flex items-center text-gray-400 text-xs mb-2">
                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Preço</p>
                      <p className="text-base font-bold text-emerald-600">
                        R$ {project.price_brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <a
                      href={`${APP_URL}?token=${project.token_id || project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        isSoldOut 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      onClick={(e) => isSoldOut && e.preventDefault()}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {isSoldOut ? 'Esgotado' : 'Comprar'}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 text-center border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400">
          Powered by{' '}
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
            IBEDIS Token
          </a>
          {' '}• Blockchain Polygon • ERC-1155
        </p>
      </div>
    </div>
  );
}
