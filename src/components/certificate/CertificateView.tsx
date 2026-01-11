'use client';

import { useState, useEffect } from 'react';
import { Download, ExternalLink, Copy, CheckCircle, QrCode, X } from 'lucide-react';
import { getSettings, PlatformSettings, Certificate } from '@/lib/supabase';

interface CertificateViewProps {
  certificate: Certificate;
  onClose?: () => void;
}

export default function CertificateView({ certificate, onClose }: CertificateViewProps) {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(certificate.certificate_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCpfCnpj = (value: string) => {
    if (!value) return '***';
    if (value.length <= 11) {
      return `***.***.${value.slice(6, 9)}-**`;
    } else {
      return `**.***.***/****-${value.slice(-2)}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // QR Code aponta para Polygonscan se tiver tx_hash, senão para verificação
  const polygonscanUrl = certificate.tx_hash && certificate.tx_hash.startsWith('0x') 
    ? `https://polygonscan.com/tx/${certificate.tx_hash}`
    : `https://token.ibedis.com.br/?verificar=${certificate.certificate_code}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(polygonscanUrl)}`;

  // Nome do arquivo PDF
  const fileName = `Certificado do Token ${certificate.project_name || 'IBEDIS'}`;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = fileName;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  return (
    <>
      {/* CSS de impressão - Certificado ocupa 90% da página A4 */}
      <style jsx global>{`
        @media print {
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .certificate-print, .certificate-print * {
            visibility: visible;
          }
          .certificate-print {
            position: fixed !important;
            left: 2.5% !important;
            top: 2.5% !important;
            width: 95% !important;
            height: 95% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .cert-header-print {
            padding: 28px 36px !important;
          }
          .cert-header-print h1 {
            font-size: 36px !important;
          }
          .cert-header-print .subtitle {
            font-size: 18px !important;
          }
          .cert-header-print .date {
            font-size: 20px !important;
          }
          .cert-code-print {
            padding: 24px !important;
          }
          .cert-code-print .label {
            font-size: 16px !important;
          }
          .cert-code-print .code {
            font-size: 36px !important;
          }
          .cert-body-print {
            flex: 1 !important;
            padding: 36px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .cert-title-print {
            font-size: 28px !important;
            margin-bottom: 12px !important;
          }
          .cert-subtitle-print {
            font-size: 16px !important;
          }
          .cert-section-title {
            font-size: 18px !important;
          }
          .cert-label {
            font-size: 16px !important;
          }
          .cert-value {
            font-size: 22px !important;
          }
          .cert-value-lg {
            font-size: 28px !important;
          }
          .cert-blockchain {
            padding: 24px !important;
          }
          .cert-blockchain-title {
            font-size: 16px !important;
          }
          .cert-blockchain-text {
            font-size: 18px !important;
          }
          .cert-qr img {
            width: 160px !important;
            height: 160px !important;
          }
          .cert-qr-text {
            font-size: 16px !important;
          }
          .cert-signer-name {
            font-size: 24px !important;
          }
          .cert-signer-title {
            font-size: 16px !important;
          }
          .cert-footer-print {
            font-size: 14px !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div className="certificate-print bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl mx-auto">
        {/* Header */}
        <div className="cert-header-print bg-gradient-to-r from-emerald-700 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-4xl">🌱</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{settings?.platform_name || 'IBEDIS Token'}</h1>
                <p className="subtitle text-emerald-200 text-sm">Certificado de Aquisição</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-200 text-sm">Emitido em</p>
              <p className="date font-bold text-lg">{formatDate(certificate.issue_date)}</p>
            </div>
          </div>
        </div>

        {/* Código do Certificado */}
        <div className="cert-code-print bg-emerald-50 border-b-2 border-emerald-500 p-4">
          <div className="text-center">
            <p className="label text-sm text-gray-500 mb-2">NÚMERO DO CERTIFICADO</p>
            <div className="flex items-center justify-center gap-3">
              <p className="code text-2xl font-mono font-bold text-emerald-800 tracking-wider">
                {certificate.certificate_code}
              </p>
              <button
                onClick={copyCode}
                className="no-print p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                title="Copiar código"
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="cert-body-print p-6 space-y-6">
          
          {/* Título */}
          <div className="text-center border-b pb-4">
            <h2 className="cert-title-print text-xl font-bold text-gray-800">CERTIFICADO DE AQUISIÇÃO DE ATIVOS SUSTENTÁVEIS</h2>
            <p className="cert-subtitle-print text-gray-500 text-sm mt-1">Registro em Blockchain - Token ERC-1155</p>
          </div>

          {/* Grid de Informações */}
          <div className="grid grid-cols-2 gap-8">
            {/* Dados do Titular */}
            <div className="space-y-4">
              <h3 className="cert-section-title font-bold text-gray-700 text-sm border-b pb-2 flex items-center gap-2">
                <span>📋</span> Dados do Titular
              </h3>
              <div>
                <span className="cert-label text-sm text-gray-500">Nome</span>
                <p className="cert-value font-semibold text-gray-800 text-lg">{certificate.holder_name}</p>
              </div>
              <div>
                <span className="cert-label text-sm text-gray-500">CPF/CNPJ</span>
                <p className="cert-value font-semibold text-gray-800 text-lg">{formatCpfCnpj(certificate.holder_cpf_cnpj)}</p>
              </div>
            </div>

            {/* Dados do Ativo */}
            <div className="space-y-4">
              <h3 className="cert-section-title font-bold text-gray-700 text-sm border-b pb-2 flex items-center gap-2">
                <span>🌳</span> Dados do Ativo
              </h3>
              <div>
                <span className="cert-label text-sm text-gray-500">Quantidade</span>
                <p className="cert-value-lg font-bold text-gray-800 text-xl">{certificate.token_amount.toLocaleString()} tokens</p>
              </div>
              <div>
                <span className="cert-label text-sm text-gray-500">Projeto</span>
                <p className="cert-value font-semibold text-gray-800 text-lg">{certificate.project_name}</p>
              </div>
              {certificate.project_location && (
                <div>
                  <span className="cert-label text-sm text-gray-500">Local</span>
                  <p className="cert-value font-semibold text-gray-800 text-lg">{certificate.project_location}</p>
                </div>
              )}
            </div>
          </div>

          {/* Blockchain */}
          <div className="cert-blockchain bg-gray-800 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="cert-blockchain-title text-sm text-gray-400 flex items-center gap-2">
                <span>🔗</span> Registro na Blockchain
              </span>
              <span className="text-emerald-400 text-sm font-medium">✓ Verificado</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="cert-blockchain-text text-gray-400">Rede:</span>
                <span className="cert-blockchain-text text-purple-300 ml-2 font-medium">Polygon</span>
              </div>
              <div>
                <span className="cert-blockchain-text text-gray-400">Padrão:</span>
                <span className="cert-blockchain-text text-purple-300 ml-2 font-medium">ERC-1155</span>
              </div>
            </div>
            {certificate.tx_hash && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Hash: </span>
                <span className="font-mono text-sm text-blue-300 break-all">{certificate.tx_hash}</span>
              </div>
            )}
          </div>

          {/* QR Code e Verificação */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-5">
            <div className="cert-qr flex items-center gap-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28 rounded-lg" />
              <div>
                <p className="cert-qr-text text-sm text-gray-600 font-medium">Escaneie para verificar</p>
                <p className="cert-qr-text text-sm text-gray-500">na blockchain Polygon</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Verificar em:</p>
              <p className="text-lg text-purple-700 font-bold">polygonscan.com</p>
            </div>
          </div>

          {/* Assinatura */}
          <div className="text-center border-t pt-5">
            <div className="inline-block">
              <div className="border-b-2 border-gray-400 w-64 mb-2"></div>
              <p className="cert-signer-name font-bold text-gray-800 text-lg">{settings?.certificate_signer_name || 'Wemerson Marinho'}</p>
              <p className="cert-signer-title text-sm text-gray-500">{settings?.certificate_signer_title || 'Presidente do Conselho de Administração'}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="cert-footer-print text-center text-xs text-gray-400 border-t pt-4">
            <p>Metodologia VISIA - ISBN 978-65-01-58740-0 • MCTI/FINEP</p>
          </div>

          {/* Botões (não imprimem) */}
          <div className="no-print flex gap-3 pt-4">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Baixar PDF
            </button>
            {certificate.tx_hash && certificate.tx_hash.startsWith('0x') && (
              <a
                href={`https://polygonscan.com/tx/${certificate.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-purple-500 text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Ver na Blockchain
              </a>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Card compacto para listagem
export function CertificateCard({ certificate, onClick }: { certificate: Certificate; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition cursor-pointer border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">🏆</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          certificate.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {certificate.status === 'active' ? 'Ativo' : certificate.status}
        </span>
      </div>
      
      <h3 className="font-bold text-gray-800 truncate">{certificate.project_name}</h3>
      <p className="text-sm text-gray-500">{certificate.token_amount.toLocaleString()} tokens</p>
      
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Código</p>
            <p className="font-mono text-sm font-bold text-emerald-700">{certificate.certificate_code}</p>
          </div>
          <QrCode className="w-8 h-8 text-gray-300" />
        </div>
      </div>
    </div>
  );
}
