'use client';

import { useState } from 'react';
import { Download, Edit, CheckCircle, Award } from 'lucide-react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';

// Certificado simulado para demonstração
const exampleCertificate = {
  certificate_code: 'IBEDIS-M8K7X2-ABC123',
  holder_name: 'João Silva',
  holder_cpf_cnpj: '123.456.789-00',
  holder_company: 'Empresa Sustentável Ltda',
  token_amount: 100,
  token_type: 'SOCIAL_IMPACT',
  project_name: 'IBEDIS Mentor PVPEToken',
  project_location: 'São Paulo, Brasil',
  tx_hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
  issue_date: new Date().toISOString(),
  status: 'active',
};

const TYPE_LABELS: { [key: string]: { emoji: string; label: string } } = {
  CARBON_REDD: { emoji: '🌳', label: 'Crédito de Carbono REDD+' },
  CARBON_FOREST: { emoji: '🌲', label: 'Crédito Florestal' },
  CARBON_BLUE: { emoji: '🌊', label: 'Carbono Azul' },
  CPR_VERDE: { emoji: '🌾', label: 'CPR Verde' },
  CONTRACT_ESG: { emoji: '📋', label: 'Contrato ESG' },
  CONTRACT_VISIA: { emoji: '📊', label: 'Certificado VISIA' },
  CONTRACT_PVPE: { emoji: '🤝', label: 'Contrato PVPE' },
  RENEWABLE_ENERGY: { emoji: '⚡', label: 'Energia Renovável' },
  WASTE_MANAGEMENT: { emoji: '♻️', label: 'Gestão de Resíduos' },
  WATER_CONSERVATION: { emoji: '💧', label: 'Conservação de Água' },
  BIODIVERSITY: { emoji: '🦋', label: 'Biodiversidade' },
  SOCIAL_IMPACT: { emoji: '👥', label: 'Impacto Social' },
  OTHER: { emoji: '📦', label: 'Ativo Tokenizado' },
};

export default function CertificadoExemploPage() {
  const [certificate, setCertificate] = useState(exampleCertificate);
  const [editing, setEditing] = useState(false);

  const typeInfo = TYPE_LABELS[certificate.token_type] || TYPE_LABELS.OTHER;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header (não aparece na impressão) */}
      <div className="print:hidden">
        <PublicHeader />
      </div>

      {/* Barra de ações (não aparece na impressão) */}
      <div className="bg-white border-b border-gray-200 py-4 print:hidden">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1a3f4d]">Simulação de Certificado</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-[#1a3f4d]/10 text-[#1a3f4d] rounded-lg flex items-center gap-2 hover:bg-[#1a3f4d]/20 transition"
            >
              <Edit className="w-4 h-4" />
              {editing ? 'Fechar Editor' : 'Editar'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#1a3f4d] text-white rounded-lg font-medium flex items-center gap-2 hover:bg-[#1a3f4d]/90 transition"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Editor (não aparece na impressão) */}
      {editing && (
        <div className="bg-white border-b shadow-sm py-6 print:hidden">
          <div className="container mx-auto px-4">
            <h2 className="font-bold text-[#1a3f4d] mb-4">✏️ Editar dados do certificado de exemplo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome do Titular</label>
                <input
                  type="text"
                  value={certificate.holder_name}
                  onChange={(e) => setCertificate({ ...certificate, holder_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b8963c] focus:border-[#b8963c]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">CPF/CNPJ</label>
                <input
                  type="text"
                  value={certificate.holder_cpf_cnpj}
                  onChange={(e) => setCertificate({ ...certificate, holder_cpf_cnpj: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b8963c] focus:border-[#b8963c]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Empresa</label>
                <input
                  type="text"
                  value={certificate.holder_company || ''}
                  onChange={(e) => setCertificate({ ...certificate, holder_company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b8963c] focus:border-[#b8963c]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={certificate.project_name}
                  onChange={(e) => setCertificate({ ...certificate, project_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b8963c] focus:border-[#b8963c]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantidade de Tokens</label>
                <input
                  type="number"
                  value={certificate.token_amount}
                  onChange={(e) => setCertificate({ ...certificate, token_amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b8963c] focus:border-[#b8963c]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo de Token</label>
                <select
                  value={certificate.token_type}
                  onChange={(e) => setCertificate({ ...certificate, token_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b8963c] focus:border-[#b8963c]"
                >
                  {Object.entries(TYPE_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.emoji} {value.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificado */}
      <div className="container mx-auto px-4 py-8 print:p-0">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Borda decorativa superior */}
          <div className="h-3 bg-gradient-to-r from-[#1a3f4d] via-[#b8963c] to-[#1a3f4d]" />
          
          {/* Header do certificado */}
          <div className="bg-gradient-to-br from-[#1a3f4d] to-[#2a5f6d] text-white p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
                alt="IBEDIS" 
                className="h-16 brightness-0 invert"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">CERTIFICADO DE AQUISIÇÃO</h1>
            <p className="text-gray-200 text-lg">Ativos Sustentáveis Tokenizados</p>
          </div>

          {/* Código do certificado */}
          <div className="bg-[#1a3f4d]/5 py-4 px-8 border-b border-[#1a3f4d]/10">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#1a3f4d]" />
              <div className="text-center">
                <p className="text-sm text-gray-500">Código do Certificado</p>
                <p className="text-2xl font-bold text-[#1a3f4d] font-mono tracking-wider">
                  {certificate.certificate_code}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="p-8">
            {/* Declaração */}
            <div className="text-center mb-8">
              <p className="text-gray-600 leading-relaxed text-lg">
                Certificamos que <strong className="text-[#1a3f4d]">{certificate.holder_name}</strong>,
                {certificate.holder_company && (
                  <span> representando <strong className="text-[#1a3f4d]">{certificate.holder_company}</strong>,</span>
                )}
                {certificate.holder_cpf_cnpj && (
                  <span> inscrito(a) sob o documento <strong className="text-[#1a3f4d]">{certificate.holder_cpf_cnpj}</strong>,</span>
                )}
                {' '}é titular legítimo(a) de:
              </p>
            </div>

            {/* Destaque dos tokens */}
            <div className="bg-gradient-to-r from-[#1a3f4d]/5 to-[#b8963c]/10 rounded-2xl p-8 text-center mb-8 border-2 border-[#1a3f4d]/20">
              <div className="text-6xl mb-4">{typeInfo.emoji}</div>
              <p className="text-5xl font-bold text-[#1a3f4d] mb-2">
                {certificate.token_amount?.toLocaleString()}
              </p>
              <p className="text-xl text-[#b8963c] font-medium">
                {typeInfo.label}
              </p>
            </div>

            {/* Informações do projeto */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-[#1a3f4d] mb-4 text-center text-lg">Informações do Projeto</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-gray-500 mb-1">Projeto</p>
                  <p className="font-bold text-[#1a3f4d]">{certificate.project_name}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-gray-500 mb-1">Localização</p>
                  <p className="font-bold text-[#1a3f4d]">{certificate.project_location}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-gray-500 mb-1">Data de Emissão</p>
                  <p className="font-bold text-[#1a3f4d]">
                    {new Date(certificate.issue_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-gray-500 mb-1">Status</p>
                  <p className="font-bold text-[#1a3f4d]">✅ Ativo</p>
                </div>
              </div>
            </div>

            {/* Blockchain */}
            <div className="bg-[#b8963c]/10 rounded-xl p-6 mb-8 border border-[#b8963c]/20">
              <h3 className="font-bold text-[#1a3f4d] mb-4 text-center text-lg">🔗 Registro Blockchain</h3>
              <div className="text-center text-sm">
                <p className="text-gray-500 mb-2">Hash da Transação (Polygon)</p>
                <p className="font-mono text-xs text-[#1a3f4d] break-all bg-white p-3 rounded-lg border border-[#b8963c]/20">
                  {certificate.tx_hash}
                </p>
                <a
                  href={`https://polygonscan.com/tx/${certificate.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-[#b8963c] hover:underline text-sm font-medium"
                >
                  Verificar no Polygonscan ↗
                </a>
              </div>
            </div>

            {/* QR Code placeholder */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-gray-400 text-xs">QR Code</span>
                </div>
                <p className="text-xs text-gray-500">Escaneie para verificar</p>
              </div>
            </div>

            {/* Assinatura */}
            <div className="border-t border-gray-200 pt-8 text-center">
              <div className="inline-block">
                <div className="w-48 border-b-2 border-[#1a3f4d] mb-2 h-12 flex items-end justify-center">
                  <span className="text-gray-400 italic text-sm pb-1">[Assinatura Digital]</span>
                </div>
                <p className="font-bold text-[#1a3f4d]">IBEDIS Token</p>
                <p className="text-sm text-gray-500">Plataforma de Tokenização de Ativos Sustentáveis</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-200">
            <p>Este certificado comprova a titularidade de ativos digitais registrados na blockchain Polygon.</p>
            <p>Para verificar a autenticidade, acesse: token.ibedis.com.br/verificar</p>
          </div>

          {/* Borda decorativa inferior */}
          <div className="h-3 bg-gradient-to-r from-[#1a3f4d] via-[#b8963c] to-[#1a3f4d]" />
        </div>
      </div>

      {/* Instruções (não aparece na impressão) */}
      <div className="container mx-auto px-4 pb-12 print:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#b8963c]/10 border border-[#b8963c]/30 rounded-xl p-6 text-[#1a3f4d]">
            <h3 className="font-bold mb-2">💡 Como usar este exemplo:</h3>
            <ul className="text-sm space-y-1 text-[#1a3f4d]/80">
              <li>• Clique em <strong>"Editar"</strong> para personalizar os dados do certificado</li>
              <li>• Clique em <strong>"Baixar PDF"</strong> para salvar o certificado (use Ctrl+P ou Cmd+P)</li>
              <li>• Na janela de impressão, selecione <strong>"Salvar como PDF"</strong></li>
              <li>• Este é um modelo de exemplo - certificados reais são gerados automaticamente após a compra</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
