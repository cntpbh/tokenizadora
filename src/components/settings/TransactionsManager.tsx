'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Loader2, ExternalLink, Check, X, RefreshCw,
  CreditCard, Wallet, Clock, CheckCircle, XCircle, AlertCircle,
  DollarSign, TrendingUp, Eye, Mail, Edit2, Save, Zap
} from 'lucide-react';
import { 
  getAllTransactionsAdmin, getTransactionsSummary, updateTransactionStatus,
  createCertificate, generateCertificateCode, generateQRCodeData, updateProject,
  getSettings
} from '@/lib/supabase';

interface Transaction {
  id: string;
  type: string;
  buyer_email?: string;
  buyer_name?: string;
  buyer_cpf_cnpj?: string;
  user_id?: string;
  amount: number;
  price_total: number;
  payment_method?: string;
  payment_status?: string;
  payment_id?: string;
  tx_hash?: string;
  verified_manually?: boolean;
  notes?: string;
  certificate_code?: string;
  created_at?: string;
  project_id?: string;
  projects?: {
    id: string;
    name: string;
    token_id: number;
    image_url?: string;
    asset_type?: string;
    location?: string;
    available_supply?: number;
    total_credits?: number;
  };
}

interface Summary {
  total: number;
  totalValue: number;
  byType: { pix: number; crypto: number };
  byStatus: { pending: number; completed: number; failed: number };
  byCrypto: { MATIC: number; USDT: number; USDC: number };
}

export default function TransactionsManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Modal de edição
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    payment_status: '',
    tx_hash: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txData, summaryData] = await Promise.all([
        getAllTransactionsAdmin({
          type: filterType,
          status: filterStatus,
          search: search || undefined,
          limit: 100,
        }),
        getTransactionsSummary(),
      ]);
      setTransactions(txData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEdit = (tx: Transaction) => {
    setEditForm({
      payment_status: tx.payment_status || 'pending',
      tx_hash: tx.tx_hash || '',
      notes: tx.notes || '',
    });
    setEditingTx(tx);
  };

  const handleSave = async () => {
    if (!editingTx) return;
    
    setSaving(true);
    try {
      const isConfirming = editForm.payment_status === 'completed' && editingTx.payment_status !== 'completed';
      
      // Atualizar status da transação
      await updateTransactionStatus(editingTx.id, {
        payment_status: editForm.payment_status,
        tx_hash: editForm.tx_hash || undefined,
        notes: editForm.notes || undefined,
        verified_manually: editForm.payment_status === 'completed',
        verified_at: editForm.payment_status === 'completed' ? new Date().toISOString() : undefined,
      });
      
      // Se estiver confirmando e ainda não tem certificado, gerar
      if (isConfirming && !editingTx.certificate_code && editingTx.projects) {
        const certCode = generateCertificateCode();
        
        await createCertificate({
          transaction_id: editingTx.id,
          project_id: editingTx.project_id || editingTx.projects.id,
          user_id: editingTx.user_id || '',
          certificate_code: certCode,
          holder_name: editingTx.buyer_name || 'Cliente',
          holder_cpf_cnpj: editingTx.buyer_cpf_cnpj || '',
          holder_company: '',
          token_amount: editingTx.amount,
          token_type: editingTx.projects.asset_type || 'CARBON',
          project_name: editingTx.projects.name,
          project_location: editingTx.projects.location || '',
          tx_hash: editForm.tx_hash || editingTx.tx_hash || '',
          issue_date: new Date().toISOString(),
          qr_code_data: generateQRCodeData(certCode),
          status: 'active',
        });
        
        // Atualizar quantidade disponível do projeto
        if (editingTx.projects) {
          const currentAvailable = editingTx.projects.available_supply ?? editingTx.projects.total_credits ?? 0;
          const newAvailable = Math.max(0, currentAvailable - editingTx.amount);
          await updateProject(editingTx.projects.id, { available_supply: newAvailable });
        }
        
        console.log('✅ Certificado gerado:', certCode);
      }
      
      await loadData();
      setEditingTx(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao atualizar transação');
    }
    setSaving(false);
  };

  // Verificar pagamentos pendentes automaticamente
  const handleAutoVerify = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/crypto/auto-verify', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.verified > 0) {
        alert(`✅ ${data.verified} pagamento(s) verificado(s) automaticamente!`);
      } else {
        alert('Nenhum novo pagamento encontrado.');
      }
      
      await loadData();
    } catch (error) {
      console.error('Erro na verificação automática:', error);
      alert('Erro ao verificar pagamentos');
    }
    setRefreshing(false);
  };

  const getStatusBadge = (status?: string, verifiedManually?: boolean) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmada
            {verifiedManually && <span className="ml-1">(manual)</span>}
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status || 'Desconhecido'}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string, method?: string) => {
    if (type === 'pix') {
      return (
        <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          <CreditCard className="w-3 h-3 mr-1" />
          PIX
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
        <Wallet className="w-3 h-3 mr-1" />
        {method || 'Crypto'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Transações</h3>
          <p className="text-sm text-gray-500">
            Gerencie pagamentos PIX e Crypto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoVerify}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50"
            title="Verificar pagamentos pendentes automaticamente"
          >
            <Zap className="w-4 h-4" />
            Auto-verificar
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white">
            <DollarSign className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">
              R$ {summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-80">Total Recebido</p>
          </div>
          
          <div className="bg-white border rounded-xl p-4">
            <TrendingUp className="w-6 h-6 mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
            <p className="text-sm text-gray-500">Transações</p>
          </div>
          
          <div className="bg-white border rounded-xl p-4">
            <CheckCircle className="w-6 h-6 mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-800">{summary.byStatus.completed}</p>
            <p className="text-sm text-gray-500">Confirmadas</p>
          </div>
          
          <div className="bg-white border rounded-xl p-4">
            <Clock className="w-6 h-6 mb-2 text-yellow-600" />
            <p className="text-2xl font-bold text-gray-800">{summary.byStatus.pending}</p>
            <p className="text-sm text-gray-500">Pendentes</p>
          </div>
          
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-800">
              <span className="font-bold">{summary.byType.pix}</span> PIX • 
              <span className="font-bold ml-1">{summary.byType.crypto}</span> Crypto
            </p>
            <p className="text-xs text-gray-500 mt-1">
              MATIC: {summary.byCrypto.MATIC} | USDT: {summary.byCrypto.USDT} | USDC: {summary.byCrypto.USDC}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email ou hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="pix">PIX</option>
          <option value="crypto">Crypto</option>
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="completed">Confirmadas</option>
          <option value="failed">Falhas</option>
        </select>
      </div>

      {/* Modal de Edição */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Editar Transação</h3>
              <button onClick={() => setEditingTx(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Comprador</p>
                <p className="font-medium">{editingTx.buyer_email}</p>
                <p className="text-sm text-gray-600">
                  {editingTx.amount} tokens • R$ {editingTx.price_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.payment_status}
                  onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pending">⏳ Pendente</option>
                  <option value="completed">✅ Confirmada (verificado manualmente)</option>
                  <option value="failed">❌ Falhou</option>
                </select>
              </div>

              {editingTx.type === 'crypto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TX Hash</label>
                  <input
                    type="text"
                    value={editForm.tx_hash}
                    onChange={(e) => setEditForm({ ...editForm, tx_hash: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Adicione observações sobre esta transação..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {editForm.payment_status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✅ Ao confirmar, esta transação será marcada como <strong>verificada manualmente</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Transações */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white border rounded-xl p-4 hover:border-emerald-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {tx.projects?.image_url && (
                    <img 
                      src={tx.projects.image_url} 
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(tx.type, tx.payment_method)}
                      {getStatusBadge(tx.payment_status, tx.verified_manually)}
                    </div>
                    
                    <p className="font-medium text-gray-800">{tx.buyer_email}</p>
                    <p className="text-sm text-gray-500">
                      {tx.buyer_name} • {tx.amount} tokens
                    </p>
                    
                    {tx.projects && (
                      <p className="text-xs text-gray-400 mt-1">
                        Token #{tx.projects.token_id} - {tx.projects.name}
                      </p>
                    )}
                    
                    {tx.tx_hash && (
                      <a
                        href={`https://polygonscan.com/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:underline flex items-center mt-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {tx.tx_hash.substring(0, 20)}...
                      </a>
                    )}
                    
                    {tx.payment_id && tx.type === 'pix' && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        PIX ID: {tx.payment_id}
                      </p>
                    )}

                    {tx.notes && (
                      <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded">
                        📝 {tx.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    R$ {tx.price_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.created_at && new Date(tx.created_at).toLocaleString('pt-BR')}
                  </p>
                  <button
                    onClick={() => handleEdit(tx)}
                    className="mt-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center ml-auto"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
