-- =====================================================
-- IBEDIS Token Platform - V20
-- Campos para verificação manual de transações
-- =====================================================

-- Adicionar campos para verificação manual na tabela transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_manually BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Criar índice para busca por tipo e status
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(buyer_email);

-- Comentários
COMMENT ON COLUMN transactions.verified_manually IS 'Indica se a transação foi verificada manualmente pelo admin';
COMMENT ON COLUMN transactions.verified_at IS 'Data/hora da verificação manual';
COMMENT ON COLUMN transactions.verified_by IS 'Email do admin que verificou';
COMMENT ON COLUMN transactions.notes IS 'Observações do admin sobre a transação';
