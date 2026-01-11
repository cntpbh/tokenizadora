# 🔧 CORREÇÃO DO ERRO: uploadToIPFS

## ❌ ERRO IDENTIFICADO

```
Module '"@/lib/ipfs-service"' has no exported member 'uploadToIPFS'
```

O arquivo `ipfs-service.ts` estava **incompleto** ou sem a função `uploadToIPFS`.

---

## ✅ SOLUÇÃO

Substitua **3 arquivos** no seu projeto:

### 1️⃣ `src/lib/ipfs-service.ts` (SUBSTITUIR COMPLETAMENTE)
- ✅ Adiciona função `uploadToIPFS`
- ✅ Adiciona função `uploadJSONToPinata`
- ✅ Adiciona função `isIPFSConfigured`
- ✅ Adiciona função `getIPFSUrl`
- ✅ Suporte para PINATA_JWT ou PINATA_API_KEY

### 2️⃣ `src/app/api/documentos/registrar/route.ts` (SUBSTITUIR)
- ✅ Importações corretas
- ✅ Upload para IPFS funcionando
- ✅ Metadata JSON no IPFS
- ✅ Integração com MercadoPago
- ✅ Preço dinâmico do banco

### 3️⃣ `package.json` (SUBSTITUIR)
- ✅ Adiciona `axios: ^1.6.0` (necessário para IPFS)

---

## 📦 PASSO A PASSO

### 1. Copiar arquivos no projeto local

```bash
# Substituir os 3 arquivos:
cp correcao-ipfs/src/lib/ipfs-service.ts ./src/lib/
cp correcao-ipfs/src/app/api/documentos/registrar/route.ts ./src/app/api/documentos/registrar/
cp correcao-ipfs/package.json ./
```

### 2. Reinstalar dependências

```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Testar build local

```bash
npm run build
```

✅ **Deve compilar sem erros!**

### 4. Commit e Push

```bash
git add .
git commit -m "fix: Add complete IPFS service with uploadToIPFS function"
git push origin main
```

---

## 🔐 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Certifique-se que estas variáveis estão no Vercel:

```bash
# IPFS (Pinata) - OBRIGATÓRIO
PINATA_JWT=eyJhbGc...

# OU (alternativa)
PINATA_API_KEY=xxx
PINATA_SECRET_KEY=xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...

# Resend (opcional)
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=https://token.ibedis.com.br
```

---

## 🧪 TESTAR APÓS DEPLOY

1. ✅ Build do Vercel deve passar
2. ✅ Acesse: `/registro-documentos/registrar`
3. ✅ Faça upload de um arquivo
4. ✅ Verifique se o hash IPFS é gerado
5. ✅ Confirme que o PIX é criado

---

## 🔍 O QUE FOI CORRIGIDO

| Arquivo | Problema | Solução |
|---------|----------|---------|
| `ipfs-service.ts` | Função `uploadToIPFS` não existia | ✅ Adicionada com suporte completo Pinata |
| `registrar/route.ts` | Importação quebrada | ✅ Corrigido com todas as funções necessárias |
| `package.json` | Faltava `axios` | ✅ Adicionado `axios: ^1.6.0` |

---

## ⚠️ AVISOS IGNORÁVEIS

Estes avisos podem aparecer mas NÃO impedem o build:

```
Module not found: Can't resolve 'pino-pretty'
```

São warnings do WalletConnect e podem ser ignorados.

---

**Após aplicar essa correção, o build DEVE passar! 🚀**
