'use client';

import { useState } from 'react';
import { 
  Wallet, Loader2, CheckCircle, ExternalLink, AlertCircle, 
  Info, RefreshCw, Copy, Check
} from 'lucide-react';
import { PlatformSettings } from '@/lib/supabase';

interface WalletInfo {
  valid: boolean;
  address?: string;
  network?: string;
  balances?: {
    MATIC: string;
    USDT: string;
    USDC: string;
  } | null;
  recentTransactions?: {
    hash: string;
    from: string;
    value: string;
    timestamp: string;
    isIncoming: boolean;
  }[];
  explorerUrl?: string;
  error?: string;
  message?: string;
  offline?: boolean;
}

interface CryptoSettingsProps {
  settings: PlatformSettings;
  handleChange: (field: keyof PlatformSettings, value: any) => void;
  toggleToken: (token: string) => void;
}

export default function CryptoSettings({ settings, handleChange, toggleToken }: CryptoSettingsProps) {
  const [verifying, setVerifying] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const verifyWallet = async () => {
    if (!settings.crypto_wallet_address) {
      alert('Por favor, insira o endereço da carteira');
      return;
    }

    setVerifying(true);
    setWalletInfo(null);

    try {
      const response = await fetch('/api/crypto/wallet-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: settings.crypto_wallet_address }),
      });

      const data = await response.json();
      setWalletInfo(data);
    } catch (error) {
      console.error('Erro ao verificar carteira:', error);
      setWalletInfo({ valid: false, error: 'Erro ao conectar com a blockchain' });
    }

    setVerifying(false);
  };

  const copyAddress = () => {
    if (settings.crypto_wallet_address) {
      navigator.clipboard.writeText(settings.crypto_wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const TOKEN_INFO: { [key: string]: { name: string; description: string; color: string } } = {
    MATIC: { name: 'MATIC', description: 'Token nativo da Polygon', color: 'bg-purple-600' },
    USDT: { name: 'USDT', description: 'Tether - Stablecoin em dólar', color: 'bg-green-600' },
    USDC: { name: 'USDC', description: 'USD Coin - Stablecoin em dólar', color: 'bg-blue-600' },
    DAI: { name: 'DAI', description: 'DAI - Stablecoin descentralizada', color: 'bg-yellow-600' },
    WETH: { name: 'WETH', description: 'Wrapped Ethereum', color: 'bg-indigo-600' },
  };

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 text-purple-600 mr-3" />
          <div>
            <h3 className="font-bold text-gray-800">Pagamento em Criptomoeda</h3>
            <p className="text-sm text-gray-500">Aceite tokens na rede Polygon</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.crypto_enabled}
            onChange={(e) => handleChange('crypto_enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-checked:bg-purple-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            {settings.crypto_enabled ? 'Ativo' : 'Inativo'}
          </span>
        </label>
      </div>

      {/* Carteira */}
      <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
        <h4 className="font-bold text-gray-800 mb-4 flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-purple-600" />
          Carteira de Recebimento
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço da Carteira (Polygon Mainnet)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.crypto_wallet_address || ''}
                onChange={(e) => handleChange('crypto_wallet_address', e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <button
                onClick={copyAddress}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                title="Copiar"
              >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Esta carteira receberá todos os pagamentos em crypto
            </p>
          </div>

          <button
            onClick={verifyWallet}
            disabled={verifying || !settings.crypto_wallet_address}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Verificando na Polygon...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Verificar Carteira e Saldos
              </>
            )}
          </button>

          {/* Resultado da Verificação */}
          {walletInfo && (
            <div className={`mt-4 p-4 rounded-xl ${walletInfo.valid ? (walletInfo.offline ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200') : 'bg-red-50 border border-red-200'}`}>
              {walletInfo.valid ? (
                <>
                  <div className="flex items-center mb-3">
                    <CheckCircle className={`w-5 h-5 mr-2 ${walletInfo.offline ? 'text-amber-600' : 'text-green-600'}`} />
                    <span className={`font-medium ${walletInfo.offline ? 'text-amber-700' : 'text-green-700'}`}>
                      {walletInfo.offline ? 'Carteira configurada' : `Carteira válida na ${walletInfo.network}`}
                    </span>
                  </div>

                  {walletInfo.offline ? (
                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <p className="text-sm text-amber-700">
                        {walletInfo.message || 'Não foi possível consultar saldos no momento.'}
                      </p>
                      <p className="text-xs text-gray-500">
                        A carteira foi salva. Você pode verificar os saldos diretamente no Polygonscan.
                      </p>
                      <a
                        href={`https://polygonscan.com/address/${settings.crypto_wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center text-sm text-purple-600 hover:underline mt-2 bg-purple-50 py-2 rounded-lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver Carteira no Polygonscan
                      </a>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <h5 className="font-medium text-gray-800 text-sm">💰 Saldos Atuais</h5>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">MATIC</p>
                          <p className="font-bold text-purple-700">{walletInfo.balances?.MATIC || '0'}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">USDT</p>
                          <p className="font-bold text-green-700">${walletInfo.balances?.USDT || '0'}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">USDC</p>
                          <p className="font-bold text-blue-700">${walletInfo.balances?.USDC || '0'}</p>
                        </div>
                      </div>

                      {/* Últimas Transações */}
                      {walletInfo.recentTransactions && walletInfo.recentTransactions.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium text-gray-800 text-sm mb-2">📥 Últimas Transações</h5>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {walletInfo.recentTransactions.map((tx, idx) => (
                              <div key={idx} className={`text-xs p-2 rounded ${tx.isIncoming ? 'bg-green-50' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                  <span className={tx.isIncoming ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                    {tx.isIncoming ? '↓ Recebido' : '↑ Enviado'}
                                  </span>
                                  <span className="text-gray-500">{tx.timestamp}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="font-mono text-gray-600">{tx.value} MATIC</span>
                                  <a
                                    href={`https://polygonscan.com/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:underline"
                                  >
                                    Ver TX
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <a
                        href={walletInfo.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center text-sm text-purple-600 hover:underline mt-2"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver no Polygonscan
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700">{walletInfo.error || 'Endereço inválido'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tokens Aceitos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Tokens Aceitos para Pagamento</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['MATIC', 'USDT', 'USDC'].map(token => {
            const info = TOKEN_INFO[token];
            const isSelected = (settings.crypto_accepted_tokens || []).includes(token);
            
            return (
              <button
                key={token}
                onClick={() => toggleToken(token)}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-3 h-3 rounded-full ${info.color}`}></span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-purple-600" />}
                </div>
                <p className="font-bold text-gray-800">{info.name}</p>
                <p className="text-xs text-gray-500">{info.description}</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Clique para ativar/desativar cada token
        </p>
      </div>

      {/* Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-purple-800">Como funciona</h4>
            <ul className="text-sm text-purple-700 mt-2 space-y-1">
              <li>• O comprador envia crypto para sua carteira</li>
              <li>• Ele informa o hash da transação</li>
              <li>• O sistema verifica automaticamente na Polygon</li>
              <li>• Você pode verificar manualmente na aba <strong>Transações</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
