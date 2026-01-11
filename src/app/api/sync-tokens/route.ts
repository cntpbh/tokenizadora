import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x84B46522f2f512c3A21c4486C5391fac827bB5De';
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x4eB4954877e578A17Ca494622A9ce2eA4fbD8723';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ABI para balanceOf ERC-1155
const ERC1155_ABI = [
  {
    "inputs": [
      { "name": "account", "type": "address" },
      { "name": "id", "type": "uint256" }
    ],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function getTokenBalance(tokenId: number): Promise<number> {
  try {
    // Usar Polygon RPC público
    const rpcUrl = 'https://polygon-mainnet.g.alchemy.com/v2/demo';
    
    // Encode balanceOf(address,uint256)
    const functionSelector = '0x00fdd58e';
    const paddedAddress = ADMIN_WALLET.slice(2).toLowerCase().padStart(64, '0');
    const paddedTokenId = tokenId.toString(16).padStart(64, '0');
    const data = functionSelector + paddedAddress + paddedTokenId;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          { to: CONTRACT_ADDRESS, data },
          'latest'
        ],
        id: 1
      })
    });
    
    const result = await response.json();
    
    if (result.result && result.result !== '0x') {
      return parseInt(result.result, 16);
    }
    return 0;
  } catch (error) {
    console.error(`Erro ao buscar token ${tokenId}:`, error);
    return -1;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os projetos
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, nome, token_id, total_credits, available_supply')
      .order('token_id');
    
    if (error) throw error;
    
    const results = [];
    
    for (const project of projects || []) {
      if (project.token_id) {
        const blockchainBalance = await getTokenBalance(project.token_id);
        
        if (blockchainBalance >= 0) {
          // Atualizar no banco
          await supabase
            .from('projects')
            .update({ available_supply: blockchainBalance })
            .eq('id', project.id);
          
          results.push({
            nome: project.nome,
            token_id: project.token_id,
            blockchain_balance: blockchainBalance,
            previous_available: project.available_supply,
            updated: true
          });
        } else {
          results.push({
            nome: project.nome,
            token_id: project.token_id,
            error: 'Falha ao consultar blockchain',
            updated: false
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      contract: CONTRACT_ADDRESS,
      wallet: ADMIN_WALLET,
      projects: results
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Atualização manual de um projeto específico
  try {
    const body = await request.json();
    const { project_id, available_supply } = body;
    
    if (!project_id || available_supply === undefined) {
      return NextResponse.json(
        { error: 'project_id e available_supply são obrigatórios' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('projects')
      .update({ available_supply: available_supply })
      .eq('id', project_id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, updated: project_id });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
