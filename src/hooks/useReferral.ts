'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_KEY = 'ibedis_referral_code';
const REFERRAL_EXPIRY_KEY = 'ibedis_referral_expiry';
const EXPIRY_DAYS = 30; // Código válido por 30 dias

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Tentar obter código da URL
    const refFromUrl = searchParams.get('ref');
    
    if (refFromUrl) {
      // Novo código na URL - salvar no localStorage
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
      
      localStorage.setItem(REFERRAL_KEY, refFromUrl.toUpperCase());
      localStorage.setItem(REFERRAL_EXPIRY_KEY, expiryDate.toISOString());
      setReferralCode(refFromUrl.toUpperCase());
    } else {
      // Verificar se existe código salvo e se não expirou
      const savedCode = localStorage.getItem(REFERRAL_KEY);
      const savedExpiry = localStorage.getItem(REFERRAL_EXPIRY_KEY);
      
      if (savedCode && savedExpiry) {
        const expiryDate = new Date(savedExpiry);
        if (expiryDate > new Date()) {
          setReferralCode(savedCode);
        } else {
          // Código expirado - remover
          localStorage.removeItem(REFERRAL_KEY);
          localStorage.removeItem(REFERRAL_EXPIRY_KEY);
        }
      }
    }
  }, [searchParams]);

  // Função para registrar a indicação quando usuário se cadastra
  const trackReferral = async (userEmail: string, userName?: string, userId?: string) => {
    if (!referralCode) return null;

    try {
      const response = await fetch('/api/referral/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_code: referralCode,
          referred_email: userEmail,
          referred_name: userName,
          user_id: userId
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao rastrear indicação:', error);
      return null;
    }
  };

  // Função para registrar compra (atualizar indicação + criar comissão)
  const trackPurchase = async (
    userEmail: string, 
    purchaseAmount: number, 
    purchaseType: 'token' | 'document',
    transactionId?: string
  ) => {
    if (!referralCode) return null;

    try {
      const response = await fetch('/api/referral/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referred_email: userEmail,
          status: 'purchased',
          purchase_amount: purchaseAmount,
          purchase_type: purchaseType,
          transaction_id: transactionId
        })
      });

      const data = await response.json();
      
      // Limpar código após compra bem-sucedida (opcional)
      // localStorage.removeItem(REFERRAL_KEY);
      // localStorage.removeItem(REFERRAL_EXPIRY_KEY);
      
      return data;
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      return null;
    }
  };

  // Função para limpar código
  const clearReferral = () => {
    localStorage.removeItem(REFERRAL_KEY);
    localStorage.removeItem(REFERRAL_EXPIRY_KEY);
    setReferralCode(null);
  };

  return {
    referralCode,
    trackReferral,
    trackPurchase,
    clearReferral
  };
}

// Função utilitária para usar fora de componentes React
export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  
  const savedCode = localStorage.getItem(REFERRAL_KEY);
  const savedExpiry = localStorage.getItem(REFERRAL_EXPIRY_KEY);
  
  if (savedCode && savedExpiry) {
    const expiryDate = new Date(savedExpiry);
    if (expiryDate > new Date()) {
      return savedCode;
    }
  }
  
  return null;
}

// Função utilitária para registrar compra
export async function registerReferralPurchase(
  userEmail: string,
  purchaseAmount: number,
  purchaseType: 'token' | 'document',
  transactionId?: string
) {
  const referralCode = getReferralCode();
  if (!referralCode) return null;

  try {
    const response = await fetch('/api/referral/track', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referred_email: userEmail,
        status: 'purchased',
        purchase_amount: purchaseAmount,
        purchase_type: purchaseType,
        transaction_id: transactionId
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Erro ao registrar compra de indicação:', error);
    return null;
  }
}
