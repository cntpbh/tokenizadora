import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';

export async function GET(request: NextRequest) {
  try {
    // Buscar carteira de recebimento das configurações
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('crypto_wallet_address')
      .single();

    const wallet = settings?.crypto_wallet_address;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Carteira de recebimento não configurada' },
        { status: 400 }
      );
    }

    // Buscar transações nativas (MATIC/POL) recebidas
    const nativeResponse = await fetch(
      `https://api.polygonscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const nativeData = await nativeResponse.json();

    // Buscar transações de tokens ERC-20 recebidas
    const tokenResponse = await fetch(
      `https://api.polygonscan.com/api?module=account&action=tokentx&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const tokenData = await tokenResponse.json();

    const transactions: any[] = [];
    const walletLower = wallet.toLowerCase();

    // Processar transações nativas (MATIC) - apenas recebidas
    if (nativeData.result && Array.isArray(nativeData.result)) {
      for (const tx of nativeData.result) {
        // Apenas transações recebidas (to = nossa carteira)
        if (tx.to?.toLowerCase() === walletLower && tx.isError === '0' && parseFloat(tx.value) > 0) {
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: parseFloat((parseFloat(tx.value) / 1e18).toFixed(6)),
            token: 'MATIC',
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            blockNumber: tx.blockNumber,
          });
        }
      }
    }

    // Processar transações de tokens - apenas recebidas
    if (tokenData.result && Array.isArray(tokenData.result)) {
      for (const tx of tokenData.result) {
        // Apenas transações recebidas (to = nossa carteira)
        if (tx.to?.toLowerCase() === walletLower) {
          const decimals = parseInt(tx.tokenDecimal) || 18;
          const value = parseFloat(tx.value) / Math.pow(10, decimals);
          
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: parseFloat(value.toFixed(decimals === 6 ? 2 : 6)),
            token: tx.tokenSymbol || 'TOKEN',
            tokenAddress: tx.contractAddress,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            blockNumber: tx.blockNumber,
          });
        }
      }
    }

    // Ordenar por timestamp (mais recente primeiro) e remover duplicados
    const uniqueTx = transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter((tx, idx, arr) => arr.findIndex(t => t.hash === tx.hash) === idx)
      .slice(0, 15);

    return NextResponse.json({
      wallet,
      transactions: uniqueTx,
      count: uniqueTx.length,
    });

  } catch (error: any) {
    console.error('Erro ao buscar transações recentes:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}
