-- ============================================
-- IBEDIS Token - Storage e Document Stamps
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar bucket para documentos (se não existir)
-- IMPORTANTE: Execute isso no Supabase Dashboard > Storage
-- Ou use a interface web para criar o bucket "documents" com acesso público

-- 2. Adicionar colunas na tabela document_registrations
ALTER TABLE document_registrations 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- 3. Criar índice para buscar por URL
CREATE INDEX IF NOT EXISTS idx_doc_file_url ON document_registrations(file_url);
CREATE INDEX IF NOT EXISTS idx_doc_cert_url ON document_registrations(certificate_url);

-- 4. Comentários
COMMENT ON COLUMN document_registrations.file_url IS 'URL pública do arquivo original CARIMBADO no Supabase Storage';
COMMENT ON COLUMN document_registrations.certificate_url IS 'URL pública do certificado PDF formal no Supabase Storage';

-- ============================================
-- Verificar estrutura
-- ============================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'document_registrations'
ORDER BY ordinal_position;

-- ============================================
-- NOTA IMPORTANTE SOBRE O BUCKET
-- ============================================
-- O bucket "documents" deve ser criado no Supabase Dashboard:
-- 1. Ir em Storage > Create a new bucket
-- 2. Nome: documents
-- 3. Public bucket: YES (para permitir download direto)
-- 4. Allowed MIME types: application/pdf, image/jpeg, image/jpg
-- 5. File size limit: 10 MB
-- 
-- Estrutura de pastas no bucket:
-- documents/
--   ├── DOC-XXX-YYYY/
--   │   ├── DOC-XXX-YYYY_stamped.pdf      (arquivo original carimbado)
--   │   └── DOC-XXX-YYYY_stamped.jpg      (ou JPG se for imagem)
--   └── certificates/
--       └── DOC-XXX-YYYY/
--           └── DOC-XXX-YYYY_certificate.pdf  (certificado formal)
