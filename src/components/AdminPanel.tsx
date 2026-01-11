'use client';

import { useState } from 'react';
import { useContract, useAddress } from "@thirdweb-dev/react";
import { 
  Sparkles, AlertTriangle, CheckCircle, Loader2, ExternalLink,
  FileText, MapPin, Building, Hash, Image, Video, Link2
} from 'lucide-react';
import { createProject } from '@/lib/supabase';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Categorias atualizadas
const ASSET_TYPES = [
  { value: 'CARBON_REDD', label: '🌳 REDD+ (Desmatamento Evitado)', description: 'Créditos de carbono de projetos de redução de emissões por desmatamento' },
  { value: 'CARBON_FOREST', label: '🌲 Carbono Florestal', description: 'Créditos de projetos de reflorestamento e manejo florestal' },
  { value: 'CARBON_BLUE', label: '🌊 Carbono Azul', description: 'Créditos de ecossistemas costeiros e marinhos' },
  { value: 'CPR_VERDE', label: '🌾 CPR Verde', description: 'Cédula de Produto Rural Verde - financiamento sustentável' },
  { value: 'CONTRACT_ESG', label: '📋 Contrato ESG', description: 'Contratos e compromissos de governança ambiental e social' },
  { value: 'CONTRACT_VISIA', label: '📊 Metodologia VISIA', description: 'Projetos avaliados pela metodologia VISIA IBEDIS' },
  { value: 'CONTRACT_PVPE', label: '🤝 PVPE Voluntariado', description: 'Programa de Voluntariado Profissional Pro Bono Empresarial' },
  { value: 'RENEWABLE_ENERGY', label: '⚡ Energia Renovável', description: 'Créditos de projetos de energia limpa' },
  { value: 'WASTE_MANAGEMENT', label: '♻️ Gestão de Resíduos', description: 'Projetos de economia circular e reciclagem' },
  { value: 'WATER_CONSERVATION', label: '💧 Conservação de Água', description: 'Projetos de proteção de recursos hídricos' },
  { value: 'BIODIVERSITY', label: '🦋 Biodiversidade', description: 'Projetos de proteção de fauna e flora' },
  { value: 'SOCIAL_IMPACT', label: '👥 Impacto Social', description: 'Projetos com foco em desenvolvimento comunitário' },
  { value: 'OTHER', label: '📦 Outro', description: 'Outros tipos de ativos sustentáveis' },
];

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    asset_type: 'CARBON_REDD',
    location: '',
    owner_name: '',
    owner_wallet: '',
    total_credits: 1000,
    price_brl: 50,
    min_purchase: 1,
    min_purchase_reason: '',
    isin: '',
    image_url: '',
    video_url: '',
    document_url: '',
    institution_name: '',
    institution_description: '',
    institution_url: '',
  });

  const address = useAddress();
  const { contract } = useContract(CONTRACT_ADDRESS, "edition");

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!form.name) return 'Nome do projeto é obrigatório';
    if (!form.description) return 'Descrição é obrigatória';
    if (!form.location) return 'Localização é obrigatória';
    if (form.total_credits < 1) return 'Quantidade deve ser maior que 0';
    if (form.price_brl < 0.01) return 'Preço deve ser maior que R$ 0,01';
    return null;
  };

  const handleMint = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Verificar se carteira está conectada
    if (!address) {
      setError('Conecte sua carteira primeiro');
      return;
    }

    // Verificar se contrato está disponível
    if (!contract) {
      setError('Contrato não encontrado. Aguarde o carregamento ou recarregue a página.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🚀 Iniciando mint...');
      console.log('📋 Contrato:', CONTRACT_ADDRESS);
      console.log('👛 Carteira:', address);
      
      // Preparar metadata
      const metadata = {
        name: form.name,
        description: form.description,
        image: form.image_url || `https://via.placeholder.com/400x400/059669/ffffff?text=${encodeURIComponent(form.name)}`,
        properties: {
          type: form.asset_type,
          location: form.location,
          price_brl: form.price_brl,
          isin: form.isin,
          owner: form.owner_name,
          video_url: form.video_url,
          document_url: form.document_url,
          institution_name: form.institution_name,
          institution_url: form.institution_url,
        }
      };

      console.log('📝 Metadata:', metadata);
      console.log('🔢 Supply:', form.total_credits);

      let tx: any;
      let txHash: string | undefined;
      let tokenId: number | undefined;

      // Tentar mint via erc1155
      try {
        console.log('⏳ Chamando contract.erc1155.mint...');
        console.log('📋 Contract object:', contract);
        console.log('📋 Contract.erc1155:', contract.erc1155);
        
        // Verificar se erc1155 existe
        if (!contract.erc1155) {
          console.log('❌ contract.erc1155 não existe, tentando mintTo...');
          
          // Tentar método alternativo
          tx = await contract.call('mintTo', [
            address,
            form.total_credits,
            JSON.stringify(metadata),
            0 // tokenId auto
          ]);
        } else {
          tx = await contract.erc1155.mint({
            metadata,
            supply: form.total_credits,
          });
        }

        console.log('✅ Resposta do mint:', tx);

      } catch (mintError: any) {
        console.error('❌ Erro detalhado no mint:', mintError);
        console.error('❌ Erro message:', mintError.message);
        console.error('❌ Erro code:', mintError.code);
        console.error('❌ Erro data:', mintError.data);
        
        // Verificar se foi cancelado pelo usuário
        if (mintError.message?.includes('user rejected') || 
            mintError.message?.includes('User denied') ||
            mintError.code === 4001) {
          throw new Error('Transação cancelada pelo usuário');
        }
        
        // Verificar se é erro de gas
        if (mintError.message?.includes('insufficient funds') || 
            mintError.message?.includes('gas')) {
          throw new Error('Saldo de MATIC insuficiente para pagar o gas');
        }

        // Erro de execução no contrato
        if (mintError.message?.includes('execution reverted')) {
          throw new Error('Erro no contrato: ' + (mintError.reason || mintError.message));
        }

        throw mintError;
      }

      // Extrair dados da transação
      if (tx?.receipt) {
        txHash = tx.receipt.transactionHash;
        console.log('📜 Receipt:', tx.receipt);
      } else if (tx?.hash) {
        txHash = tx.hash;
      } else if (typeof tx === 'string') {
        txHash = tx;
      }

      if (tx?.id !== undefined) {
        tokenId = typeof tx.id === 'number' ? tx.id : (tx.id.toNumber?.() ?? parseInt(tx.id));
      }

      // Se não conseguiu o tokenId, usar timestamp
      if (!tokenId) {
        console.log('⚠️ TokenId não encontrado, usando timestamp');
        tokenId = Math.floor(Date.now() / 1000);
      }

      console.log('🎫 Token ID:', tokenId);
      console.log('🔗 TX Hash:', txHash);

      // Salvar no Supabase
      console.log('💾 Salvando no Supabase...');
      
      await createProject({
        token_id: tokenId || Date.now(),
        contract_address: CONTRACT_ADDRESS,
        name: form.name,
        description: form.description,
        asset_type: form.asset_type,
        owner_name: form.owner_name,
        owner_wallet: form.owner_wallet || address,
        location: form.location,
        total_credits: form.total_credits,
        available_credits: form.total_credits,
        price_brl: form.price_brl,
        min_purchase: form.min_purchase || 1,
        min_purchase_reason: form.min_purchase_reason || '',
        isin: form.isin,
        image_url: form.image_url,
        video_url: form.video_url,
        document_url: form.document_url,
        institution_name: form.institution_name,
        institution_description: form.institution_description,
        institution_url: form.institution_url,
        tx_hash: txHash || `pending-${Date.now()}`,
        status: 'active',
      });

      console.log('✅ Projeto salvo no Supabase!');

      setSuccess(`Token #${tokenId} criado com sucesso! TX: ${txHash?.slice(0, 10)}...`);
      
      // Limpar formulário
      setForm({
        name: '',
        description: '',
        asset_type: 'CARBON_REDD',
        location: '',
        owner_name: '',
        owner_wallet: '',
        total_credits: 1000,
        price_brl: 50,
        min_purchase: 1,
        min_purchase_reason: '',
        isin: '',
        image_url: '',
        video_url: '',
        document_url: '',
        institution_name: '',
        institution_description: '',
        institution_url: '',
      });

    } catch (err: any) {
      console.error('❌ Erro ao mintar:', err);
      
      // Mensagens de erro específicas
      if (err.message?.includes('user rejected')) {
        setError('Transação cancelada pelo usuário');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Saldo de MATIC insuficiente para pagar o gas');
      } else if (err.message?.includes('network')) {
        setError('Erro de rede. Verifique se está conectado à Polygon');
      } else {
        setError(err.message || 'Erro ao criar token. Verifique o console.');
      }
    }

    setLoading(false);
  };

  const selectedType = ASSET_TYPES.find(t => t.value === form.asset_type);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="w-7 h-7 mr-3" />
            Tokenizar Novo Projeto
          </h2>
          <p className="text-emerald-200 mt-1">Crie tokens ERC-1155 na Polygon</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center text-emerald-700 mb-2">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
            <a
              href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 text-sm hover:underline flex items-center"
            >
              Ver no Polygonscan <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* SEÇÃO: Informações Básicas */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Projeto Amazônia Sustentável"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o projeto e seu impacto ambiental/social..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ativo *</label>
                <select
                  value={form.asset_type}
                  onChange={(e) => handleChange('asset_type', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {selectedType && (
                  <p className="text-xs text-gray-500 mt-1">{selectedType.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Ex: Amazonas, Brasil"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Proprietário */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-emerald-600" />
              Proprietário / Responsável
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Proprietário</label>
                <input
                  type="text"
                  value={form.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  placeholder="Nome ou razão social"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carteira do Proprietário</label>
                <input
                  type="text"
                  value={form.owner_wallet}
                  onChange={(e) => handleChange('owner_wallet', e.target.value)}
                  placeholder="0x... (opcional)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO: Valores */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2 text-emerald-600" />
              Valores e Quantidades
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Total *</label>
                <input
                  type="number"
                  value={form.total_credits}
                  onChange={(e) => handleChange('total_credits', parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço por Token (R$) *</label>
                <input
                  type="number"
                  value={form.price_brl}
                  onChange={(e) => handleChange('price_brl', parseFloat(e.target.value) || 0)}
                  min={0.01}
                  step={0.01}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Mínima para Compra
                </label>
                <input
                  type="number"
                  value={form.min_purchase}
                  onChange={(e) => handleChange('min_purchase', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo de tokens que o comprador deve adquirir
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISIN (opcional)</label>
                <input
                  type="text"
                  value={form.isin}
                  onChange={(e) => handleChange('isin', e.target.value)}
                  placeholder="Código ISIN"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Justificativa do mínimo */}
            {form.min_purchase > 1 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justificativa do Mínimo *
                </label>
                <input
                  type="text"
                  value={form.min_purchase_reason}
                  onChange={(e) => handleChange('min_purchase_reason', e.target.value)}
                  placeholder="Ex: Cada token = 1 hora de consultoria. Mínimo de 4h para execução do projeto."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Explique ao comprador por que existe uma quantidade mínima
                </p>
              </div>
            )}

            <div className="mt-4 bg-emerald-50 p-3 rounded-lg">
              <p className="text-sm text-emerald-700">
                💰 Valor Total: <strong>R$ {(form.total_credits * form.price_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                {form.min_purchase > 1 && (
                  <span className="ml-4">
                    📦 Pacote Mínimo: <strong>{form.min_purchase} tokens = R$ {(form.min_purchase * form.price_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* SEÇÃO: Mídia */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Image className="w-5 h-5 mr-2 text-emerald-600" />
              Mídia e Documentos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) => handleChange('video_url', e.target.value)}
                    placeholder="YouTube ou Vimeo"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Documento (PDF)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={form.document_url}
                    onChange={(e) => handleChange('document_url', e.target.value)}
                    placeholder="Link para documentação"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Instituição */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-emerald-600" />
              Instituição Responsável
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instituição</label>
                <input
                  type="text"
                  value={form.institution_name}
                  onChange={(e) => handleChange('institution_name', e.target.value)}
                  placeholder="Ex: IBEDIS"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site da Instituição</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={form.institution_url}
                    onChange={(e) => handleChange('institution_url', e.target.value)}
                    placeholder="https://ibedis.org.br"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Instituição</label>
                <textarea
                  value={form.institution_description}
                  onChange={(e) => handleChange('institution_description', e.target.value)}
                  placeholder="Breve descrição da instituição responsável..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Botão de Mint */}
          <div className="pt-4">
            {contract && address ? (
              <button
                onClick={handleMint}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando Token... (aguarde confirmação na carteira)
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    🪙 Criar Token na Blockchain
                  </span>
                )}
              </button>
            ) : !address ? (
              <button
                disabled
                className="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold cursor-not-allowed"
              >
                🔗 Conecte sua carteira para tokenizar
              </button>
            ) : (
              <button
                disabled
                className="w-full py-4 bg-yellow-100 text-yellow-700 rounded-xl font-bold cursor-not-allowed"
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                Carregando contrato...
              </button>
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center">
            Taxa de gas estimada: ~$0.05 MATIC • Polygon Mainnet
          </p>
        </div>
      </div>
    </div>
  );
}
