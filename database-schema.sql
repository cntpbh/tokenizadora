-- ============================================
-- IBEDIS TOKEN PLATFORM - DATABASE SCHEMA v7
-- Execute no Supabase SQL Editor
-- ============================================

-- NOTA: Este script remove e recria as políticas
-- para evitar erros de "policy already exists"

-- ============================================
-- TABELA: users (Usuários da plataforma)
-- A senha é gerenciada pelo Supabase Auth,
-- não precisa de campo de senha aqui
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  wallet_address TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_submitted_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna wallet_address se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'wallet_address') THEN
    ALTER TABLE users ADD COLUMN wallet_address TEXT;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf_cnpj ON users(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ============================================
-- TABELA: projects (Projetos/Tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL,
  location TEXT,
  owner_name TEXT,
  owner_wallet TEXT,
  total_credits INTEGER NOT NULL DEFAULT 1000,
  available_credits INTEGER,
  price_brl DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  token_id INTEGER,
  isin TEXT,
  image_url TEXT,
  video_url TEXT,
  document_url TEXT,
  institution_name TEXT,
  institution_description TEXT,
  institution_url TEXT,
  contract_address TEXT,
  tx_hash TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'retired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_token_id ON projects(token_id);
CREATE INDEX IF NOT EXISTS idx_projects_asset_type ON projects(asset_type);

-- ============================================
-- TABELA: transactions (Transações)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'transfer', 'mint')),
  buyer_email TEXT,
  buyer_name TEXT,
  buyer_cpf_cnpj TEXT,
  buyer_wallet TEXT,
  seller_wallet TEXT,
  amount INTEGER NOT NULL DEFAULT 1,
  price_total DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('pix', 'crypto', 'stripe', 'transfer')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  certificate_code TEXT,
  tx_hash TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_certificate ON transactions(certificate_code);

-- ============================================
-- TABELA: certificates (Certificados)
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  certificate_code TEXT UNIQUE NOT NULL,
  holder_name TEXT NOT NULL,
  holder_cpf_cnpj TEXT,
  holder_company TEXT,
  token_amount INTEGER NOT NULL,
  token_type TEXT,
  project_name TEXT,
  project_location TEXT,
  tx_hash TEXT,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  qr_code_data TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'retired', 'transferred', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_project ON certificates(project_id);

-- ============================================
-- TABELA: platform_settings (Configurações)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- PIX
  pix_enabled BOOLEAN DEFAULT true,
  pix_key TEXT,
  pix_recipient_name TEXT,
  -- Crypto
  crypto_enabled BOOLEAN DEFAULT true,
  crypto_wallet_address TEXT,
  crypto_accepted_tokens TEXT[] DEFAULT ARRAY['MATIC', 'USDC', 'USDT'],
  -- Email
  email_provider TEXT,
  email_api_key TEXT,
  email_from_address TEXT,
  email_from_name TEXT,
  -- Branding
  platform_name TEXT DEFAULT 'IBEDIS Token',
  platform_logo_url TEXT,
  contact_email TEXT,
  -- Certificado
  certificate_logo_url TEXT,
  certificate_signature_url TEXT,
  certificate_signer_name TEXT,
  certificate_signer_title TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO platform_settings (platform_name)
SELECT 'IBEDIS Token'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- ============================================
-- TABELA: email_logs (Log de emails)
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template TEXT,
  provider TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- HABILITAR RLS
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REMOVER POLÍTICAS EXISTENTES (evita erro)
-- ============================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Users
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
  END LOOP;
  
  -- Projects
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'projects' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON projects';
  END LOOP;
  
  -- Transactions
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON transactions';
  END LOOP;
  
  -- Certificates
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'certificates' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON certificates';
  END LOOP;
  
  -- Platform Settings
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'platform_settings' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON platform_settings';
  END LOOP;
  
  -- Email Logs
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'email_logs' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON email_logs';
  END LOOP;
END $$;

-- ============================================
-- CRIAR NOVAS POLÍTICAS
-- ============================================

-- Users
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);

-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (true);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (true);

-- Transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (true);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (true);

-- Certificates
CREATE POLICY "certificates_select" ON certificates FOR SELECT USING (true);
CREATE POLICY "certificates_insert" ON certificates FOR INSERT WITH CHECK (true);

-- Platform Settings
CREATE POLICY "settings_select" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "settings_update" ON platform_settings FOR UPDATE USING (true);
CREATE POLICY "settings_insert" ON platform_settings FOR INSERT WITH CHECK (true);

-- Email Logs
CREATE POLICY "email_logs_select" ON email_logs FOR SELECT USING (true);
CREATE POLICY "email_logs_insert" ON email_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON platform_settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CRIAR/ATUALIZAR ADMIN
-- Descomente e altere os dados:
-- ============================================
-- INSERT INTO users (email, full_name, cpf_cnpj, is_admin, kyc_status)
-- VALUES ('wemersonmarinho@gmail.com', 'Wemerson Marinho', '00000000000', true, 'approved')
-- ON CONFLICT (email) DO UPDATE SET is_admin = true, kyc_status = 'approved';
