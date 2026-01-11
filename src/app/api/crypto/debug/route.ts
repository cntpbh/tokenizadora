import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const POLYGONSCAN_API_KEY = '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';
const WALLET = '0x00334C9349b462b7a89C7e643732964D7CB3FAdf';

function weiToMatic(wei: string): number {
  return parseFloat(wei) / 1e18;
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  try {
    // API V2 unificada do Etherscan - chainid=137 é Polygon
    const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=txlist&address=${WALLET}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${POLYGONSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    let transacoes: any[] = [];
    let apiError = null;

    if (data.status === '1' && Array.isArray(data.result)) {
      transacoes = data.result
        .filter((tx: any) => tx.to?.toLowerCase() === WALLET.toLowerCase() && tx.isError === '0')
        .map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          value_matic: weiToMatic(tx.value),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString()
        }));
    } else {
      apiError = data.message || data.result || 'Erro desconhecido';
    }

    const { data: pedidos } = await supabase
      .from('transactions')
      .select('id, buyer_name, quantity, notes, created_at')
      .eq('payment_method', 'crypto')
      .eq('status', 'pending');

    const pedidosComValor = (pedidos || []).map(p => {
      let valor = null;
      if (p.notes) {
        const match = p.notes.match(/(\d+\.\d{4,})/);
        if (match) valor = parseFloat(match[1]);
      }
      return { ...p, valor_esperado_matic: valor };
    });

    return NextResponse.json({
      carteira: WALLET,
      api_version: 'V2 (Etherscan unified)',
      api_error: apiError,
      transacoesRecebidas: transacoes.slice(0, 10),
      pedidosPendentes: pedidosComValor,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
