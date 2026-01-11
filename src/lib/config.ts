// src/lib/config.ts
// Configurações centralizadas da plataforma - podem ser sobrescritas pelo banco de dados

import { createClient } from '@supabase/supabase-js';

// ============================================
// PREÇOS PADRÃO (usados quando não há config no banco)
// ============================================
export const DEFAULT_PRICES = {
  // Registro de Documentos
  document_registration_pix: 4.90,
  document_registration_crypto: 3.00, // em USD
  
  // Tokens (por unidade)
  token_min_price_brl: 10.00,
  
  // Taxas
  pix_fee_percent: 0,
  crypto_fee_percent: 0,
  withdrawal_fee_percent: 0,
  withdrawal_fee_fixed_usd: 0,
  
  // Comissões de indicação
  referral_commission_tokens: 10.00, // percentual
  referral_commission_documents: 10.00, // percentual
};

// ============================================
// LIMITES PADRÃO
// ============================================
export const DEFAULT_LIMITS = {
  // Upload de arquivos
  max_file_size_mb: 50,
  max_document_size_mb: 10,
  
  // Saques
  min_withdrawal_usd: 20.00,
  max_withdrawal_usd: 1000.00,
  withdrawal_cooldown_days: 7,
  
  // Compras
  min_token_purchase: 1,
};

// ============================================
// CONFIGURAÇÕES DE PAGAMENTO
// ============================================
export const PAYMENT_CONFIG = {
  pix_enabled: true,
  crypto_enabled: true,
  stripe_enabled: false,
  
  accepted_crypto_tokens: ['MATIC', 'USDT', 'USDC'],
  crypto_network: 'polygon',
  
  // Wallet de recebimento crypto
  crypto_wallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || '0xc1b859a61F7Ca2353047147d9B2160c8bfc2460C',
};

// ============================================
// CONFIGURAÇÕES DE EMAIL
// ============================================
export const EMAIL_CONFIG = {
  provider: process.env.EMAIL_PROVIDER || 'resend',
  from_address: process.env.EMAIL_FROM_ADDRESS || 'noreply@ibedis.org',
  from_name: process.env.EMAIL_FROM_NAME || 'IBEDIS Token',
  admin_email: process.env.EMAIL_ADMIN || 'marinho@ibedis.org',
};

// ============================================
// INTERFACE DE CONFIGURAÇÃO DO BANCO
// ============================================
export interface PlatformConfig {
  // Preços
  document_price_pix: number;
  document_price_crypto: number;
  
  // Pagamentos
  pix_enabled: boolean;
  crypto_enabled: boolean;
  stripe_enabled: boolean;
  
  // Email
  email_provider: string;
  email_api_key?: string;
  email_from_address: string;
  email_from_name: string;
  
  // Plataforma
  platform_name: string;
  platform_logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Certificados
  certificate_logo_url?: string;
  certificate_signature_url?: string;
  certificate_signer_name?: string;
  certificate_signer_title?: string;
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Busca configurações do banco de dados
 * Retorna configurações padrão se não encontrar no banco
 */
export async function getConfig(): Promise<PlatformConfig> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const defaultConfig: PlatformConfig = {
    document_price_pix: DEFAULT_PRICES.document_registration_pix,
    document_price_crypto: DEFAULT_PRICES.document_registration_crypto,
    pix_enabled: PAYMENT_CONFIG.pix_enabled,
    crypto_enabled: PAYMENT_CONFIG.crypto_enabled,
    stripe_enabled: PAYMENT_CONFIG.stripe_enabled,
    email_provider: EMAIL_CONFIG.provider,
    email_from_address: EMAIL_CONFIG.from_address,
    email_from_name: EMAIL_CONFIG.from_name,
    platform_name: 'IBEDIS Token',
  };
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase não configurado, usando configurações padrão');
    return defaultConfig;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar platform_settings
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error || !settings) {
      console.log('Configurações não encontradas no banco, usando padrão');
      return defaultConfig;
    }
    
    // Buscar preço de documento da tabela de config
    let documentPrice = DEFAULT_PRICES.document_registration_pix;
    const { data: priceConfig } = await supabase
      .from('document_registry_config')
      .select('config_value')
      .eq('config_key', 'price_pix')
      .single();
    
    if (priceConfig?.config_value) {
      const configValue = priceConfig.config_value;
      if (typeof configValue === 'object' && configValue.price) {
        documentPrice = Number(configValue.price);
      } else if (typeof configValue === 'number') {
        documentPrice = configValue;
      }
    }
    
    return {
      document_price_pix: documentPrice,
      document_price_crypto: DEFAULT_PRICES.document_registration_crypto,
      pix_enabled: settings.pix_enabled ?? PAYMENT_CONFIG.pix_enabled,
      crypto_enabled: settings.crypto_enabled ?? PAYMENT_CONFIG.crypto_enabled,
      stripe_enabled: settings.stripe_enabled ?? PAYMENT_CONFIG.stripe_enabled,
      email_provider: settings.email_provider || EMAIL_CONFIG.provider,
      email_api_key: settings.email_api_key,
      email_from_address: settings.email_from_address || EMAIL_CONFIG.from_address,
      email_from_name: settings.email_from_name || EMAIL_CONFIG.from_name,
      platform_name: settings.platform_name || 'IBEDIS Token',
      platform_logo_url: settings.platform_logo_url,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      certificate_logo_url: settings.certificate_logo_url,
      certificate_signature_url: settings.certificate_signature_url,
      certificate_signer_name: settings.certificate_signer_name,
      certificate_signer_title: settings.certificate_signer_title,
    };
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    return defaultConfig;
  }
}

/**
 * Busca apenas o preço de registro de documento
 */
export async function getDocumentPrice(): Promise<number> {
  const config = await getConfig();
  return config.document_price_pix;
}

/**
 * Valida se o email está configurado corretamente
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

/**
 * Valida se o Mercado Pago está configurado
 */
export function isPixConfigured(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

/**
 * Valida se blockchain está configurada
 */
export function isCryptoConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID);
}
