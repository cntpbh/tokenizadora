'use client';

import { Mail, Globe, ExternalLink, Shield, Award } from 'lucide-react';
import Link from 'next/link';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const LOGO_URL = '/logo-ibedis.png';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 text-[#1a3f4d] py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={LOGO_URL}
                alt="IBEDIS Token" 
                className="h-12 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />

            </div>
            <p className="text-[#1a3f4d]/70 text-sm leading-relaxed">
              Plataforma de tokenizacao de ativos sustentaveis desenvolvida pelo IBEDIS - 
              Instituto Brasileiro de Educacao e Desenvolvimento em Inovacao Sustentavel.
              Credenciado MCTI/FINEP.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-[#1a3f4d]">Links</h4>
            <ul className="space-y-2 text-[#1a3f4d]/70 text-sm">
              <li>
                <a href="https://ibedis.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#b8963c] flex items-center transition">
                  <Globe className="w-4 h-4 mr-2" />
                  ibedis.org
                </a>
              </li>
              <li>
                <a href="mailto:contato@ibedis.org" className="hover:text-[#b8963c] flex items-center transition">
                  <Mail className="w-4 h-4 mr-2" />
                  contato@ibedis.org
                </a>
              </li>
              <li>
                <Link href="/certificado-exemplo" className="hover:text-[#b8963c] flex items-center transition">
                  <Award className="w-4 h-4 mr-2" />
                  Ver Certificado Exemplo
                </Link>
              </li>
              {CONTRACT_ADDRESS && (
                <li>
                  <a 
                    href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[#b8963c] flex items-center transition"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Verificar Contrato
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-[#1a3f4d]">Seguranca</h4>
            <ul className="space-y-2 text-[#1a3f4d]/70 text-sm">
              <li className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-[#b8963c]" />
                Smart Contract Auditado
              </li>
              <li className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-[#b8963c]" />
                Polygon Mainnet
              </li>
              <li className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-[#b8963c]" />
                ERC-1155 Standard
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#1a3f4d]/60 text-sm">
              {new Date().getFullYear()} IBEDIS. Todos os direitos reservados.
            </p>
            <p className="text-[#b8963c] text-xs mt-2 md:mt-0">
              Metodologia VISIA - ISBN 978-65-01-58740-0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
