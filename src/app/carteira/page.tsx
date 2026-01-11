'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, 
  Copy, ExternalLink, Loader2, AlertCircle, RefreshCw, History,
  DollarSign, Send, Info, Home, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface WalletData {
  id: string;
  balance_matic: number;
  balance_usdt: number;
  balance_usdc: number;
  commission_balance: number;
  total_withdrawn: number;
  total_commission_earned: number;
}

interface WithdrawalInfo {
  canWithdraw: boolean;
  nextWithdrawalDate: string | null;
  pendingWithdrawal: any | null;
  minAmount: number;
  maxAmount: number;
  cooldownDays: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  paid_at: string | null;
  rejection_reason: string | null;
}

export default function CarteiraPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawalInfo, setWithdrawalInfo] = useState<WithdrawalInfo | null>(null);
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    currency: 'USDT',
    wallet_address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await loadWalletData(session.user.email!);
    }
    setLoading(false);
  };

  const loadWalletData = async (email: string) => {
    try {
      // Carregar saldo e info de saque
      const balanceRes = await fetch(`/api/wallet/balance?email=${encodeURIComponent(email)}`);
      const balanceData = await balanceRes.json();
      
      if (balanceData.success) {
        setWallet(balanceData.wallet);
        setWithdrawalInfo(balanceData.withdrawal);
      }

      // Carregar histórico
      const historyRes = await fetch(`/api/wallet/withdraw?email=${encodeURIComponent(email)}`);
      const historyData = await historyRes.json();
      
      if (historyData.success) {
        setHistory(historyData.withdrawals);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.email) return;

    setError('');
    setSuccess('');

    // Validações
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || amount <= 0) {
      setError('Digite um valor válido');
      return;
    }

    if (!withdrawForm.wallet_address) {
      setError('Digite o endereço da carteira');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawForm.wallet_address)) {
      setError('Endereço de carteira inválido');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount,
          currency: withdrawForm.currency,
          wallet_address: withdrawForm.wallet_address,
          notes: withdrawForm.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Solicitação de saque enviada! Aguarde a aprovação.');
        setShowWithdrawModal(false);
        setWithdrawForm({ amount: '', currency: 'USDT', wallet_address: '', notes: '' });
        await loadWalletData(user.email);
      } else {
        setError(data.error || 'Erro ao solicitar saque');
      }
    } catch (err) {
      setError('Erro ao processar solicitação');
    }

    setSubmitting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pendente
        </span>;
      case 'approved':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Aprovado
        </span>;
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Pago
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Rejeitado
        </span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  const totalBalance = wallet 
    ? wallet.commission_balance + wallet.balance_usdt + wallet.balance_usdc 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700">
        {/* Header Simples */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-emerald-200 transition">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <div className="flex items-center gap-2 text-white">
              <Wallet className="w-6 h-6" />
              <span className="font-bold">Carteira</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-20 text-center">
          <Wallet className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
          <p className="text-emerald-200 mb-6">Faça login para acessar sua carteira</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition"
          >
            <Home className="w-5 h-5" />
            Ir para Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700">
      {/* Header Simples */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-emerald-200 transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2 text-white">
            <Wallet className="w-6 h-6" />
            <span className="font-bold">Minha Carteira</span>
          </div>
          <div className="text-sm text-emerald-200">
            {user.email}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            Minha Carteira
          </h1>
          <p className="text-emerald-200 mt-1">Gerencie seu saldo e solicite saques</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-xl text-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-400 rounded-xl text-green-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Saque Pendente */}
        {withdrawalInfo?.pendingWithdrawal && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 rounded-xl text-yellow-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-bold">Saque em Processamento</span>
            </div>
            <p className="text-sm">
              Você tem um saque de <strong>${withdrawalInfo.pendingWithdrawal.amount} {withdrawalInfo.pendingWithdrawal.currency}</strong> aguardando {withdrawalInfo.pendingWithdrawal.status === 'pending' ? 'aprovação' : 'pagamento'}.
            </p>
          </div>
        )}

        {/* Cards de Saldo */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Saldo Total */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-emerald-200 text-sm">Saldo Disponível</span>
              <DollarSign className="w-5 h-5 text-emerald-300" />
            </div>
            <p className="text-4xl font-bold text-white">${totalBalance.toFixed(2)}</p>
            <p className="text-emerald-300 text-sm mt-2">USD equivalente</p>
          </div>

          {/* Comissões */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-emerald-200 text-sm">Comissões</span>
              <ArrowDownLeft className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">${wallet?.commission_balance.toFixed(2) || '0.00'}</p>
            <p className="text-emerald-300 text-sm mt-2">
              Total ganho: ${wallet?.total_commission_earned.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Saques */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-emerald-200 text-sm">Total Sacado</span>
              <ArrowUpRight className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white">${wallet?.total_withdrawn.toFixed(2) || '0.00'}</p>
            <p className="text-emerald-300 text-sm mt-2">Histórico completo</p>
          </div>
        </div>

        {/* Detalhes de Saldo por Moeda */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Saldo por Moeda
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">$</span>
                </div>
                <span className="font-medium">USDT</span>
              </div>
              <p className="text-2xl font-bold">{wallet?.balance_usdt.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">$</span>
                </div>
                <span className="font-medium">USDC</span>
              </div>
              <p className="text-2xl font-bold">{wallet?.balance_usdc.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">M</span>
                </div>
                <span className="font-medium">MATIC</span>
              </div>
              <p className="text-2xl font-bold">{wallet?.balance_matic.toFixed(4) || '0.0000'}</p>
            </div>
          </div>
        </div>

        {/* Botão Solicitar Saque */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Solicitar Saque
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Mínimo: ${withdrawalInfo?.minAmount || 20} • 1 saque por semana
              </p>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!withdrawalInfo?.canWithdraw || totalBalance < (withdrawalInfo?.minAmount || 20)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowUpRight className="w-5 h-5" />
              Sacar
            </button>
          </div>

          {/* Aviso de cooldown */}
          {withdrawalInfo?.nextWithdrawalDate && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Próximo saque disponível em: {new Date(withdrawalInfo.nextWithdrawalDate).toLocaleDateString('pt-BR')}
            </div>
          )}

          {/* Aviso de saldo mínimo */}
          {totalBalance < (withdrawalInfo?.minAmount || 20) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Saldo mínimo para saque: ${withdrawalInfo?.minAmount || 20}
            </div>
          )}
        </div>

        {/* Histórico de Saques */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Histórico de Saques
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum saque realizado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">
                          ${parseFloat(item.amount as any).toFixed(2)} {item.currency}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-gray-500 font-mono truncate max-w-[200px] md:max-w-[400px]">
                        → {item.wallet_address}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.tx_hash && (
                        <a
                          href={`https://polygonscan.com/tx/${item.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1"
                        >
                          Ver TX <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {item.paid_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Pago: {new Date(item.paid_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {item.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          {item.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Simples */}
      <footer className="mt-12 py-6 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-emerald-200 text-sm">
          <p>© 2024 IBEDIS Token. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Modal de Saque */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-6 h-6 text-emerald-600" />
              Solicitar Saque
            </h3>

            <div className="space-y-4">
              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (USD)
                </label>
                <input
                  type="number"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={`Mínimo $${withdrawalInfo?.minAmount || 20}`}
                  min={withdrawalInfo?.minAmount || 20}
                  max={totalBalance}
                  step="0.01"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Disponível: ${totalBalance.toFixed(2)}
                </p>
              </div>

              {/* Moeda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receber em
                </label>
                <select
                  value={withdrawForm.currency}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="USDT">USDT (Tether)</option>
                  <option value="USDC">USDC (Circle)</option>
                  <option value="MATIC">MATIC (Polygon)</option>
                </select>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço da Carteira (Polygon)
                </label>
                <input
                  type="text"
                  value={withdrawForm.wallet_address}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, wallet_address: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rede: Polygon (MATIC) • Verifique o endereço antes de enviar
                </p>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={withdrawForm.notes}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Alguma informação adicional..."
                  rows={2}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Aviso */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                <p className="font-medium">⚠️ Atenção</p>
                <p className="text-xs mt-1">
                  O processamento pode levar até 7 dias úteis. Você receberá uma notificação quando o pagamento for realizado.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Solicitar Saque'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
