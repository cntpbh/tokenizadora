# 🌱 IBEDIS Token Platform

**Plataforma de Tokenização de Ativos Sustentáveis**

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://typescriptlang.org/)
[![Polygon](https://img.shields.io/badge/Blockchain-Polygon-purple)](https://polygon.technology/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com/)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Deploy](#-deploy)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [APIs](#-apis)
- [Banco de Dados](#-banco-de-dados)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)

---

## 🎯 Visão Geral

A **IBEDIS Token Platform** é um marketplace para compra e registro de tokens de ativos sustentáveis (créditos de carbono, biodiversidade, água) com registro em blockchain Polygon e emissão de certificados.

### Principais Características

- 🏪 **Marketplace** de tokens de projetos sustentáveis
- 📜 **Registro de Documentos** em blockchain com certificado
- 💳 **Pagamentos** via PIX (Mercado Pago) e Crypto (MATIC/USDT/USDC)
- 🔗 **Blockchain** Polygon via Thirdweb
- 📧 **Emails** transacionais (Resend/SendGrid)
- 🎁 **Sistema de Indicações** com comissões
- 💰 **Carteira Digital** com saldo e saques

---

## ⚡ Funcionalidades

### Marketplace de Tokens
- Listagem de projetos sustentáveis
- Detalhes completos do projeto (vídeo, documentos, instituição)
- Compra via PIX ou Crypto
- Certificados PDF automáticos
- Verificação em blockchain (PolygonScan)

### Registro de Documentos
- Upload de PDF/JPG (até 10MB)
- Hash SHA-256 do documento
- Carimbo automático com QR Code
- Certificado de registro
- Verificação pública por código

### Sistema de Pagamentos
- **PIX**: Mercado Pago com QR Code
- **Crypto**: MATIC, USDT, USDC na Polygon
- Webhook de confirmação automática
- Verificação manual para admin

### Painel Administrativo
- Gerenciamento de projetos
- Gestão de transações
- Verificação de pagamentos
- Configurações de preços
- Logs de email

---

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Routes    │────▶│   Supabase      │
│   (Next.js)     │     │   (Next.js)     │     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐             │
         │              │   Mercado Pago  │             │
         │              │   (PIX)         │             │
         │              └─────────────────┘             │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Thirdweb      │────▶│   Polygon       │     │   Storage       │
│   (SDK)         │     │   (Blockchain)  │     │   (Supabase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta Mercado Pago (para PIX)
- Conta Thirdweb (para blockchain)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/ibedisict/ibedis-token-platform.git
cd ibedis-token-platform

# 2. Instale as dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute o servidor de desenvolvimento
npm run dev
```

---

## ⚙️ Configuração

### Variáveis de Ambiente (.env.local)

```env
# THIRDWEB (blockchain)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=seu-client-id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...endereco-do-contrato

# SUPABASE (banco de dados)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# MERCADO PAGO (PIX)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...

# EMAIL (Resend)
RESEND_API_KEY=re_...

# APP
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
NEXT_PUBLIC_ADMIN_WALLET=0x...sua-wallet
```

### Configuração no Banco de Dados

1. Execute o SQL de setup:
```sql
-- No Supabase SQL Editor
-- Execute: sql/01-storage-setup.sql
-- Execute: sql/02-config-setup.sql
```

2. Configure o preço de registro de documentos:
```sql
UPDATE document_registry_config 
SET config_value = '{"price": 9.90, "currency": "BRL"}'::jsonb
WHERE config_key = 'price_pix';
```

3. Configure o email:
```sql
UPDATE platform_settings 
SET 
  email_api_key = 'sua-resend-api-key',
  email_from_address = 'noreply@seudominio.com',
  email_from_name = 'Sua Plataforma'
WHERE id = (SELECT id FROM platform_settings LIMIT 1);
```

---

## 🌐 Deploy

### Vercel (Recomendado)

1. **Importe o repositório** no Vercel
2. **Configure as variáveis de ambiente** em Settings > Environment Variables
3. **Deploy** automático a cada push

### Variáveis necessárias no Vercel:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Client ID do Thirdweb |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Endereço do contrato |
| `MERCADOPAGO_ACCESS_TOKEN` | Token do Mercado Pago |
| `RESEND_API_KEY` | API Key do Resend |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação |
| `NEXT_PUBLIC_ADMIN_WALLET` | Wallet admin |

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── config/             # Configurações
│   │   ├── documentos/         # Registro de documentos
│   │   ├── mercadopago/        # Webhooks PIX
│   │   ├── crypto/             # Verificação crypto
│   │   ├── referral/           # Sistema de indicações
│   │   ├── wallet/             # Carteira digital
│   │   └── send-email/         # Envio de emails
│   ├── admin/                  # Painel administrativo
│   ├── registro-documentos/    # Registro de docs
│   ├── certificado-documento/  # Visualização certificado
│   ├── carteira/               # Carteira do usuário
│   ├── indicacoes/             # Programa de indicações
│   └── page.tsx                # Homepage/Marketplace
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── BuyModal.tsx
│   ├── AdminPanel.tsx
│   └── settings/               # Componentes de config
├── lib/
│   ├── config.ts               # Configurações centralizadas
│   ├── email-service.ts        # Serviço de email
│   ├── storage-service.ts      # Upload de arquivos
│   ├── document-stamper.ts     # Carimbo de documentos
│   ├── certificate-generator.ts # Geração de PDFs
│   └── supabase.ts             # Cliente Supabase
└── hooks/
    └── useReferral.ts          # Hook de indicações
```

---

## 🔌 APIs

### Configurações
- `GET /api/config` - Retorna configurações públicas

### Documentos
- `POST /api/documentos/criar-pix` - Cria registro com PIX
- `POST /api/documentos/register-with-stamp` - Registro com carimbo
- `GET /api/documentos/status/[id]` - Status do registro
- `POST /api/documentos/webhook-pix` - Webhook Mercado Pago

### Pagamentos
- `POST /api/mercadopago/create-pix` - Cria PIX para tokens
- `GET /api/mercadopago/check-payment/[id]` - Verifica pagamento
- `POST /api/crypto/verify-payment` - Verifica crypto

### Email
- `POST /api/send-email` - Envia email por template

### Carteira
- `GET /api/wallet/balance` - Saldo do usuário
- `POST /api/wallet/withdraw` - Solicitar saque

### Indicações
- `GET /api/referral/code` - Gera código de indicação
- `POST /api/referral/track` - Registra indicação
- `GET /api/referral/stats` - Estatísticas

---

## 🗄️ Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `projects` | Projetos sustentáveis |
| `transactions` | Compras de tokens |
| `document_registrations` | Registros de documentos |
| `certificates` | Certificados emitidos |
| `users` | Usuários da plataforma |
| `user_wallets` | Carteiras virtuais |
| `referral_codes` | Códigos de indicação |
| `referrals` | Indicações registradas |
| `platform_settings` | Configurações gerais |
| `document_registry_config` | Config de preços |
| `email_logs` | Logs de email |

### Views
- `v_platform_config` - Configurações consolidadas

---

## 🔧 Troubleshooting

### Build falha com erro em storage-service.ts
```
Type error: 'error' is of type 'unknown'
```
**Solução**: O arquivo `src/lib/storage-service.ts` foi corrigido. Certifique-se de usar a versão atualizada.

### Emails não estão sendo enviados
1. Verifique `RESEND_API_KEY` no Vercel
2. Verifique configurações no banco:
```sql
SELECT email_provider, email_api_key IS NOT NULL as has_key 
FROM platform_settings;
```

### Preço do documento não atualiza
1. Verifique a config no banco:
```sql
SELECT * FROM document_registry_config WHERE config_key = 'price_pix';
```
2. Atualize se necessário:
```sql
UPDATE document_registry_config 
SET config_value = '{"price": 4.90, "currency": "BRL"}'::jsonb
WHERE config_key = 'price_pix';
```

### PIX não gera
1. Verifique `MERCADOPAGO_ACCESS_TOKEN` no Vercel
2. Verifique logs no console
3. Teste a API diretamente

### Erro "Unexpected end of JSON input"
O frontend recebeu resposta vazia ou inválida. Verifique:
1. Logs da API no Vercel
2. Configuração do Supabase
3. Permissões RLS

---

## 🎯 Roadmap

### v1.0.4 (Próxima)
- [ ] Dashboard de métricas
- [ ] Notificações push
- [ ] Integração WhatsApp

### v1.1.0
- [ ] KYC automatizado
- [ ] Multi-idioma
- [ ] Painel do investidor

### v2.0.0
- [ ] NFTs de certificados
- [ ] Marketplace secundário
- [ ] API pública

---

## 📞 Suporte

- **Email**: marinho@ibedis.org
- **Site**: [ibedis.org](https://ibedis.org)
- **Plataforma**: [token.ibedis.com.br](https://token.ibedis.com.br)

---

## 📄 Licença

Proprietário - IBEDIS © 2024-2026

---

## 🎨 Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Petróleo | `#1a3f4d` | Principal |
| Dourado | `#b8963c` | Destaque |
| Verde | `#059669` | Sucesso |
| Vermelho | `#dc2626` | Erro |

---

**Versão**: 1.0.3  
**Última atualização**: Janeiro 2026
