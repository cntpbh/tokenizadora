// src/app/api/config/route.ts
// API para gerenciar configurações da plataforma

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PRICES, DEFAULT_LIMITS, PAYMENT_CONFIG } from '@/lib/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// GET - Retorna configurações públicas
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  // Configurações padrão para retornar mesmo sem banco
  let config = {
    // Preços
    document_price_pix: DEFAULT_PRICES.document_registration_pix,
    document_price_crypto: DEFAULT_PRICES.document_registration_crypto,
    
    // Limites
    max_file_size_mb: DEFAULT_LIMITS.max_file_size_mb,
    max_document_size_mb: DEFAULT_LIMITS.max_document_size_mb,
    min_withdrawal_usd: DEFAULT_LIMITS.min_withdrawal_usd,
    max_withdrawal_usd: DEFAULT_LIMITS.max_withdrawal_usd,
    
    // Pagamentos habilitados
    pix_enabled: PAYMENT_CONFIG.pix_enabled,
    crypto_enabled: PAYMENT_CONFIG.crypto_enabled,
    stripe_enabled: PAYMENT_CONFIG.stripe_enabled,
    
    // Crypto
    accepted_tokens: PAYMENT_CONFIG.accepted_crypto_tokens,
    crypto_network: PAYMENT_CONFIG.crypto_network,
    crypto_wallet: PAYMENT_CONFIG.crypto_wallet,
    
    // Plataforma
    platform_name: 'IBEDIS Token',
    platform_logo_url: 'https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png',
  };
  
  if (supabase) {
    try {
      // Buscar configurações do banco
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (settings) {
        config = {
          ...config,
          pix_enabled: settings.pix_enabled ?? config.pix_enabled,
          crypto_enabled: settings.crypto_enabled ?? config.crypto_enabled,
          stripe_enabled: settings.stripe_enabled ?? config.stripe_enabled,
          platform_name: settings.platform_name || config.platform_name,
          platform_logo_url: settings.platform_logo_url || config.platform_logo_url,
        };
      }
      
      // Buscar preço de documento
      const { data: priceConfig } = await supabase
        .from('document_registry_config')
        .select('config_value')
        .eq('config_key', 'price_pix')
        .eq('is_active', true)
        .single();
      
      if (priceConfig?.config_value) {
        const value = priceConfig.config_value;
        if (typeof value === 'object' && value.price) {
          config.document_price_pix = Number(value.price);
        } else if (typeof value === 'number') {
          config.document_price_pix = value;
        }
      }
    } catch (e) {
      console.log('Erro ao buscar configurações do banco:', e);
    }
  }
  
  return NextResponse.json({
    success: true,
    config,
  });
}

// POST - Atualiza configurações (requer autenticação admin)
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    const { type, key, value } = body;
    
    // Atualizar preço de documento
    if (type === 'document_price') {
      const { error } = await supabase
        .from('document_registry_config')
        .upsert({
          config_key: 'price_pix',
          config_value: { price: Number(value), currency: 'BRL' },
          description: 'Preço do registro de documento via PIX',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'config_key',
        });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Preço atualizado' });
    }
    
    // Atualizar configurações gerais
    if (type === 'platform_settings') {
      // Verificar se já existe registro
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .limit(1)
        .single();
      
      const updateData = {
        ...value,
        updated_at: new Date().toISOString(),
      };
      
      let result;
      if (existing) {
        result = await supabase
          .from('platform_settings')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('platform_settings')
          .insert(updateData);
      }
      
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Configurações atualizadas' });
    }
    
    return NextResponse.json({ error: 'Tipo de configuração inválido' }, { status: 400 });
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
