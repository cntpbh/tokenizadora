# 📦 Implementação: Carimbo e Storage de Documentos

## 🎯 O que esta implementação faz:

1. **Carimba documentos PDF e JPG** com:
   - Rodapé em TODAS as páginas com informações do registro
   - QR Code apenas na ÚLTIMA página
   - Estilo visual azul IBEDIS (#1a3f4d) com borda dourada (#b8963c)

2. **Gera Certificado PDF formal** estilo certidão com:
   - Layout profissional A4
   - Todas as informações do registro
   - QR Code de verificação
   - Assinatura do presidente

3. **Armazena no Supabase Storage**:
   - Documento original (backup)
   - Documento carimbado
   - Certificado PDF

4. **Permite download** de todos os arquivos após confirmação de pagamento

---

## 📁 Arquivos Criados

```
src/
├── lib/
│   ├── document-stamper.ts      # Função de carimbar PDFs e JPGs
│   ├── certificate-generator.ts # Gera certificado PDF formal
│   └── storage-service.ts       # Upload para Supabase Storage
├── app/
│   ├── api/documents/
│   │   ├── register-with-stamp/ # Nova API de registro
│   │   │   └── route.ts
│   │   └── download/            # API de download
│   │       └── route.ts
│   └── certificado-documento-v2/
│       └── [codigo]/
│           └── page.tsx         # Página com downloads
sql/
└── 01-setup-storage.sql         # Criar bucket e colunas
```

---

## 🚀 Passo a Passo de Instalação

### 1. Instalar dependências

```bash
npm install pdf-lib sharp qrcode
npm install -D @types/qrcode
```

### 2. Executar SQL no Supabase

1. Acesse seu projeto Supabase
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo de `sql/01-setup-storage.sql`

### 3. Copiar arquivos

Copie os arquivos para seu projeto:

```bash
# Libs
cp src/lib/document-stamper.ts     seu-projeto/src/lib/
cp src/lib/certificate-generator.ts seu-projeto/src/lib/
cp src/lib/storage-service.ts       seu-projeto/src/lib/

# APIs
mkdir -p seu-projeto/src/app/api/documents/register-with-stamp
mkdir -p seu-projeto/src/app/api/documents/download
cp src/app/api/documents/register-with-stamp/route.ts seu-projeto/src/app/api/documents/register-with-stamp/
cp src/app/api/documents/download/route.ts seu-projeto/src/app/api/documents/download/

# Página (opcional - ou atualize a existente)
mkdir -p seu-projeto/src/app/certificado-documento-v2
cp -r src/app/certificado-documento-v2 seu-projeto/src/app/
```

### 4. Verificar variáveis de ambiente

Certifique-se que estas variáveis existem no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # IMPORTANTE: Service Role Key
MERCADOPAGO_ACCESS_TOKEN=...
NEXT_PUBLIC_APP_URL=https://token.ibedis.com.br
```

---

## 🔄 Como Migrar a Página de Registro Existente

Para usar a nova API, atualize o `fetch` na página de registro:

### Antes (API antiga):
```typescript
const res = await fetch('/api/documentos/criar-pix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hash, titulo, ... }),
});
```

### Depois (API nova com carimbo):
```typescript
const formData = new FormData();
formData.append('file', arquivo);  // O arquivo real!
formData.append('documentHash', hash);
formData.append('documentTitle', titulo);
formData.append('requesterName', nome);
formData.append('requesterEmail', email);
formData.append('price', preco.toString());

const res = await fetch('/api/documents/register-with-stamp', {
  method: 'POST',
  body: formData,  // FormData, não JSON!
});
```

**IMPORTANTE:** A nova API precisa receber o **arquivo real** (não apenas o hash), pois ela vai carimbar o documento.

---

## 📝 Resposta da Nova API

```json
{
  "success": true,
  "registration": {
    "id": "uuid",
    "certificate_code": "DOC-ABC123-XYZ",
    "document_hash": "abc123...",
    "status": "pending",
    "price": 4.90
  },
  "files": {
    "original_url": "https://...supabase.co/.../original.pdf",
    "stamped_url": "https://...supabase.co/.../carimbado.pdf",
    "certificate_url": "https://...supabase.co/.../certificado.pdf"
  },
  "pix": {
    "payment_id": "123456",
    "qr_code": "00020126...",
    "qr_code_base64": "data:image/png;base64,..."
  }
}
```

---

## ⚠️ Limitações e Considerações

1. **Tipos suportados:** Apenas PDF e JPG
2. **Tamanho máximo:** 10MB
3. **Storage:** Bucket público (URLs acessíveis diretamente)
4. **Carimbo em PDF:** Usa pdf-lib (pure JS, funciona em serverless)
5. **Carimbo em JPG:** Usa sharp (requer binário, pode precisar de layer no Vercel)

### Se tiver problemas com Sharp no Vercel:

Adicione ao `vercel.json`:
```json
{
  "functions": {
    "src/app/api/documents/register-with-stamp/route.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

---

## 🧪 Testar Localmente

```bash
# Iniciar o projeto
npm run dev

# Testar a API
curl -X POST http://localhost:3000/api/documents/register-with-stamp \
  -F "file=@documento.pdf" \
  -F "documentHash=abc123..." \
  -F "documentTitle=Meu Documento" \
  -F "requesterName=Fulano" \
  -F "requesterEmail=fulano@email.com" \
  -F "price=4.90"
```

---

## 📞 Suporte

Qualquer dúvida, me pergunte!
