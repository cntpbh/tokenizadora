'use client';

import { useState, useEffect } from 'react';

export default function AdminConfiguracoes() {
  const [preco, setPreco] = useState('5.00');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState('');

  // Carregar preço atual do banco
  useEffect(() => {
    fetch('/api/admin/configuracoes')
      .then(res => res.json())
      .then(data => {
        const config = data.configuracoes?.find(
          (c: any) => c.chave === 'preco_registro_documento'
        );
        if (config) {
          setPreco(config.valor);
        }
      })
      .catch(err => {
        console.error('Erro ao carregar configurações:', err);
        setMessage('❌ Erro ao carregar configurações');
      })
      .finally(() => setLoadingData(false));
  }, []);

  // Salvar novo preço
  const handleSalvar = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave: 'preco_registro_documento',
          valor: preco
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Preço atualizado com sucesso! Recarregue a home para ver a mudança.');
      } else {
        setMessage(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Erro ao salvar configuração');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ⚙️ Configurações do Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie preços e configurações da plataforma
          </p>
        </div>

        {/* Card de Configurações */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {/* Preço */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Preço do Registro de Documento (R$)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Este valor será exibido no banner da home e no formulário de registro
              </p>
              <input
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                placeholder="5.00"
              />
              <p className="text-xs text-gray-500 mt-2">
                Formato: Use ponto como separador decimal (ex: 5.00, 29.90)
              </p>
            </div>

            {/* Botão Salvar */}
            <button
              onClick={handleSalvar}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
            >
              {loading ? '⏳ Salvando...' : '💾 Salvar Configurações'}
            </button>

            {/* Mensagem de Feedback */}
            {message && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  message.includes('✅')
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Card de Informações */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>💡</span> Informações Importantes
          </h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>O preço será atualizado <strong>imediatamente</strong> após salvar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Recarregue a página inicial para visualizar as mudanças</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>O valor é exibido em Reais (BRL) no PIX do MercadoPago</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Use valores promocionais para atrair mais registros</span>
            </li>
          </ul>
        </div>

        {/* Botão Voltar */}
        <div className="mt-6">
          <a
            href="/"
            className="inline-block text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Voltar para Home
          </a>
        </div>
      </div>
    </div>
  );
}
