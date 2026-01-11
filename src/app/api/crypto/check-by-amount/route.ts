import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';

/**
 * Verificação automática por valor único
 * Cada pedido tem um valor com centavos únicos (ex: 0.213904)
 * O sistema busca transações com esse valor exato
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      transactionId,      // ID da transação no banco
      expectedAmount,     // Valor exato esperado (ex: 0.213904)
      token,              // Token (MATIC, USDT, etc)
    } = body;

    console.log('🔍 Verificando pagamento por valor único');
    console.log(`💰 Valor esperado: ${expectedAmount} ${token}`);

    if (!transactionId || !expectedAmount) {
      return NextResponse.json({ 
        found: false, 
        message: 'Dados incompletos' 
      }, { status: 400 });
    }

    // Buscar carteira de recebimento
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('crypto_wallet_address')
      .single();

    const wallet = settings?.crypto_wallet_address;
    if (!wallet) {
      return NextResponse.json({ found: false, message: 'Carteira não configurada' }, { status: 400 });
    }

    const walletLower = wallet.toLowerCase();

    // Buscar transações recentes (últimas 100)
    let transactions: any[] = [];

    // Para MATIC/POL nativo
    if (token === 'MATIC' || token === 'POL') {
      const response = await fetch(
        `https://api.polygonscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
      );
      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        for (const tx of data.result) {
          // Apenas transações recebidas e bem sucedidas
          if (tx.to?.toLowerCase() === walletLower && tx.isError === '0') {
            const value = parseFloat(tx.value) / 1e18;
            transactions.push({
              hash: tx.hash,
              value: value,
              token: 'MATIC',
              timestamp: parseInt(tx.timeStamp),
              from: tx.from,
            });
          }
        }
      }
    }

    // Para tokens ERC-20 (USDT, USDC, DAI)
    if (token === 'USDT' || token === 'USDC' || token === 'DAI') {
      const response = await fetch(
        `https://api.polygonscan.com/api?module=account&action=tokentx&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
      );
      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        for (const tx of data.result) {
          // Apenas transações recebidas
          if (tx.to?.toLowerCase() === walletLower) {
            const decimals = parseInt(tx.tokenDecimal) || 18;
            const value = parseFloat(tx.value) / Math.pow(10, decimals);
            
            // Filtrar pelo token correto
            if (tx.tokenSymbol === token || 
                (token === 'USDT' && tx.tokenSymbol?.includes('USDT')) ||
                (token === 'USDC' && tx.tokenSymbol?.includes('USDC'))) {
              transactions.push({
                hash: tx.hash,
                value: value,
                token: tx.tokenSymbol,
                timestamp: parseInt(tx.timeStamp),
                from: tx.from,
              });
            }
          }
        }
      }
    }

    console.log(`📊 ${transactions.length} transações encontradas para análise`);

    // Buscar transação com valor EXATO (tolerância de 0.0001%)
    const expectedValue = parseFloat(expectedAmount);
    const tolerance = 0.000001; // Tolerância mínima para floating point

    for (const tx of transactions) {
      const diff = Math.abs(tx.value - expectedValue);
      
      console.log(`  Comparando: ${tx.value} vs ${expectedValue} (diff: ${diff})`);
      
      if (diff < tolerance || diff / expectedValue < 0.0001) {
        // ENCONTROU! Valor exato
        console.log(`✅ MATCH! Hash: ${tx.hash}`);

        // Verificar se essa transação já foi usada em outro pedido
        const { data: existingTx } = await supabase
          .from('transactions')
          .select('id')
          .eq('tx_hash', tx.hash)
          .neq('id', transactionId)
          .single();

        if (existingTx) {
          console.log('⚠️ Esta transação já foi usada em outro pedido');
          continue; // Pular e continuar buscando
        }

        // Atualizar transação no banco
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            payment_status: 'completed',
            tx_hash: tx.hash,
            verified_at: new Date().toISOString(),
            notes: `Pagamento ${tx.token} confirmado automaticamente. Valor: ${tx.value}`,
          })
          .eq('id', transactionId);

        if (updateError) {
          console.error('Erro ao atualizar transação:', updateError);
        }

        return NextResponse.json({
          found: true,
          verified: true,
          transaction: {
            hash: tx.hash,
            value: tx.value,
            token: tx.token,
            from: tx.from,
            timestamp: new Date(tx.timestamp * 1000).toISOString(),
          },
          polygonscan_url: `https://polygonscan.com/tx/${tx.hash}`,
          message: 'Pagamento confirmado automaticamente!',
        });
      }
    }

    // Não encontrou
    return NextResponse.json({
      found: false,
      message: 'Aguardando pagamento...',
      debug: {
        expectedValue,
        token,
        transactionsChecked: transactions.length,
      }
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
