import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, transactionId } = body;

    console.log('🔍 Verificando hash:', txHash);

    if (!txHash) {
      return NextResponse.json({ verified: false, message: 'Hash não informado' }, { status: 400 });
    }

    // Limpar o hash (remover espaços, garantir formato correto)
    const cleanHash = txHash.trim().toLowerCase();
    
    if (!cleanHash.startsWith('0x') || cleanHash.length < 64) {
      return NextResponse.json({ 
        verified: false, 
        message: 'Formato de hash inválido. O hash deve começar com 0x' 
      }, { status: 400 });
    }

    // Buscar carteira de recebimento das configurações
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('crypto_wallet_address')
      .single();

    const wallet = settings?.crypto_wallet_address;
    if (!wallet) {
      return NextResponse.json({ verified: false, message: 'Carteira não configurada' }, { status: 400 });
    }

    const walletLower = wallet.toLowerCase();
    console.log('📍 Carteira configurada:', wallet);

    // MÉTODO 1: Buscar nas transações nativas (MATIC/POL)
    console.log('🔎 Buscando em transações nativas...');
    const nativeResponse = await fetch(
      `https://api.polygonscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const nativeData = await nativeResponse.json();

    if (nativeData.result && Array.isArray(nativeData.result)) {
      console.log(`📊 ${nativeData.result.length} transações nativas encontradas`);
      
      for (const tx of nativeData.result) {
        if (tx.hash.toLowerCase() === cleanHash) {
          console.log('✅ Hash encontrado em transações nativas!');
          
          // Verificar se a transação falhou
          if (tx.isError === '1') {
            return NextResponse.json({ 
              verified: false, 
              message: 'Esta transação falhou na blockchain' 
            });
          }

          // Verificar se é para nossa carteira (recebimento)
          if (tx.to?.toLowerCase() !== walletLower) {
            return NextResponse.json({ 
              verified: false, 
              message: 'Esta transação não foi enviada para nossa carteira' 
            });
          }

          const value = parseFloat(tx.value) / 1e18;
          
          // Transação válida! Atualizar banco
          if (transactionId) {
            await supabase
              .from('transactions')
              .update({
                payment_status: 'completed',
                tx_hash: tx.hash,
                notes: `Pagamento MATIC/POL confirmado. Valor: ${value.toFixed(6)}`,
                verified_at: new Date().toISOString(),
              })
              .eq('id', transactionId);
            console.log('💾 Transação atualizada no banco');
          }

          return NextResponse.json({
            verified: true,
            found: true,
            transaction: {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: value,
              token: 'MATIC',
              timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            },
            polygonscan_url: `https://polygonscan.com/tx/${tx.hash}`,
            message: 'Pagamento verificado com sucesso!',
          });
        }
      }
    }

    // MÉTODO 2: Buscar nas transações de tokens ERC-20
    console.log('🔎 Buscando em transações de tokens...');
    const tokenResponse = await fetch(
      `https://api.polygonscan.com/api?module=account&action=tokentx&address=${wallet}&startblock=0&endblock=100000000&page=1&offset=100&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.result && Array.isArray(tokenData.result)) {
      console.log(`📊 ${tokenData.result.length} transações de tokens encontradas`);
      
      for (const tx of tokenData.result) {
        if (tx.hash.toLowerCase() === cleanHash) {
          console.log('✅ Hash encontrado em transações de tokens!');
          
          // Verificar se é para nossa carteira
          if (tx.to?.toLowerCase() !== walletLower) {
            return NextResponse.json({ 
              verified: false, 
              message: 'Esta transação não foi enviada para nossa carteira' 
            });
          }

          const decimals = parseInt(tx.tokenDecimal) || 18;
          const value = parseFloat(tx.value) / Math.pow(10, decimals);
          
          // Transação válida! Atualizar banco
          if (transactionId) {
            await supabase
              .from('transactions')
              .update({
                payment_status: 'completed',
                tx_hash: tx.hash,
                notes: `Pagamento ${tx.tokenSymbol} confirmado. Valor: ${value.toFixed(2)}`,
                verified_at: new Date().toISOString(),
              })
              .eq('id', transactionId);
            console.log('💾 Transação atualizada no banco');
          }

          return NextResponse.json({
            verified: true,
            found: true,
            transaction: {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: value,
              token: tx.tokenSymbol,
              timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            },
            polygonscan_url: `https://polygonscan.com/tx/${tx.hash}`,
            message: 'Pagamento verificado com sucesso!',
          });
        }
      }
    }

    // Não encontrou - pode ser transação muito recente
    console.log('❌ Hash não encontrado nas transações');
    return NextResponse.json({
      verified: false,
      found: false,
      message: 'Transação não encontrada. Se você acabou de enviar, aguarde 1-2 minutos e tente novamente.',
      debug: {
        hashBuscado: cleanHash,
        carteira: wallet,
        transacoesNativas: nativeData.result?.length || 0,
        transacoesTokens: tokenData.result?.length || 0,
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar crypto:', error);
    return NextResponse.json(
      { verified: false, error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}

// GET para listar transações recentes (para debug)
export async function GET(request: NextRequest) {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('crypto_wallet_address')
      .single();

    const wallet = settings?.crypto_wallet_address;
    if (!wallet) {
      return NextResponse.json({ error: 'Carteira não configurada' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.polygonscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const data = await response.json();

    const walletLower = wallet.toLowerCase();
    const transactions = (data.result || [])
      .filter((tx: any) => tx.to?.toLowerCase() === walletLower && tx.isError === '0')
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        value: (parseFloat(tx.value) / 1e18).toFixed(6),
        token: 'MATIC',
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      }));

    return NextResponse.json({ wallet, transactions, total: transactions.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
