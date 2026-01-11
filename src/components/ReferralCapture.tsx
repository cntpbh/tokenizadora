'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_KEY = 'ibedis_referral_code';
const REFERRAL_EXPIRY_KEY = 'ibedis_referral_expiry';
const EXPIRY_DAYS = 30;

export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    
    if (refFromUrl) {
      // Salvar código no localStorage
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
      
      localStorage.setItem(REFERRAL_KEY, refFromUrl.toUpperCase());
      localStorage.setItem(REFERRAL_EXPIRY_KEY, expiryDate.toISOString());
      
      console.log('Código de indicação capturado:', refFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Componente invisível - não renderiza nada
  return null;
}
