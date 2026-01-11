'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PublicHeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export default function PublicHeader({ 
  showBackButton = true, 
  backUrl = '/',
  backLabel = 'Voltar ao Marketplace'
}: PublicHeaderProps) {
  return (
    <header className="bg-[#1a3f4d]/5 border-b border-[#1a3f4d]/10 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo IBEDIS */}
          <Link href="/" className="flex items-center">
            <img 
              src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
              alt="IBEDIS Token" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Botão Voltar */}
          {showBackButton && (
            <Link 
              href={backUrl}
              className="flex items-center text-[#1a3f4d] hover:text-[#b8963c] transition font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
