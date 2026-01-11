# ✅ CHECKLIST DE CORREÇÕES - IBEDIS TOKEN PLATFORM

**Data**: 10/01/2026  
**Status**: Arquivos corrigidos, aguardando deploy

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. Erro de Build - `storage-service.ts`
**Erro**: `Type error: 'error' is of type 'unknown'` + `catch` duplicado  
**Status**: ✅ CORRIGIDO  
**Arquivo**: `src/lib/storage-service.ts`

### 2. Sistema de Email
**Problema**: Emails não estão sendo enviados  
**Status**: ✅ CORRIGIDO  
**Arquivos criados**:
- `src/lib/email-service.ts` - Novo serviço de email robusto
- `src/lib/config.ts` - Configurações centralizadas

### 3. Preço de Registro Hardcoded
**Problema**: Preço R$ 4.90 estava fixo no código  
**Status**: ✅ CORRIGIDO  
**Solução**: Preço agora vem do banco de dados via `document_registry_config`

### 4. Erro "Unexpected end of JSON input"
**Causa**: API retornando resposta vazia/inválida  
**Status**: ⚠️ VERIFICAR APÓS DEPLOY  
**Possíveis causas**:
- Configuração do Supabase incorreta
- Variáveis de ambiente faltando
- Erro na API de PIX

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/lib/storage-service.ts` | ✅ Corrigido - tipos e catch duplicado |
| `src/lib/config.ts` | ✅ Novo - configurações centralizadas |
| `src/lib/email-service.ts` | ✅ Novo - serviço de email |
| `src/app/api/config/route.ts` | ✅ Novo - API de configurações |
| `sql/02-config-setup.sql` | ✅ Novo - setup do banco |
| `README.md` | ✅ Atualizado - documentação completa |
| `.env.example` | ✅ Atualizado - variáveis de email |

---

## 🚀 PRÓXIMOS PASSOS

### PASSO 1: Atualizar Código no GitHub
```bash
# Na pasta do projeto
git add .
git commit -m "fix: corrigido storage-service.ts e adicionado sistema de email"
git push origin main
```

### PASSO 2: Verificar Variáveis no Vercel
Acesse: **Vercel > Settings > Environment Variables**

Confirme que existem:
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `MERCADOPAGO_ACCESS_TOKEN`
- [ ] `RESEND_API_KEY` ← **ADICIONAR SE FALTANDO**
- [ ] `EMAIL_FROM_ADDRESS` ← **OPCIONAL**

### PASSO 3: Executar SQL no Supabase
1. Acesse **Supabase > SQL Editor**
2. Execute o conteúdo de `sql/02-config-setup.sql`
3. Verifique se as tabelas foram criadas:
```sql
SELECT * FROM v_platform_config;
```

### PASSO 4: Configurar Preço no Banco
```sql
-- Alterar preço do registro de documento
UPDATE document_registry_config 
SET config_value = '{"price": 4.90, "currency": "BRL"}'::jsonb
WHERE config_key = 'price_pix';
```

### PASSO 5: Configurar Email no Banco
```sql
UPDATE platform_settings 
SET 
  email_api_key = 'sua-api-key-resend',
  email_from_address = 'noreply@ibedis.org',
  email_from_name = 'IBEDIS Token'
WHERE id = (SELECT id FROM platform_settings LIMIT 1);
```

### PASSO 6: Testar
1. Acesse: `https://token.ibedis.com.br/registro-documentos/registrar`
2. Faça um registro teste
3. Verifique se o PIX é gerado
4. Verifique se o email é enviado

---

## 🔍 DIAGNÓSTICO DO ERRO "Unexpected end of JSON input"

Este erro na tela indica que a API não está retornando JSON válido.

### Verificar:

1. **Logs no Vercel**
   - Acesse Vercel > Deployments > Functions
   - Procure erros em `/api/documentos/criar-pix`

2. **Testar API diretamente**
```bash
curl -X POST https://token.ibedis.com.br/api/documentos/criar-pix \
  -H "Content-Type: application/json" \
  -d '{"hash":"test","titulo":"Teste","nome":"Teste","email":"teste@teste.com","preco":4.90}'
```

3. **Verificar Mercado Pago**
   - Token válido?
   - Conta ativa?

---

## 📊 ESTRUTURA DE CONFIGURAÇÕES

```
┌─────────────────────────────────────────┐
│           CONFIGURAÇÕES                  │
├─────────────────────────────────────────┤
│                                         │
│  src/lib/config.ts                      │
│  ├── DEFAULT_PRICES (hardcoded backup)  │
│  ├── DEFAULT_LIMITS                     │
│  ├── PAYMENT_CONFIG                     │
│  └── EMAIL_CONFIG                       │
│                                         │
│           ↓ sobrescreve ↓               │
│                                         │
│  Banco de Dados (Supabase)              │
│  ├── platform_settings                  │
│  ├── document_registry_config           │
│  ├── referral_settings                  │
│  └── withdrawal_settings                │
│                                         │
│           ↓ sobrescreve ↓               │
│                                         │
│  Variáveis de Ambiente (.env)           │
│  └── Para secrets (API keys)            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📧 FLUXO DE EMAIL

```
1. Usuário registra documento
      ↓
2. API /documentos/criar-pix
      ↓
3. Pagamento confirmado (webhook)
      ↓
4. sendDocumentRegistrationEmail()
      ↓
5. lib/email-service.ts
      ↓
6. Busca config do banco (platform_settings)
      ↓
7. Envia via Resend/SendGrid
      ↓
8. Loga em email_logs
```

---

## ⚠️ ATENÇÃO

### Não funciona sem:
1. `SUPABASE_SERVICE_ROLE_KEY` - para APIs de servidor
2. `MERCADOPAGO_ACCESS_TOKEN` - para gerar PIX
3. `RESEND_API_KEY` - para enviar emails

### Testar localmente:
```bash
npm run dev
# Acesse http://localhost:3000
```

---

## 📞 Suporte

Se o erro persistir após seguir todos os passos:

1. Verifique logs no Vercel
2. Verifique console do browser (F12)
3. Teste APIs individualmente
4. Contate: marinho@ibedis.org

---

**Última atualização**: 10/01/2026 19:15 UTC
