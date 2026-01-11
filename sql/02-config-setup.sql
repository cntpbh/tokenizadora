-- ============================================
-- IBEDIS TOKEN PLATFORM
-- Setup de Configurações e Preços
-- Executar no Supabase SQL Editor
-- ============================================

-- 1. TABELA DE CONFIGURAÇÕES DO REGISTRO DE DOCUMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_registry_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_key character varying NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_registry_config_pkey PRIMARY KEY (id)
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_document_registry_config_key ON public.document_registry_config(config_key);

-- 2. INSERIR CONFIGURAÇÃO DE PREÇO PADRÃO
-- ============================================
INSERT INTO public.document_registry_config (config_key, config_value, description, is_active)
VALUES (
  'price_pix',
  '{"price": 4.90, "currency": "BRL", "description": "Preço padrão do registro de documento via PIX"}'::jsonb,
  'Preço do registro de documento via PIX em BRL',
  true
)
ON CONFLICT (config_key) 
DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  updated_at = now();

-- Configuração de preço crypto (em USD)
INSERT INTO public.document_registry_config (config_key, config_value, description, is_active)
VALUES (
  'price_crypto',
  '{"price": 3.00, "currency": "USD", "description": "Preço do registro de documento via crypto"}'::jsonb,
  'Preço do registro de documento via crypto em USD',
  true
)
ON CONFLICT (config_key) 
DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  updated_at = now();

-- 3. TABELA DE CONFIGURAÇÕES DA PLATAFORMA (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  -- Pagamentos PIX
  pix_enabled boolean DEFAULT true,
  pix_key character varying,
  pix_recipient_name character varying,
  
  -- Pagamentos Crypto
  crypto_enabled boolean DEFAULT true,
  crypto_wallet_address character varying DEFAULT '0xc1b859a61F7Ca2353047147d9B2160c8bfc2460C',
  crypto_accepted_tokens text[] DEFAULT ARRAY['MATIC', 'USDT', 'USDC'],
  
  -- Stripe (futuro)
  stripe_enabled boolean DEFAULT false,
  stripe_public_key character varying,
  stripe_secret_key character varying,
  
  -- Email
  email_provider character varying DEFAULT 'resend',
  email_api_key character varying,
  email_from_address character varying DEFAULT 'noreply@ibedis.org',
  email_from_name character varying DEFAULT 'IBEDIS Token',
  
  -- Plataforma
  platform_name character varying DEFAULT 'IBEDIS Token',
  platform_logo_url text DEFAULT 'https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png',
  platform_favicon_url text,
  contact_email character varying DEFAULT 'marinho@ibedis.org',
  contact_phone character varying,
  
  -- Certificados
  certificate_logo_url text,
  certificate_signature_url text,
  certificate_signer_name character varying DEFAULT 'IBEDIS',
  certificate_signer_title character varying DEFAULT 'Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável',
  
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platform_settings_pkey PRIMARY KEY (id)
);

-- 4. INSERIR CONFIGURAÇÃO PADRÃO DA PLATAFORMA
-- ============================================
INSERT INTO public.platform_settings (
  pix_enabled,
  crypto_enabled,
  email_provider,
  email_from_address,
  email_from_name,
  platform_name,
  contact_email
)
SELECT 
  true,
  true,
  'resend',
  'noreply@ibedis.org',
  'IBEDIS Token',
  'IBEDIS Token',
  'marinho@ibedis.org'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings LIMIT 1);

-- 5. TABELA DE LOGS DE EMAIL (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  template text,
  subject text,
  provider text,
  status text DEFAULT 'sent',
  error_message text,
  metadata jsonb,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- 6. CONFIGURAÇÕES DE REFERRAL/INDICAÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  commission_percent_tokens numeric DEFAULT 10.00,
  commission_percent_documents numeric DEFAULT 10.00,
  min_withdrawal numeric DEFAULT 50.00,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_settings_pkey PRIMARY KEY (id)
);

INSERT INTO public.referral_settings (commission_percent_tokens, commission_percent_documents, min_withdrawal, is_active)
SELECT 10.00, 10.00, 50.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.referral_settings LIMIT 1);

-- 7. CONFIGURAÇÕES DE SAQUE
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdrawal_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  min_withdrawal_usd numeric DEFAULT 20.00,
  max_withdrawal_usd numeric DEFAULT 1000.00,
  withdrawal_cooldown_days integer DEFAULT 7,
  withdrawal_fee_percent numeric DEFAULT 0,
  withdrawal_fee_fixed_usd numeric DEFAULT 0,
  allowed_currencies text[] DEFAULT ARRAY['MATIC', 'USDT', 'USDC'],
  withdrawals_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT withdrawal_settings_pkey PRIMARY KEY (id)
);

INSERT INTO public.withdrawal_settings (
  min_withdrawal_usd, max_withdrawal_usd, withdrawal_cooldown_days, withdrawals_enabled
)
SELECT 20.00, 1000.00, 7, true
WHERE NOT EXISTS (SELECT 1 FROM public.withdrawal_settings LIMIT 1);

-- 8. FUNÇÃO PARA ATUALIZAR UPDATED_AT AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_document_registry_config_updated_at ON public.document_registry_config;
CREATE TRIGGER update_document_registry_config_updated_at
    BEFORE UPDATE ON public.document_registry_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. POLÍTICAS RLS
-- ============================================
ALTER TABLE public.document_registry_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública das configurações
CREATE POLICY IF NOT EXISTS "Allow public read document_registry_config"
ON public.document_registry_config FOR SELECT
TO public
USING (is_active = true);

-- Permitir leitura pública de platform_settings
CREATE POLICY IF NOT EXISTS "Allow public read platform_settings"
ON public.platform_settings FOR SELECT
TO public
USING (true);

-- Service role pode fazer tudo
CREATE POLICY IF NOT EXISTS "Service role full access document_registry_config"
ON public.document_registry_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access platform_settings"
ON public.platform_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access email_logs"
ON public.email_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 10. VIEW PARA CONFIGURAÇÕES COMPLETAS
-- ============================================
CREATE OR REPLACE VIEW public.v_platform_config AS
SELECT 
  ps.platform_name,
  ps.platform_logo_url,
  ps.pix_enabled,
  ps.crypto_enabled,
  ps.stripe_enabled,
  ps.email_provider,
  ps.email_from_address,
  ps.email_from_name,
  ps.contact_email,
  ps.certificate_signer_name,
  ps.certificate_signer_title,
  COALESCE((
    SELECT (config_value->>'price')::numeric 
    FROM document_registry_config 
    WHERE config_key = 'price_pix' AND is_active = true
  ), 4.90) as document_price_pix,
  COALESCE((
    SELECT (config_value->>'price')::numeric 
    FROM document_registry_config 
    WHERE config_key = 'price_crypto' AND is_active = true
  ), 3.00) as document_price_crypto,
  rs.commission_percent_tokens,
  rs.commission_percent_documents,
  ws.min_withdrawal_usd,
  ws.max_withdrawal_usd,
  ws.withdrawals_enabled
FROM platform_settings ps
CROSS JOIN referral_settings rs
CROSS JOIN withdrawal_settings ws
LIMIT 1;

-- ============================================
-- INSTRUÇÕES
-- ============================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Para alterar o preço do documento:
--    UPDATE document_registry_config 
--    SET config_value = '{"price": 9.90, "currency": "BRL"}'::jsonb
--    WHERE config_key = 'price_pix';
--
-- 3. Para configurar email (Resend):
--    UPDATE platform_settings 
--    SET email_api_key = 'sua-api-key-aqui',
--        email_from_address = 'noreply@seudominio.com'
--    WHERE id = (SELECT id FROM platform_settings LIMIT 1);
--
-- 4. Para verificar configurações atuais:
--    SELECT * FROM v_platform_config;
-- ============================================

SELECT 'Setup de configurações concluído com sucesso!' as status;
