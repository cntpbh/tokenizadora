import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Endereços dos tokens na Polygon Mainnet
const TOKEN_ADDRESSES = {
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
};

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Endereço da carteira é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do endereço
    if (!ethers.utils.isAddress(address)) {
      return NextResponse.json(
        { valid: false, error: 'Endereço inválido' },
        { status: 200 }
      );
    }

    // Usar Polygonscan API
    const apiKey = process.env.POLYGONSCAN_API_KEY || '1286U5MC3NZTTDP3YAVW2EVIKHNTR6YK5Z';
    
    // Buscar saldo de MATIC
    let maticBalance = '0';
    try {
      const maticResponse = await fetch(
        `https://api.polygonscan.com/api?module=account&action=balance&address=${address}&apikey=${apiKey}`
      );
      const maticData = await maticResponse.json();
      if (maticData.status === '1') {
        maticBalance = ethers.utils.formatEther(maticData.result);
      }
    } catch (e) {
      console.error('Erro ao buscar MATIC:', e);
    }

    // Buscar saldo de USDT
    let usdtBalance = '0';
    try {
      const usdtResponse = await fetch(
        `https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=${TOKEN_ADDRESSES.USDT}&address=${address}&tag=latest&apikey=${apiKey}`
      );
      const usdtData = await usdtResponse.json();
      if (usdtData.status === '1') {
        // USDT na Polygon tem 6 decimais
        usdtBalance = (parseFloat(usdtData.result) / 1e6).toFixed(2);
      }
    } catch (e) {
      console.error('Erro ao buscar USDT:', e);
    }

    // Buscar saldo de USDC
    let usdcBalance = '0';
    try {
      const usdcResponse = await fetch(
        `https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=${TOKEN_ADDRESSES.USDC}&address=${address}&tag=latest&apikey=${apiKey}`
      );
      const usdcData = await usdcResponse.json();
      if (usdcData.status === '1') {
        // USDC na Polygon tem 6 decimais
        usdcBalance = (parseFloat(usdcData.result) / 1e6).toFixed(2);
      }
    } catch (e) {
      console.error('Erro ao buscar USDC:', e);
    }

    // Buscar últimas transações recebidas
    let recentTransactions: any[] = [];
    try {
      const txResponse = await fetch(
        `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${apiKey}`
      );
      const txData = await txResponse.json();
      if (txData.status === '1' && txData.result) {
        recentTransactions = txData.result.slice(0, 5).map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          value: ethers.utils.formatEther(tx.value),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString('pt-BR'),
          isIncoming: tx.to.toLowerCase() === address.toLowerCase(),
        }));
      }
    } catch (e) {
      console.error('Erro ao buscar transações:', e);
    }

    return NextResponse.json({
      valid: true,
      address: address,
      network: 'Polygon Mainnet',
      balances: {
        MATIC: parseFloat(maticBalance).toFixed(4),
        USDT: usdtBalance,
        USDC: usdcBalance,
      },
      recentTransactions,
      explorerUrl: `https://polygonscan.com/address/${address}`,
    });

  } catch (error: any) {
    console.error('Erro ao verificar carteira:', error);
    
    return NextResponse.json({
      valid: true,
      address: '',
      network: 'Polygon Mainnet',
      balances: null,
      message: 'Não foi possível consultar saldos. Verifique sua conexão.',
      explorerUrl: `https://polygonscan.com/address/`,
      offline: true,
    });
  }
}
