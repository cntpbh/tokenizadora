# 📘 IBEDIS Document Stamp - Guia de Instalação

## 🎯 O que esta implementação faz

Esta implementação adiciona:
1. **Carimbo automático** em TODAS as páginas do PDF/JPG
2. **QR Code** apenas na ÚLTIMA página
3. **Armazenamento** do arquivo carimbado no Supabase Storage
4. **Certificado PDF formal** (estilo certidão) gerado automaticamente
5. **URLs públicas** para download de ambos os arquivos

---

## 📦 Passo 1: Instalar Dependências

```bash
cd /caminho/para/ibedis-token-platform
npm install pdf-lib sharp qrcode @types/qrcode
```

---

## 📁 Passo 2: Copiar Arquivos

Copie os arquivos desta pasta para o seu projeto:

```
implementacao-carimbo/
├── src/lib/
│   ├── document-stamper.ts          → src/lib/document-stamper.ts
│   └── certificate-generator.ts     → src/lib/certificate-generator.ts
└── src/app/api/documents/
    └── register-with-stamp/
        └── route.ts                  → src/app/api/documents/register-with-stamp/route.ts
```

---

## 🗄️ Passo 3: Configurar Supabase Storage

### 3.1 Criar Bucket

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Storage** > **Create a new bucket**
4. Configure:
   - **Name**: `documents`
   - **Public bucket**: ✅ **YES**
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/jpg`

### 3.2 Executar SQL

1. Vá em **SQL Editor**
2. Cole o conteúdo de `sql/01-storage-setup.sql`
3. Execute

Isso vai:
- Adicionar colunas `file_url` e `certificate_url` na tabela
- Criar índices

---

## ⚙️ Passo 4: Variáveis de Ambiente

Certifique-se de ter no `.env.local`:

```env
# Supabase (você já deve ter)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ← IMPORTANTE: Service Key (não a anon key)
```

**⚠️ IMPORTANTE**: A API precisa da `SUPABASE_SERVICE_ROLE_KEY` para fazer upload.

---

## 🧪 Passo 5: Testar a API

### 5.1 Teste via cURL

```bash
curl -X POST http://localhost:3000/api/documents/register-with-stamp \
  -H "Content-Type: application/json" \
  -d '{
    "file": "BASE64_DO_SEU_PDF_AQUI",
    "fileName": "contrato.pdf",
    "fileSize": 102400,
    "fileType": "application/pdf",
    "documentHash": "abc123...64chars",
    "documentTitle": "Contrato de Prestação de Serviços",
    "requesterName": "João Silva",
    "requesterEmail": "joao@example.com"
  }'
```

### 5.2 Resposta Esperada

```json
{
  "success": true,
  "data": {
    "certificateCode": "DOC-ABC123-XYZ",
    "stampedFileUrl": "https://xxxxx.supabase.co/storage/v1/object/public/documents/...",
    "certificateUrl": "https://xxxxx.supabase.co/storage/v1/object/public/certificates/...",
    "registrationId": "uuid-aqui"
  }
}
```

---

## 🔄 Passo 6: Integrar com o Fluxo Existente

### Opção A: Substituir API Antiga

Edite `src/app/api/documentos/criar-pix/route.ts`:

```typescript
// Após o pagamento ser confirmado, adicione:

// Converter arquivo para base64
const fileBase64 = fileBuffer.toString('base64');

// Chamar nova API de carimbo
const stampResponse = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/documents/register-with-stamp`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: fileBase64,
      fileName: fileName,
      fileSize: fileSize,
      fileType: fileType,
      documentHash: documentHash,
      documentTitle: documentTitle,
      requesterName: requesterName,
      requesterEmail: requesterEmail,
      registrationId: registration.id
    })
  }
);

const stampData = await stampResponse.json();

if (stampData.success) {
  console.log('✅ Arquivo carimbado e armazenado:', stampData.data);
}
```

### Opção B: Nova Página de Registro

Crie `src/app/registro-documentos/registrar-v2/page.tsx` copiando a página atual e modificando para usar a nova API.

---

## 📥 Como os Usuários Baixam os Arquivos

### No Certificado (página existente)

Adicione botões de download em `src/app/certificado-documento/[codigo]/page.tsx`:

```tsx
{registration.file_url && (
  <a
    href={registration.file_url}
    download
    className="px-6 py-3 bg-[#1a3f4d] text-white rounded-xl font-bold hover:bg-[#1a3f4d]/90 transition flex items-center gap-2"
  >
    <Download className="w-5 h-5" />
    Baixar Documento Carimbado
  </a>
)}

{registration.certificate_url && (
  <a
    href={registration.certificate_url}
    download
    className="px-6 py-3 bg-[#b8963c] text-white rounded-xl font-bold hover:bg-[#b8963c]/90 transition flex items-center gap-2"
  >
    <Download className="w-5 h-5" />
    Baixar Certificado PDF
  </a>
)}
```

---

## 📊 Estrutura de Pastas no Storage

```
documents/ (bucket público)
├── documents/
│   └── DOC-ABC123-XYZ/
│       ├── DOC-ABC123-XYZ_stamped.pdf   ← Arquivo original carimbado
│       └── DOC-ABC123-XYZ_stamped.jpg   ← Ou JPG se for imagem
└── certificates/
    └── DOC-ABC123-XYZ/
        └── DOC-ABC123-XYZ_certificate.pdf  ← Certificado formal
```

---

## 🎨 Aparência do Carimbo

### PDF - Todas as Páginas:
```
┌─────────────────────────────────────────────────────┐
│                  [Conteúdo do PDF]                   │
│                                                       │
├═══════════════════════════════════════════════════════┤
│ 🏛️ IBEDIS - Documento Registrado em Blockchain     │
│ Certificado: DOC-XXX | Data: 06/01/2026 14:30       │
│ Hash SHA-256: abc123def456...                        │
└───────────────────────────────────────────────────────┘
```

### PDF - Última Página (adicional):
```
┌─────────────────────────────────────────────────────┐
│ 🏛️ IBEDIS - Documento Registrado em Blockchain     │
│ Certificado: DOC-XXX | Data: 06/01/2026 14:30       │
│ Hash SHA-256: abc123def456...                        │
│ Solicitante: João Silva                              │
│ Verificar: token.ibedis.com.br/certificado/DOC-XXX  │
│                                            [QR CODE] │
└───────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança

✅ **Arquivo original nunca é armazenado sem carimbo**
✅ **Hash é calculado do arquivo ORIGINAL (antes do carimbo)**
✅ **URLs públicas mas criptografadas**
✅ **Storage com limite de 10MB**
✅ **Apenas PDF e JPG aceitos**

---

## 🐛 Troubleshooting

### Erro: "Storage bucket not found"
→ Certifique-se de criar o bucket "documents" no Supabase Dashboard

### Erro: "Unauthorized to upload"
→ Verifique se está usando `SUPABASE_SERVICE_ROLE_KEY` (não a anon key)

### Erro: "File too large"
→ Arquivo > 10MB. Ajuste o limite ou comprima o arquivo

### Sharp não funciona no Vercel
→ Sharp pode ter problemas no Vercel. Use a versão 0.33.5 específica

### QR Code não aparece
→ Verifique se o módulo `qrcode` está instalado

---

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup antes de modificar produção
2. **Teste local**: Teste tudo em desenvolvimento primeiro
3. **Migration**: Você pode manter as duas APIs (antiga e nova) rodando em paralelo
4. **Performance**: O carimbo adiciona ~2-3 segundos ao processo

---

## ✅ Checklist de Instalação

- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivos copiados para `src/lib/` e `src/app/api/`
- [ ] Bucket "documents" criado no Supabase Storage (público)
- [ ] SQL executado (colunas `file_url` e `certificate_url` adicionadas)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- [ ] Testado com cURL ou Postman
- [ ] Integrado com fluxo de pagamento existente
- [ ] Botões de download adicionados no certificado
- [ ] Testado em produção

---

## 🚀 Próximos Passos

Após implementar, você pode:
1. Adicionar marca d'água personalizada
2. Permitir escolha de posição do carimbo
3. Adicionar logo do IBEDIS no carimbo
4. Implementar notificação por email com links de download
5. Dashboard para visualizar todos os documentos armazenados

---

**Criado por:** Claude AI
**Data:** Janeiro 2026
**Versão:** 2.0
