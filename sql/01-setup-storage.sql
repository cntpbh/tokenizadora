-- ============================================
-- IBEDIS - Configuração do Storage
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar bucket para documentos registrados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-registrations',
  'document-registrations',
  true,  -- público para permitir download
  10485760,  -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg']::text[];

-- 2. Política para permitir leitura pública
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-registrations');

-- 3. Política para permitir upload via service role
DROP POLICY IF EXISTS "Service role upload" ON storage.objects;
CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document-registrations');

-- 4. Política para permitir delete via service role
DROP POLICY IF EXISTS "Service role delete" ON storage.objects;
CREATE POLICY "Service role delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'document-registrations');

-- ============================================
-- ATUALIZAR TABELA document_registrations
-- Adicionar colunas para URLs dos arquivos
-- ============================================

-- Adicionar coluna para URL do arquivo original
ALTER TABLE document_registrations 
ADD COLUMN IF NOT EXISTS original_file_url TEXT;

-- Adicionar coluna para URL do arquivo carimbado
ALTER TABLE document_registrations 
ADD COLUMN IF NOT EXISTS stamped_file_url TEXT;

-- Adicionar coluna para URL do certificado PDF
ALTER TABLE document_registrations 
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN document_registrations.original_file_url IS 'URL do arquivo original no Storage';
COMMENT ON COLUMN document_registrations.stamped_file_url IS 'URL do arquivo com carimbo no Storage';
COMMENT ON COLUMN document_registrations.certificate_url IS 'URL do certificado PDF no Storage';

-- ============================================
-- VERIFICAR ESTRUTURA
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'document_registrations'
ORDER BY ordinal_position;
