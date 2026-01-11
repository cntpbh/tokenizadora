'use client';

import { Leaf, Briefcase, TrendingUp, Users } from 'lucide-react';

interface StatsBarProps {
  stats: {
    totalCredits: string;
    projects: number;
    volume: string;
    companies: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  const statsData = [
    {
      label: 'Créditos Tokenizados',
      value: stats.totalCredits || '0',
      icon: Leaf,
      color: 'emerald',
    },
    {
      label: 'Projetos Ativos',
      value: stats.projects.toString() || '0',
      icon: Briefcase,
      color: 'blue',
    },
    {
      label: 'Volume Total',
      value: stats.volume || 'R$ 0',
      icon: TrendingUp,
      color: 'amber',
    },
    {
      label: 'Empresas Cadastradas',
      value: stats.companies.toString() || '0',
      icon: Users,
      color: 'purple',
    },
  ];

  const colorMap: { [key: string]: string } = {
    emerald: 'bg-emerald-700/10 text-emerald-700',
    blue: 'bg-blue-600/10 text-blue-600',
    amber: 'bg-amber-600/10 text-amber-600',
    purple: 'bg-purple-600/10 text-purple-600',
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${colorMap[stat.color]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
