import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';

// Tokens conhecidos
const TOKENS: { [key: string]: { decimals: number } } = {
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { decimals: 6 }, // USDT
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { decimals: 6 }, // USDC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { decimals: 18 }, // DAI
};

export async function POST(request: NextRequest) {
  try {
    // Buscar carteira de recebimento
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('crypto_wallet_address')
      .single();

    const wallet = settings?.crypto_wallet_address;
    if (!wallet) {
      return NextResponse.json({ error: 'Carteira não configurada' }, { status: 400 });
    }

    // Buscar transações pendentes de crypto
    const { data: pendingTx } = await supabase
      .from('transactions')
      .select(`
        *,
        projects (id, name, token_id, asset_type, location, available_supply, total_credits),
        users:user_id (id, full_name, email, cpf_cnpj, company_name)
      `)
      .eq('payment_status', 'pending')
      .eq('type', 'crypto')
      .order('created_at', { ascending: false });

    if (!pendingTx || pendingTx.length === 0) {
      return NextResponse.json({ verified: 0, message: 'Nenhuma transação pendente' });
    }

    // Buscar transações recentes na carteira (MATIC nativo)
    const nativeResponse = await fetch(
      `https://api.polygonscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const nativeData = await nativeResponse.json();

    // Buscar transações de tokens
    const tokenResponse = await fetch(
      `https://api.polygonscan.com/api?module=account&action=tokentx&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const tokenData = await tokenResponse.json();

    // Criar mapa de transações recebidas (últimas 24h)
    const receivedTx: Map<string, any> = new Map();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Processar transações nativas
    if (nativeData.result && Array.isArray(nativeData.result)) {
      for (const tx of nativeData.result) {
        const txTime = parseInt(tx.timeStamp) * 1000;
        if (txTime > oneDayAgo && 
            tx.to?.toLowerCase() === wallet.toLowerCase() && 
            tx.isError === '0') {
          const value = parseFloat(tx.value) / 1e18;
          receivedTx.set(tx.hash.toLowerCase(), {
            hash: tx.hash,
            from: tx.from,
            value: value,
            valueUSD: value * 0.85, // Cotação aproximada MATIC
            token: 'MATIC',
            timestamp: txTime,
          });
        }
      }
    }

    // Processar transações de tokens
    if (tokenData.result && Array.isArray(tokenData.result)) {
      for (const tx of tokenData.result) {
        const txTime = parseInt(tx.timeStamp) * 1000;
        if (txTime > oneDayAgo && tx.to?.toLowerCase() === wallet.toLowerCase()) {
          const tokenInfo = TOKENS[tx.contractAddress.toLowerCase()];
          const decimals = tokenInfo?.decimals || parseInt(tx.tokenDecimal) || 18;
          const value = parseFloat(tx.value) / Math.pow(10, decimals);
          receivedTx.set(tx.hash.toLowerCase(), {
            hash: tx.hash,
            from: tx.from,
            value: value,
            valueUSD: value, // Stablecoins = 1 USD
            token: tx.tokenSymbol,
            timestamp: txTime,
          });
        }
      }
    }

    console.log(`📊 ${receivedTx.size} transações recebidas nas últimas 24h`);
    console.log(`📋 ${pendingTx.length} transações pendentes para verificar`);

    let verified = 0;
    const verifiedTransactions: any[] = [];

    // Para cada transação pendente, tentar encontrar match
    for (const pending of pendingTx) {
      const expectedUSD = pending.price_total / 5.5; // Converter BRL para USD
      const tolerance = 0.02; // 2% de tolerância

      // Procurar transação que bate com o valor
      const entries = Array.from(receivedTx.entries());
      for (const [hash, received] of entries) {
        // Verificar se valor está dentro da tolerância
        const diff = Math.abs(received.valueUSD - expectedUSD) / expectedUSD;
        
        if (diff <= tolerance) {
          console.log(`✅ Match encontrado! Pendente: $${expectedUSD.toFixed(2)}, Recebido: $${received.valueUSD.toFixed(2)} (${received.token})`);
          
          // Atualizar transação como confirmada
          await supabase
            .from('transactions')
            .update({
              payment_status: 'completed',
              tx_hash: received.hash,
              notes: `Verificado automaticamente. ${received.value} ${received.token} recebido.`,
              verified_manually: false,
              verified_at: new Date().toISOString(),
            })
            .eq('id', pending.id);

          // Gerar certificado se tiver dados necessários
          if (pending.projects && pending.users) {
            const certCode = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            
            await supabase.from('certificates').insert({
              transaction_id: pending.id,
              project_id: pending.projects.id,
              user_id: pending.users.id,
              certificate_code: certCode,
              holder_name: pending.users.full_name || pending.buyer_name,
              holder_cpf_cnpj: pending.users.cpf_cnpj || pending.buyer_cpf_cnpj,
              holder_company: pending.users.company_name,
              token_amount: pending.amount,
              token_type: pending.projects.asset_type || 'CARBON',
              project_name: pending.projects.name,
              project_location: pending.projects.location,
              tx_hash: received.hash,
              issue_date: new Date().toISOString(),
              qr_code_data: `https://token.ibedis.com.br/verificar?code=${certCode}`,
              status: 'active',
            });

            // Atualizar supply do projeto
            const newSupply = Math.max(0, (pending.projects.available_supply || pending.projects.total_credits || 0) - pending.amount);
            await supabase
              .from('projects')
              .update({ available_supply: newSupply })
              .eq('id', pending.projects.id);

            console.log(`📜 Certificado gerado: ${certCode}`);
          }

          verified++;
          verifiedTransactions.push({
            transactionId: pending.id,
            txHash: received.hash,
            value: received.value,
            token: received.token,
          });

          // Remover do mapa para não usar novamente
          receivedTx.delete(hash);
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      verified,
      pending: pendingTx.length,
      received: receivedTx.size + verified,
      transactions: verifiedTransactions,
    });

  } catch (error: any) {
    console.error('Erro na verificação automática:', error);
    return NextResponse.json(
      { error: error.message || 'Erro na verificação' },
      { status: 500 }
    );
  }
}
