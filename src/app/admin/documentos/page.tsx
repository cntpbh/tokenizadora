'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Registro {
  id: string;
  document_hash: string;
  title: string;
  user_email: string;
  user_name: string;
  certificate_code: string;
  payment_status: string;
  payment_amount: number;
  status: string;
  created_at: string;
  ipfs_document_hash: string | null;
}

export default function AdminDocumentos() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'all' | 'pending' | 'completed'>('all');
  const [preco, setPreco] = useState('0.90');
  const [salvandoPreco, setSalvandoPreco] = useState(false);

  useEffect(() => {
    carregarRegistros();
    carregarPreco();
  }, [filtro]);

  const carregarRegistros = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('document_registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filtro !== 'all') {
        query = query.eq('status', filtro);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarPreco = async () => {
    try {
      const { data } = await supabase
        .from('document_registry_config')
        .select('config_value')
        .eq('config_key', 'price_pix')
        .single();

      if (data?.config_value?.price) {
        setPreco(data.config_value.price.toString());
      }
    } catch (error) {
      console.error('Erro ao carregar preço:', error);
    }
  };

  const salvarPreco = async () => {
    setSalvandoPreco(true);
    try {
      const { error } = await supabase
        .from('document_registry_config')
        .upsert({
          config_key: 'price_pix',
          config_value: { price: parseFloat(preco), currency: 'BRL' },
          is_active: true
        });

      if (error) throw error;
      alert('✅ Preço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      alert('❌ Erro ao salvar preço');
    } finally {
      setSalvandoPreco(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin - Documentos Registrados</h1>

        {/* Card de Configuração de Preço */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">💰 Configurar Preço</h2>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço do Registro (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="px-4 py-2 border rounded-lg w-32"
              />
            </div>
            <button
              onClick={salvarPreco}
              disabled={salvandoPreco}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {salvandoPreco ? 'Salvando...' : 'Salvar Preço'}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFiltro('all')}
              className={`px-4 py-2 rounded-lg ${
                filtro === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({registros.length})
            </button>
            <button
              onClick={() => setFiltro('pending')}
              className={`px-4 py-2 rounded-lg ${
                filtro === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFiltro('completed')}
              className={`px-4 py-2 rounded-lg ${
                filtro === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Concluídos
            </button>
            <button
              onClick={carregarRegistros}
              className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Tabela de Registros */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum registro encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IPFS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                        {reg.certificate_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {reg.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{reg.user_name}</div>
                        <div className="text-xs text-gray-500">{reg.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {reg.payment_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            reg.payment_status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {reg.payment_status === 'completed' ? '✓ Pago' : '⏳ Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {reg.ipfs_document_hash ? (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${reg.ipfs_document_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ver IPFS
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
