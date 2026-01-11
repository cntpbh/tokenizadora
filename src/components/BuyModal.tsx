'use client';

import { useState, useEffect, useRef } from "react";
import { 
  X, Wallet, AlertCircle, ExternalLink, FileText, 
  Play, MapPin, Building, Copy, CheckCircle,
  Smartphone, Loader2, Video, Globe, Eye, User, Award, Shield,
  RefreshCw, Clock, QrCode
} from "lucide-react";
import { useAddress, useContract } from "@thirdweb-dev/react";
import { 
  getSettings, PlatformSettings, createTransaction, createCertificate,
  generateCertificateCode, generateQRCodeData, User as UserType, sendEmail,
  updateProject
} from '@/lib/supabase';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Função para enviar alerta de pagamento ao admin
const sendPaymentAlert = async (data: {
  type: 'pix' | 'crypto';
  buyerEmail: string;
  buyerName: string;
  amount: number;
  priceTotal: number;
  projectName: string;
  tokenId: number;
  paymentMethod?: string;
  txHash?: string;
  paymentId?: string;
}) => {
  try {
    await fetch('/api/payment-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.log('Alerta não enviado:', error);
  }
};

interface BuyModalProps {
  project: any;
  user: UserType | null;
  onClose: () => void;
  onLoginRequired: () => void;
  onPurchaseComplete: (certificateCode: string) => void;
}

export default function BuyModal({ project, user, onClose, onLoginRequired, onPurchaseComplete }: BuyModalProps) {
  const minPurchase = project.min_purchase || 1;
  const [amount, setAmount] = useState(minPurchase);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'crypto' | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [certificateCode, setCertificateCode] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDT');
  
  // PIX states
  const [pixData, setPixData] = useState<{
    payment_id: string;
    qr_code: string;
    qr_code_base64: string;
    ticket_url: string;
    expiration_date: string;
  } | null>(null);
  const [pixError, setPixError] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Crypto states
  const [checkingCrypto, setCheckingCrypto] = useState(false);
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [cryptoPrices, setCryptoPrices] = useState<{ MATIC: number; USDT: number; USDC: number } | null>(null);
  const [recentTxList, setRecentTxList] = useState<any[]>([]);
  const [findingTx, setFindingTx] = useState(false);
  const [uniqueCryptoAmount, setUniqueCryptoAmount] = useState<number>(0); // Valor único com centavos
  const [autoCheckStatus, setAutoCheckStatus] = useState<string>(''); // Status da verificação automática
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cryptoPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  const address = useAddress();
  const { contract } = useContract(CONTRACT_ADDRESS);
  
  const totalPrice = amount * project.price_brl;
  const totalUsd = totalPrice / 5.5;
  const maxAmount = project.available_supply ?? project.available_credits ?? project.total_credits;

  useEffect(() => {
    loadSettings();
    fetchCryptoPrices();
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (cryptoPollingRef.current) {
        clearInterval(cryptoPollingRef.current);
      }
    };
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      // Buscar cotação do MATIC via CoinGecko (gratuito)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd'
      );
      const data = await response.json();
      setCryptoPrices({
        MATIC: data['matic-network']?.usd || 0.85,
        USDT: 1,
        USDC: 1,
      });
    } catch (error) {
      console.log('Usando cotação padrão para MATIC');
      setCryptoPrices({ MATIC: 0.85, USDT: 1, USDC: 1 });
    }
  };

  // Buscar transações recentes na carteira para sugerir hash
  const handleFindRecentTx = async () => {
    setFindingTx(true);
    try {
      const response = await fetch('/api/crypto/recent-transactions');
      const data = await response.json();
      
      if (data.transactions && data.transactions.length > 0) {
        // Filtrar transações das últimas 2 horas e com valor próximo ao esperado
        const expectedValue = totalUsd;
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        
        const relevantTx = data.transactions.filter((tx: any) => {
          const txTime = new Date(tx.timestamp).getTime();
          // Calcular valor em USD
          let valueUSD = tx.value;
          if (tx.token === 'MATIC') {
            valueUSD = tx.value * (cryptoPrices?.MATIC || 0.85);
          }
          // Tolerância de 20% para achar pagamentos próximos
          const tolerance = 0.2;
          const diff = Math.abs(valueUSD - expectedValue) / expectedValue;
          return txTime > twoHoursAgo && diff < tolerance;
        });
        
        if (relevantTx.length > 0) {
          setRecentTxList(relevantTx);
        } else {
          // Mostrar todas as recentes se não encontrou match
          setRecentTxList(data.transactions.slice(0, 5));
          if (data.transactions.length > 0) {
            alert('Nenhum pagamento com valor exato encontrado. Mostrando transações recentes.');
          }
        }
      } else {
        alert('Nenhuma transação recente encontrada na carteira.');
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      alert('Erro ao buscar transações recentes.');
    }
    setFindingTx(false);
  };

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // ============ PIX MERCADO PAGO ============
  const handleSelectPix = async () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    
    setPaymentMethod('pix');
    setStep('payment');
    setLoading(true);
    setPixError('');
    
    try {
      const certCode = generateCertificateCode();
      setCertificateCode(certCode);
      
      const transaction = await createTransaction({
        project_id: project.id,
        user_id: user.id,
        type: 'purchase',
        buyer_email: user.email,
        buyer_name: user.full_name,
        buyer_cpf_cnpj: user.cpf_cnpj || undefined,
        buyer_wallet: address || undefined,
        amount: amount,
        price_total: totalPrice,
        payment_method: 'pix',
        payment_status: 'pending',
        certificate_code: certCode,
      });
      
      setTransactionId(transaction.id);
      
      const response = await fetch('/api/mercadopago/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          description: `${amount}x ${project.name}`,
          email: user.email,
          name: user.full_name,
          cpf: user.cpf_cnpj || '00000000000',
          transactionId: transaction.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }
      
      setPixData(data);
      
      // Verificação automática a cada 5 segundos
      checkIntervalRef.current = setInterval(() => {
        checkPixPayment(data.payment_id, certCode, transaction.id);
      }, 5000);
      
    } catch (error: any) {
      console.error('Erro ao criar PIX:', error);
      const errorMessage = error.message || 'Erro ao gerar QR Code PIX';
      if (errorMessage.includes('schema cache') || errorMessage.includes('column')) {
        setPixError('Erro no banco de dados. Execute o SQL CORRIGIR-TRANSACTIONS.sql no Supabase.');
      } else {
        setPixError(errorMessage);
      }
    }
    
    setLoading(false);
  };

  const checkPixPayment = async (paymentId: string, certCode: string, txId: string) => {
    if (checkingPayment || paymentStatus === 'approved') return;
    
    setCheckingPayment(true);
    
    try {
      const response = await fetch(`/api/mercadopago/check-payment/${paymentId}`);
      const data = await response.json();
      
      if (data.status === 'approved') {
        setPaymentStatus('approved');
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        
        await createCertificate({
          transaction_id: txId,
          project_id: project.id,
          user_id: user!.id,
          certificate_code: certCode,
          holder_name: user!.full_name,
          holder_cpf_cnpj: user!.cpf_cnpj,
          holder_company: user!.company_name,
          token_amount: amount,
          token_type: project.asset_type,
          project_name: project.name,
          project_location: project.location,
          tx_hash: `MP-${paymentId}`,
          issue_date: new Date().toISOString(),
          qr_code_data: generateQRCodeData(certCode),
          status: 'active',
        });
        
        // Atualizar quantidade disponível do projeto
        const newAvailable = (project.available_supply || project.total_credits) - amount;
        await updateProject(project.id, { available_supply: Math.max(0, newAvailable) });
        
        await sendEmail({
          to: user!.email,
          template: 'certificate',
          data: {
            holderName: user!.full_name,
            projectName: project.name,
            tokenAmount: amount,
            tokenType: project.asset_type,
            totalPrice: totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            paymentMethod: 'pix',
            certificateCode: certCode,
          }
        }).catch(err => console.log('Email não enviado:', err));

        // Enviar alerta de pagamento ao admin
        sendPaymentAlert({
          type: 'pix',
          buyerEmail: user!.email,
          buyerName: user!.full_name,
          amount: amount,
          priceTotal: totalPrice,
          projectName: project.name,
          tokenId: project.token_id,
          paymentMethod: 'PIX',
          paymentId: paymentId,
        });
        
        setStep('success');
        onPurchaseComplete(certCode);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    }
    
    setCheckingPayment(false);
  };

  const handleManualPixCheck = () => {
    if (pixData?.payment_id) {
      checkPixPayment(pixData.payment_id, certificateCode, transactionId);
    }
  };

  // ============ CRYPTO ============
  
  // Gerar valor único com centavos aleatórios (para identificação automática)
  const generateUniqueAmount = (baseAmount: number): number => {
    // Adicionar centavos aleatórios (0.0001 a 0.0099)
    const randomCents = Math.floor(Math.random() * 99) / 10000;
    return parseFloat((baseAmount + randomCents).toFixed(6));
  };

  // Função para completar pagamento crypto (gerar certificado)
  const completeCryptoPayment = async (txHash: string, txValue: number) => {
    if (!user) return;
    
    try {
      console.log('🎉 Completando pagamento crypto...');
      
      // Criar certificado
      await createCertificate({
        transaction_id: transactionId,
        project_id: project.id,
        user_id: user.id,
        certificate_code: certificateCode,
        holder_name: user.full_name,
        holder_cpf_cnpj: user.cpf_cnpj,
        holder_company: user.company_name,
        token_amount: amount,
        token_type: project.asset_type,
        project_name: project.name,
        project_location: project.location,
        tx_hash: txHash,
        issue_date: new Date().toISOString(),
        qr_code_data: generateQRCodeData(certificateCode),
        status: 'active',
      });
      
      // Atualizar quantidade disponível do projeto
      const newAvailable = (project.available_supply || project.total_credits) - amount;
      await updateProject(project.id, { available_supply: Math.max(0, newAvailable) });
      
      // Enviar email
      await sendEmail({
        to: user.email,
        template: 'certificate',
        data: {
          holderName: user.full_name,
          projectName: project.name,
          tokenAmount: amount,
          tokenType: project.asset_type,
          totalPrice: totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          paymentMethod: 'crypto',
          certificateCode: certificateCode,
          txHash: txHash,
        }
      }).catch(err => console.log('Email não enviado:', err));

      // Enviar alerta de pagamento ao admin
      sendPaymentAlert({
        type: 'crypto',
        buyerEmail: user.email,
        buyerName: user.full_name,
        amount: amount,
        priceTotal: totalPrice,
        projectName: project.name,
        tokenId: project.token_id,
        paymentMethod: selectedToken,
        txHash: txHash,
      });
      
      // Parar polling
      if (cryptoPollingRef.current) {
        clearInterval(cryptoPollingRef.current);
      }
      
      setCryptoTxHash(txHash);
      setStep('success');
      onPurchaseComplete(certificateCode);
      
    } catch (error) {
      console.error('Erro ao completar pagamento:', error);
    }
  };

  // Polling automático para verificar pagamento por valor único
  const startCryptoPolling = (txId: string, uniqueAmount: number, token: string) => {
    console.log(`🔄 Iniciando verificação automática para ${uniqueAmount} ${token}`);
    setAutoCheckStatus('Aguardando pagamento...');
    
    // Verificar a cada 10 segundos
    cryptoPollingRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/crypto/check-by-amount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: txId,
            expectedAmount: uniqueAmount,
            token: token,
          }),
        });
        
        const data = await response.json();
        
        if (data.found && data.verified) {
          console.log('✅ Pagamento detectado automaticamente!');
          setAutoCheckStatus('✅ Pagamento confirmado!');
          await completeCryptoPayment(data.transaction.hash, data.transaction.value);
        } else {
          setAutoCheckStatus(`🔄 Verificando... (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 10000); // 10 segundos
    
    // Primeira verificação imediata após 5 segundos
    setTimeout(async () => {
      try {
        const response = await fetch('/api/crypto/check-by-amount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: txId,
            expectedAmount: uniqueAmount,
            token: token,
          }),
        });
        
        const data = await response.json();
        
        if (data.found && data.verified) {
          await completeCryptoPayment(data.transaction.hash, data.transaction.value);
        }
      } catch (error) {
        console.error('Erro na primeira verificação:', error);
      }
    }, 5000);
  };

  const handleSelectCrypto = async () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    
    // Não exigir carteira conectada - usuário pode pagar pelo QR Code
    setPaymentMethod('crypto');
    setStep('payment');
    setLoading(true);
    
    try {
      const certCode = generateCertificateCode();
      setCertificateCode(certCode);
      
      // Calcular valor base em crypto
      const maticPrice = cryptoPrices?.MATIC || 0.50;
      const baseAmountMatic = totalUsd / maticPrice;
      
      // Gerar valor único com centavos aleatórios
      const uniqueAmount = generateUniqueAmount(baseAmountMatic);
      setUniqueCryptoAmount(uniqueAmount);
      
      const transaction = await createTransaction({
        project_id: project.id,
        user_id: user.id,
        type: 'purchase',
        buyer_email: user.email,
        buyer_name: user.full_name,
        buyer_cpf_cnpj: user.cpf_cnpj || undefined,
        buyer_wallet: address || undefined,
        amount: amount,
        price_total: totalPrice,
        payment_method: 'crypto',
        payment_status: 'pending',
        certificate_code: certCode,
        notes: `Valor único: ${uniqueAmount.toFixed(6)} MATIC`,
      });
      
      setTransactionId(transaction.id);
      setLoading(false);
      
      // Iniciar verificação automática
      startCryptoPolling(transaction.id, uniqueAmount, selectedToken);
      
    } catch (error: any) {
      console.error('Erro ao criar transação crypto:', error);
      setPixError(error.message || 'Erro ao preparar pagamento. Execute o SQL para corrigir a tabela.');
      setLoading(false);
    }
  };

  const handleVerifyCrypto = async () => {
    if (!user) {
      alert('Faça login para continuar');
      return;
    }
    
    if (!cryptoTxHash || cryptoTxHash.length < 10) {
      alert('Informe o hash da transação (TX Hash) para verificar o pagamento');
      return;
    }
    
    setCheckingCrypto(true);
    
    try {
      // Verificar transação no Polygonscan
      const response = await fetch('/api/crypto/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: cryptoTxHash,
          toWallet: cryptoWallet,
          expectedAmount: totalUsd,
          transactionId: transactionId,
          tokenSymbol: selectedToken,
        }),
      });
      
      const data = await response.json();
      
      if (data.verified || data.found) {
        // Pagamento confirmado!
        await createCertificate({
          transaction_id: transactionId,
          project_id: project.id,
          user_id: user.id,
          certificate_code: certificateCode,
          holder_name: user.full_name,
          holder_cpf_cnpj: user.cpf_cnpj,
          holder_company: user.company_name,
          token_amount: amount,
          token_type: project.asset_type,
          project_name: project.name,
          project_location: project.location,
          tx_hash: cryptoTxHash,
          issue_date: new Date().toISOString(),
          qr_code_data: generateQRCodeData(certificateCode),
          status: 'active',
        });
        
        // Atualizar quantidade disponível do projeto
        const newAvailable = (project.available_supply || project.total_credits) - amount;
        await updateProject(project.id, { available_supply: Math.max(0, newAvailable) });
        
        await sendEmail({
          to: user.email,
          template: 'certificate',
          data: {
            holderName: user.full_name,
            projectName: project.name,
            tokenAmount: amount,
            tokenType: project.asset_type,
            totalPrice: totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            paymentMethod: 'crypto',
            certificateCode: certificateCode,
            txHash: cryptoTxHash,
          }
        }).catch(err => console.log('Email não enviado:', err));

        // Enviar alerta de pagamento ao admin
        sendPaymentAlert({
          type: 'crypto',
          buyerEmail: user.email,
          buyerName: user.full_name,
          amount: amount,
          priceTotal: totalPrice,
          projectName: project.name,
          tokenId: project.token_id,
          paymentMethod: selectedToken,
          txHash: cryptoTxHash,
        });
        
        setStep('success');
        onPurchaseComplete(certificateCode);
      } else {
        alert(data.message || 'Pagamento não encontrado. Verifique se o hash está correto e se a transação foi confirmada na blockchain.');
      }
    } catch (error: any) {
      console.error('Erro ao verificar crypto:', error);
      alert('Erro ao verificar pagamento. Verifique o hash e tente novamente.');
    }
    
    setCheckingCrypto(false);
  };

  // Confirmação manual (para testes)
  const handleManualConfirm = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const txHash = paymentMethod === 'pix' 
        ? `PIX-${Date.now()}`
        : `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
      
      await createCertificate({
        transaction_id: transactionId,
        project_id: project.id,
        user_id: user.id,
        certificate_code: certificateCode,
        holder_name: user.full_name,
        holder_cpf_cnpj: user.cpf_cnpj,
        holder_company: user.company_name,
        token_amount: amount,
        token_type: project.asset_type,
        project_name: project.name,
        project_location: project.location,
        tx_hash: txHash,
        issue_date: new Date().toISOString(),
        qr_code_data: generateQRCodeData(certificateCode),
        status: 'active',
      });
      
      // Atualizar quantidade disponível do projeto
      const newAvailable = (project.available_supply || project.total_credits) - amount;
      await updateProject(project.id, { available_supply: Math.max(0, newAvailable) });
      
      await sendEmail({
        to: user.email,
        template: 'certificate',
        data: {
          holderName: user.full_name,
          projectName: project.name,
          tokenAmount: amount,
          tokenType: project.asset_type,
          totalPrice: totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          paymentMethod: paymentMethod || 'pix',
          certificateCode: certificateCode,
        }
      }).catch(err => console.log('Email não enviado:', err));

      // Enviar alerta de pagamento ao admin
      sendPaymentAlert({
        type: paymentMethod === 'crypto' ? 'crypto' : 'pix',
        buyerEmail: user.email,
        buyerName: user.full_name,
        amount: amount,
        priceTotal: totalPrice,
        projectName: project.name,
        tokenId: project.token_id,
        paymentMethod: paymentMethod === 'crypto' ? selectedToken : 'PIX',
        txHash: txHash,
      });
      
      setStep('success');
      onPurchaseComplete(certificateCode);
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      alert('Erro ao processar. Tente novamente.');
    }
    
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cryptoWallet = settings?.crypto_wallet_address || '0x4eB4954877e578A17Ca494622A9ce2eA4fbD8723';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-emerald-800 to-emerald-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-20">🌱</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h2 className="text-xl font-bold">{project.name}</h2>
            <div className="flex items-center text-emerald-200 text-sm">
              <MapPin className="w-4 h-4 mr-1" />{project.location}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full transition text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          
          {/* STEP: SELECIONAR */}
          {step === 'select' && (
            <>
              {/* Aviso de quantidade mínima */}
              {minPurchase > 1 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">📦</span>
                    <div>
                      <p className="font-bold text-amber-800">
                        Quantidade mínima: {minPurchase} tokens
                      </p>
                      {project.min_purchase_reason && (
                        <p className="text-sm text-amber-700 mt-1">
                          {project.min_purchase_reason}
                        </p>
                      )}
                      <p className="text-xs text-amber-600 mt-2">
                        Valor mínimo: R$ {(minPurchase * project.price_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantidade */}
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">Quantidade de Tokens</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAmount(Math.max(minPurchase, amount - 1))}
                    className="w-10 h-10 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50"
                    disabled={amount <= minPurchase}
                  >-</button>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(minPurchase, Math.min(maxAmount, parseInt(e.target.value) || minPurchase)))}
                    min={minPurchase}
                    className="w-24 text-center py-2 border rounded-lg text-lg font-bold"
                  />
                  <button
                    onClick={() => setAmount(Math.min(maxAmount, amount + 1))}
                    className="w-10 h-10 bg-gray-200 rounded-lg font-bold hover:bg-gray-300"
                  >+</button>
                  <span className="text-gray-500 text-sm">
                    {minPurchase > 1 ? `Mín: ${minPurchase} | ` : ''}Máx: {maxAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Preço unitário:</span>
                  <span>R$ {project.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Quantidade:</span>
                  <span>{amount} tokens</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-emerald-700">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  ≈ ${totalUsd.toFixed(2)} USD
                </div>
              </div>

              {/* Métodos */}
              <h3 className="font-bold text-gray-800 mb-3">Escolha o método de pagamento</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSelectPix}
                  className="p-4 border-2 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition"
                >
                  <div className="text-3xl mb-2">📱</div>
                  <div className="font-bold">PIX</div>
                  <div className="text-xs text-gray-500">Mercado Pago</div>
                  <div className="text-emerald-600 font-bold mt-2">
                    R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </button>

                <button
                  onClick={handleSelectCrypto}
                  className="p-4 border-2 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition"
                >
                  <div className="text-3xl mb-2">💎</div>
                  <div className="font-bold">Crypto</div>
                  <div className="text-xs text-gray-500">USDT, USDC, MATIC</div>
                  <div className="text-purple-600 font-bold mt-2">
                    ~${totalUsd.toFixed(2)} USD
                  </div>
                </button>
              </div>

              {!user && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Faça login para continuar com a compra
                </div>
              )}
            </>
          )}

          {/* STEP: PIX */}
          {step === 'payment' && paymentMethod === 'pix' && (
            <div className="text-center">
              {loading ? (
                <div className="py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600">Gerando QR Code PIX via Mercado Pago...</p>
                </div>
              ) : pixError ? (
                <div className="py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{pixError}</p>
                  <p className="text-gray-500 text-sm mb-4">Verifique se as variáveis de ambiente do Mercado Pago estão configuradas no Vercel.</p>
                  <button
                    onClick={() => { setStep('select'); setPixError(''); }}
                    className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Voltar
                  </button>
                </div>
              ) : pixData ? (
                <>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-emerald-700 mb-1">
                      R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-gray-500 text-sm">Escaneie o QR Code ou copie o código PIX</p>
                  </div>

                  {pixData.qr_code_base64 && (
                    <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-4">
                      <img 
                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  )}

                  {pixData.qr_code && (
                    <div className="mb-4">
                      <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono break-all max-h-20 overflow-y-auto text-left">
                        {pixData.qr_code}
                      </div>
                      <button
                        onClick={() => copyToClipboard(pixData.qr_code)}
                        className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center mx-auto"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copiado!' : 'Copiar código PIX'}
                      </button>
                    </div>
                  )}

                  <div className={`p-3 rounded-lg mb-4 ${
                    paymentStatus === 'approved' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {paymentStatus === 'approved' ? (
                      <>
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                        Pagamento confirmado!
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 inline mr-2" />
                        Aguardando pagamento...
                        {checkingPayment && <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />}
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={handleManualPixCheck}
                      disabled={checkingPayment}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${checkingPayment ? 'animate-spin' : ''}`} />
                      Verificar pagamento
                    </button>
                    <button
                      onClick={handleManualConfirm}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
                    >
                      Confirmar manualmente
                    </button>
                  </div>

                  <button
                    onClick={() => { setStep('select'); setPixData(null); if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); }}
                    className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ← Voltar
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* STEP: CRYPTO */}
          {step === 'payment' && paymentMethod === 'crypto' && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Preparando pagamento...</p>
                </div>
              ) : pixError ? (
                <div className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{pixError}</p>
                  <button
                    onClick={() => { setStep('select'); setPixError(''); }}
                    className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <>
                  {/* Header com valor ÚNICO */}
                  <div className="text-center mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Valor EXATO a pagar:</p>
                    <div className="text-3xl font-bold mb-1">
                      {uniqueCryptoAmount > 0 
                        ? `${uniqueCryptoAmount.toFixed(6)} MATIC`
                        : `${(totalUsd / (cryptoPrices?.MATIC || 0.50)).toFixed(4)} MATIC`}
                    </div>
                    <p className="text-xs opacity-75">
                      ≈ R$ {totalPrice.toFixed(2)} • {amount} token(s)
                    </p>
                    {/* Status da verificação automática */}
                    {autoCheckStatus && (
                      <div className="mt-2 bg-white/20 rounded-lg px-3 py-1 inline-block">
                        <span className="text-xs">{autoCheckStatus}</span>
                      </div>
                    )}
                  </div>

                  {/* Aviso sobre verificação automática */}
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 mb-4">
                    <p className="text-emerald-800 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <strong>Verificação automática ativa!</strong>
                    </p>
                    <p className="text-emerald-700 text-xs mt-1">
                      Após enviar o valor exato, o sistema confirmará automaticamente em até 30 segundos.
                    </p>
                  </div>

                  {/* Seletor de token REMOVIDO - Agora só MATIC para simplificar */}
                  <div className="hidden mb-4">
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      Escolha a moeda para pagamento:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'USDT', name: 'USDT', color: 'green' },
                        { id: 'USDC', name: 'USDC', color: 'blue' },
                        { id: 'MATIC', name: 'MATIC', color: 'purple' },
                        { id: 'DAI', name: 'DAI', color: 'yellow' },
                      ].map((token) => (
                        <button
                          key={token.id}
                          onClick={() => setSelectedToken(token.id)}
                          className={`p-3 rounded-xl font-medium transition border-2 ${
                            selectedToken === token.id
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="text-lg">{token.name}</div>
                          {selectedToken === token.id && (
                            <div className="text-xs opacity-75">Selecionado</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info do pedido */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Pedido:</span>
                      <span className="font-mono font-medium">#{transactionId?.slice(-8) || 'CRYPTO'}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Projeto:</span>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rede:</span>
                      <span className="font-medium text-purple-700">Polygon (Mainnet)</span>
                    </div>
                  </div>

                  {/* QR Code com valor único */}
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-3 text-center font-medium">
                      📱 Escaneie com sua carteira:
                    </p>
                    <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto block text-center border">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `ethereum:${cryptoWallet}@137?value=${Math.floor(uniqueCryptoAmount * 1e18)}`
                        )}`}
                        alt="QR Code Pagamento"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                        🔗 Polygon Mainnet (Chain ID: 137)
                      </span>
                    </div>
                  </div>

                  {/* Endereço para copiar */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 font-medium">Endereço para depósito:</p>
                      <a
                        href={`https://polygonscan.com/address/${cryptoWallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:underline flex items-center"
                      >
                        Ver no Polygonscan <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                    <div className="bg-white p-3 rounded-lg font-mono text-xs break-all border border-gray-200">
                      {cryptoWallet}
                    </div>
                    <button
                      onClick={() => copyToClipboard(cryptoWallet)}
                      className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center text-sm font-medium"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copiado!' : 'Copiar endereço'}
                    </button>
                  </div>

                  {/* Valor exato a enviar */}
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
                    <p className="font-bold text-amber-800 mb-2 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Envie EXATAMENTE este valor:
                    </p>
                    <div className="bg-white rounded-lg p-3 text-center border border-amber-200">
                      <span className="text-2xl font-bold text-amber-700">
                        {uniqueCryptoAmount.toFixed(6)} MATIC
                      </span>
                      <button
                        onClick={() => copyToClipboard(uniqueCryptoAmount.toFixed(6))}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                        title="Copiar valor"
                      >
                        <Copy className="w-4 h-4 inline" />
                      </button>
                    </div>
                    <p className="text-xs text-amber-700 mt-2 text-center">
                      ⚠️ Envie o valor <strong>EXATO</strong> para identificação automática
                    </p>
                    <p className="text-xs text-amber-600 mt-1 text-center">
                      Use a rede <strong>Polygon</strong> • Não envie por outras redes!
                    </p>
                  </div>

                  {/* Campo para informar TX Hash (backup manual) */}
                  <div className="bg-gray-50 border rounded-xl p-4 mb-4">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600 flex items-center justify-between">
                        <span>Verificação manual (opcional)</span>
                        <span className="text-xs text-gray-400 group-open:hidden">Clique para expandir</span>
                      </summary>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm text-gray-600">
                            Informe o hash se a verificação automática não funcionar:
                          </label>
                          <button
                            onClick={handleFindRecentTx}
                            disabled={findingTx}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center"
                          >
                            {findingTx ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            )}
                            Buscar
                          </button>
                        </div>
                        
                        {recentTxList.length > 0 && (
                          <div className="mb-3 max-h-32 overflow-y-auto">
                            <p className="text-xs text-gray-500 mb-2">Transações recentes:</p>
                            {recentTxList.map((tx: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCryptoTxHash(tx.hash);
                                  setRecentTxList([]);
                                }}
                                className={`w-full text-left p-2 rounded-lg mb-1 text-xs border transition ${
                                  cryptoTxHash === tx.hash 
                                    ? 'border-purple-500 bg-purple-50' 
                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-mono truncate flex-1">{tx.hash.slice(0, 14)}...</span>
                                  <span className="ml-2 font-medium text-emerald-600">{tx.value} {tx.token}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <input
                          type="text"
                          value={cryptoTxHash}
                          onChange={(e) => setCryptoTxHash(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                        />
                        
                        <button
                          onClick={handleVerifyCrypto}
                          disabled={checkingCrypto || !cryptoTxHash}
                          className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
                        >
                          {checkingCrypto ? 'Verificando...' : 'Verificar manualmente'}
                        </button>
                      </div>
                    </details>
                  </div>

                  {address && (
                    <div className="bg-emerald-50 rounded-lg p-3 mb-4 text-sm border border-emerald-200">
                      <span className="text-emerald-700">✓ Carteira conectada: </span>
                      <span className="font-mono text-xs">{address.slice(0, 10)}...{address.slice(-8)}</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (cryptoPollingRef.current) clearInterval(cryptoPollingRef.current);
                      setStep('select');
                    }}
                    className="mt-4 text-gray-500 hover:text-gray-700 text-sm block mx-auto"
                  >
                    ← Voltar e escolher outro método
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP: SUCESSO */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Compra Realizada! 🎉
              </h3>
              
              <p className="text-gray-600 mb-6">
                Seu certificado foi gerado com sucesso.
              </p>

              <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Código do Certificado</p>
                <p className="text-xl font-bold text-emerald-700 font-mono">
                  {certificateCode}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <p className="font-medium mb-2">Resumo:</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Projeto:</span>
                    <span>{project.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantidade:</span>
                    <span>{amount} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor:</span>
                    <span>R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pagamento:</span>
                    <span className="capitalize">{paymentMethod}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Um email com o certificado foi enviado para {user?.email}
              </p>

              <button
                onClick={onClose}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
