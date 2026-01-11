'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Shield, FileText, Calendar, Download, ExternalLink, 
  Loader2, CheckCircle, Building2, Hash, Link2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DocumentData {
  id: string;
  title: string;
  description?: string;
  category: string;
  document_number?: string;
  publish_date?: string;
  tx_hash?: string;
  ipfs_hash?: string;
  document_url?: string;
  project?: {
    name: string;
    token_id: number;
  };
}

function CertificadoContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');
  
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (docId) {
      loadDocument(docId);
    } else {
      setError('ID do documento não fornecido');
      setLoading(false);
    }
  }, [docId]);

  const loadDocument = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(name, token_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Documento não encontrado');
      
      setDocument(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar documento');
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Documento não encontrado</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // URL para o Polygonscan (blockchain)
  const polygonscanUrl = document.tx_hash 
    ? `https://polygonscan.com/tx/${document.tx_hash}`
    : null;

  const CATEGORY_LABELS: { [key: string]: string } = {
    EDITAL: 'Edital',
    CONTRATO: 'Contrato',
    RELATORIO: 'Relatório',
    ATA: 'Ata',
    ACORDO: 'Acordo de Cooperação',
    ESTATUTO: 'Estatuto/Governança',
    CERTIFICADO: 'Credenciamento',
    REGULAMENTO: 'Regulamento',
    PROPOSTA: 'Proposta',
    OUTRO: 'Documento',
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      {/* Print Button */}
      <div className="max-w-4xl mx-auto px-4 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar PDF / Imprimir
        </button>
      </div>

      {/* Certificado */}
      <div className="max-w-4xl mx-auto px-4 print:px-0">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-purple-900 text-white p-8 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" 
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                }} 
              />
            </div>
            
            <div className="relative">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold tracking-wide mb-2">
                CERTIFICADO DE REGISTRO
              </h1>
              <p className="text-purple-200">
                Documento registrado em blockchain
              </p>
            </div>
          </div>

          {/* Corpo do certificado */}
          <div className="p-8">
            {/* Status de verificação */}
            {document.tx_hash && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Documento Verificado na Blockchain</p>
                  <p className="text-sm text-green-600">
                    Este documento foi registrado de forma imutável na rede Polygon
                  </p>
                </div>
              </div>
            )}

            {/* Informações do documento */}
            <div className="border-2 border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Informações do Documento
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">Título</p>
                  <p className="text-lg font-semibold text-gray-800">{document.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Tipo</p>
                    <p className="font-medium text-gray-800">
                      {CATEGORY_LABELS[document.category] || document.category}
                    </p>
                  </div>

                  {document.document_number && (
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Número</p>
                      <p className="font-medium text-gray-800">{document.document_number}</p>
                    </div>
                  )}
                </div>

                {document.description && (
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Descrição</p>
                    <p className="text-gray-700">{document.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {document.publish_date && (
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Data de Publicação</p>
                      <p className="font-medium text-gray-800 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(document.publish_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {document.project && (
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Projeto Vinculado</p>
                      <p className="font-medium text-gray-800 flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        Token #{document.project.token_id} - {document.project.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações da Blockchain */}
            {document.tx_hash && (
              <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Registro na Blockchain
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-purple-600 uppercase tracking-wider">Hash da Transação</p>
                    <p className="font-mono text-sm text-purple-900 break-all bg-white p-2 rounded border">
                      {document.tx_hash}
                    </p>
                  </div>

                  {document.ipfs_hash && (
                    <div>
                      <p className="text-sm text-purple-600 uppercase tracking-wider">Hash do Documento (SHA256)</p>
                      <p className="font-mono text-xs text-purple-900 break-all bg-white p-2 rounded border">
                        {document.ipfs_hash}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-purple-600 uppercase tracking-wider">Rede</p>
                    <p className="font-medium text-purple-900">Polygon Mainnet</p>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code e Verificação */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 pt-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 mb-2">
                  Escaneie o QR Code para verificar este documento na blockchain:
                </p>
                {polygonscanUrl && (
                  <a
                    href={polygonscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline text-sm flex items-center justify-center md:justify-start print:hidden"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver no Polygonscan
                  </a>
                )}
              </div>

              {/* QR Code aponta para Polygonscan */}
              {polygonscanUrl && (
                <div className="bg-white p-4 rounded-xl border-2 border-purple-200 shadow-lg">
                  <QRCodeSVG
                    value={polygonscanUrl}
                    size={150}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "/polygon-logo.png",
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Verificar na Polygon
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🌱</span>
                <div>
                  <p className="font-bold text-gray-800">IBEDIS</p>
                  <p className="text-xs text-gray-500">
                    Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável
                  </p>
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <p className="text-xs text-gray-500">
                  Certificado gerado em {new Date().toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-400">
                  token.ibedis.com.br
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CertificadoDocumentoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    }>
      <CertificadoContent />
    </Suspense>
  );
}
