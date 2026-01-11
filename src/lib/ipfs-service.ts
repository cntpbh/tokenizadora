// src/lib/ipfs-service.ts
const PINATA_JWT = process.env.PINATA_JWT || '';

interface IPFSResult {
  success: boolean;
  ipfsHash?: string;
  gatewayUrl?: string;
  error?: string;
}

export async function uploadToPinata(
  file: File,
  metadata?: Record<string, string>
): Promise<IPFSResult> {
  if (!PINATA_JWT) return { success: false, error: 'PINATA_JWT não configurado' };

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({ 
      name: file.name, 
      keyvalues: metadata || {} 
    }));

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
      body: formData,
    });

    if (!res.ok) return { success: false, error: `Pinata: ${res.status}` };
    const data = await res.json();
    return { success: true, ipfsHash: data.IpfsHash, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function uploadJSONToPinata(jsonData: any, name: string): Promise<IPFSResult> {
  if (!PINATA_JWT) return { success: false, error: 'PINATA_JWT não configurado' };

  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinataContent: jsonData, pinataMetadata: { name } }),
    });

    if (!res.ok) return { success: false, error: `Pinata: ${res.status}` };
    const data = await res.json();
    return { success: true, ipfsHash: data.IpfsHash, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export const isIPFSConfigured = () => !!PINATA_JWT;
export const getIPFSUrl = (hash: string) => hash ? `https://gateway.pinata.cloud/ipfs/${hash.replace('ipfs://', '')}` : '';
