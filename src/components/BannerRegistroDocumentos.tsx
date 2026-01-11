'use client';
import { useEffect, useState } from 'react';

export default function BannerRegistroDocumentos() {
  const [preco, setPreco] = useState<number>(0.90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreco = async () => {
      try {
        const res = await fetch('/api/documentos/registrar');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.price) {
            setPreco(data.price);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar preço:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreco();
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-6">
        {/* Lado Esquerdo */}
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🔒</span>
            <h2 className="text-3xl font-bold">Registro de Documentos</h2>
          </div>
          
          <p className="text-blue-100 text-lg mb-6 max-w-2xl">
            Comprove a autenticidade dos seus documentos com segurança jurídica 
            e validade permanente. Hash SHA-256 imutável com certificado digital instantâneo.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-green-300 text-xl">✓</span>
              <span className="text-sm">Certificado digital</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-300 text-xl">✓</span>
              <span className="text-sm">Validade permanente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-300 text-xl">✓</span>
              <span className="text-sm">Pagamento via PIX</span>
            </div>
          </div>
        </div>
        {/* Lado Direito: Card de Preço */}
        <div className="bg-white rounded-xl p-6 text-center shadow-2xl min-w-[220px]">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm font-medium mb-1">
                Preço promocional
              </p>
              <p className="text-5xl font-bold text-blue-600 mb-2">
                R$ {preco.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-gray-500 text-xs mb-4">
                por documento registrado
              </p>
            </>
          )}
          <a
            href="/registro-documentos/registrar"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            📄 Registrar Documento
          </a>
          <a
            href="/registro-documentos/verificar"
            className="block w-full mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            🔍 Verificar Documento
          </a>
        </div>
      </div>
    </div>
  );
}
