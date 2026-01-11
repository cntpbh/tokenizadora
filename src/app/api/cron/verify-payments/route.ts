import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const POLYGONSCAN_API_KEY = '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';
const WALLET = '0x00334C9349b462b7a89C7e643732964D7CB3FAdf';

function weiToMatic(wei: string): number {
  return parseFloat(wei) / 1e18;
}

function extrairValorUnico(notes: string): number | null {
  if (!notes) return null;
  const match = notes.match(/(\d+\.?\d*)\s*MATIC/i);
  if (match) return parseFloat(match[1]);
  const numMatch = notes.match(/(\d+\.\d{4,})/);
  if (numMatch) return parseFloat(numMatch[1]);
  return null;
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  try {
    // API V2 unificada do Etherscan - chainid=137 é Polygon
    const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=txlist&address=${WALLET}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${POLYGONSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    let transacoes: any[] = [];
    if (data.status === '1' && Array.isArray(data.result)) {
      transacoes = data.result.filter((tx: any) => 
        tx.to?.toLowerCase() === WALLET.toLowerCase() && tx.isError === '0'
      );
    }

    const { data: pedidos } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_method', 'crypto')
      .eq('status', 'pending');

    const confirmados: any[] = [];

    for (const pedido of pedidos || []) {
      const valorEsperado = extrairValorUnico(pedido.notes);
      if (!valorEsperado) continue;

      const txMatch = transacoes.find(tx => {
        const valorRecebido = weiToMatic(tx.value);
        return Math.abs(valorRecebido - valorEsperado) < 0.000001;
      });

      if (txMatch) {
        await supabase.from('transactions').update({
          status: 'completed',
          tx_hash: txMatch.hash,
          completed_at: new Date().toISOString()
        }).eq('id', pedido.id);

        confirmados.push({ pedido_id: pedido.id, tx_hash: txMatch.hash });
      }
    }

    return NextResponse.json({ success: true, confirmados: confirmados.length, detalhes: confirmados });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
