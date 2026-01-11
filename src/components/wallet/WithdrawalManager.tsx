'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, CheckCircle, XCircle, Clock, ExternalLink, Loader2, 
  AlertCircle, RefreshCw, Copy, Search, DollarSign, Send,
  ChevronDown, ChevronUp, User, Calendar
} from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  wallet_address: string;
  network: string;
  status: string;
  tx_hash: string | null;
  paid_at: string | null;
  paid_by: string | null;
  rejection_reason: string | null;
  user_notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface Stats {
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
  totalPendingAmount: number;
}

export default function WithdrawalManager() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Modal de ação
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'pay' | 'reject' | null;
    withdrawal: WithdrawalRequest | null;
  }>({ type: null, withdrawal: null });
  const [txHash, setTxHash] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals?status=${filter}`);
      const data = await response.json();
      
      if (data.success) {
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
    }
    setLoading(false);
  };

  const handleAction = async (action: string) => {
    if (!actionModal.withdrawal) return;
    
    setProcessing(true);
    
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          withdrawal_id: actionModal.withdrawal.id,
          admin_email: 'admin', // TODO: pegar do usuário logado
          tx_hash: txHash,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setActionModal({ type: null, withdrawal: null });
        setTxHash('');
        setRejectionReason('');
        setAdminNotes('');
        loadWithdrawals();
      } else {
        alert(data.error || 'Erro ao processar');
      }
    } catch (err) {
      alert('Erro ao processar');
    }
    
    setProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">⏳ Pendente</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">✓ Aprovado</span>;
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">💰 Pago</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">✕ Rejeitado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{status}</span>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.user_email.toLowerCase().includes(s) ||
      w.user_name?.toLowerCase().includes(s) ||
      w.wallet_address.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="font-bold text-gray-800">Gerenciar Saques</h3>
            <p className="text-sm text-gray-500">Aprovar e processar solicitações de saque</p>
          </div>
        </div>
        <button
          onClick={loadWithdrawals}
          disabled={loading}
          className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-yellow-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-yellow-700">Pendentes</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
            <p className="text-xs text-blue-700">Aprovados</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-xs text-green-700">Pagos</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-red-700">Rejeitados</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-emerald-600">${stats.totalPendingAmount.toFixed(2)}</p>
            <p className="text-xs text-emerald-700">A Pagar</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2">
          {['pending', 'approved', 'paid', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : 
               f === 'pending' ? 'Pendentes' :
               f === 'approved' ? 'Aprovados' :
               f === 'paid' ? 'Pagos' : 'Rejeitados'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email, nome ou carteira..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Lista de Saques */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Wallet className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWithdrawals.map((w) => (
            <div key={w.id} className="bg-gray-50 rounded-xl overflow-hidden">
              {/* Header do Card */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        ${parseFloat(w.amount as any).toFixed(2)} {w.currency}
                      </p>
                      <p className="text-sm text-gray-500">{w.user_name || w.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(w.status)}
                    {expandedId === w.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Detalhes Expandidos */}
              {expandedId === w.id && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {/* Info do Usuário */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <strong>Email:</strong> {w.user_email}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <strong>Data:</strong> {new Date(w.created_at).toLocaleString('pt-BR')}
                      </p>
                      {w.user_notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Observação:</strong> {w.user_notes}
                        </p>
                      )}
                    </div>

                    {/* Carteira */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Rede:</strong> {w.network?.toUpperCase() || 'POLYGON'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-[250px]">
                          {w.wallet_address}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(w.wallet_address); }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TX Hash (se pago) */}
                  {w.tx_hash && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium mb-1">✓ Pagamento Confirmado</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono truncate max-w-[300px]">{w.tx_hash}</p>
                        <a
                          href={`https://polygonscan.com/tx/${w.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      {w.paid_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Pago em {new Date(w.paid_at).toLocaleString('pt-BR')} por {w.paid_by}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Motivo da rejeição */}
                  {w.rejection_reason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Motivo:</strong> {w.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  {(w.status === 'pending' || w.status === 'approved') && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                      {w.status === 'pending' && (
                        <button
                          onClick={() => setActionModal({ type: 'approve', withdrawal: w })}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </button>
                      )}
                      <button
                        onClick={() => setActionModal({ type: 'pay', withdrawal: w })}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Pagar (Informar TX)
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'reject', withdrawal: w })}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Ação */}
      {actionModal.type && actionModal.withdrawal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {actionModal.type === 'approve' && '✓ Aprovar Saque'}
              {actionModal.type === 'pay' && '💰 Registrar Pagamento'}
              {actionModal.type === 'reject' && '✕ Rejeitar Saque'}
            </h3>

            <div className="p-4 bg-gray-50 rounded-xl mb-4">
              <p className="text-sm"><strong>Usuário:</strong> {actionModal.withdrawal.user_email}</p>
              <p className="text-sm"><strong>Valor:</strong> ${parseFloat(actionModal.withdrawal.amount as any).toFixed(2)} {actionModal.withdrawal.currency}</p>
              <p className="text-sm font-mono text-xs truncate">
                <strong>Carteira:</strong> {actionModal.withdrawal.wallet_address}
              </p>
            </div>

            {/* Campo TX Hash (para pagar) */}
            {actionModal.type === 'pay' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hash da Transação (tx_hash) *
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole o hash da transação após enviar pelo MetaMask/carteira
                </p>
              </div>
            )}

            {/* Campo Motivo (para rejeitar) */}
            {actionModal.type === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Rejeição *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Observações do Admin */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Anotações internas..."
                rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModal({ type: null, withdrawal: null });
                  setTxHash('');
                  setRejectionReason('');
                  setAdminNotes('');
                }}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction(actionModal.type!)}
                disabled={processing || (actionModal.type === 'pay' && !txHash) || (actionModal.type === 'reject' && !rejectionReason)}
                className={`flex-1 py-3 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center ${
                  actionModal.type === 'reject' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  actionModal.type === 'approve' ? 'Aprovar' :
                  actionModal.type === 'pay' ? 'Confirmar Pagamento' :
                  'Rejeitar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de cópia */}
      {copied && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          ✓ Copiado!
        </div>
      )}
    </div>
  );
}
