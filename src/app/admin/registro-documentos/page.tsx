'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Save, Loader2, Check, AlertCircle, DollarSign, 
  Wallet, BarChart3, List, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ConfigItem {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
  is_active: boolean;
  updated_at: string;
}

export default function AdminRegistroDocumentosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  
  // Estados para edição
  const [priceSingle, setPriceSingle] = useState('29.90');
  const [priceProfessional, setPriceProfessional] = useState('199.00');
  const [priceEnterprise, setPriceEnterprise] = useState('499.00');
  const [docsProfessional, setDocsProfessional] = useState('10');
  const [docsEnterprise, setDocsEnterprise] = useState('50');
  
  const [pixKey, setPixKey] = useState('contato@ibedis.org');
  const [cryptoWallet, setCryptoWallet] = useState('0xc1b834C577C4E8e5173C4D7AaE5B1A69e4D0460C');
  
  const [statsDocuments, setStatsDocuments] = useState('1.234+');
  const [statsCompanies, setStatsCompanies] = useState('847');
  const [statsUptime, setStatsUptime] = useState('100%');
  const [statsVerification, setStatsVerification] = useState('24/7');

  const [featuresSingle, setFeaturesSingle] = useState<string[]>([]);
  const [featuresProfessional, setFeaturesProfessional] = useState<string[]>([]);
  const [featuresEnterprise, setFeaturesEnterprise] = useState<string[]>([]);

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('document_registry_config')
        .select('*')
        .order('config_key');

      if (error) throw error;

      if (data) {
        setConfigs(data);
        
        // Preencher estados com valores do banco
        data.forEach((config: ConfigItem) => {
          const value = config.config_value;
          
          switch (config.config_key) {
            case 'price_single':
              setPriceSingle(value.price?.toString() || '29.90');
              break;
            case 'price_professional':
              setPriceProfessional(value.price?.toString() || '199.00');
              setDocsProfessional(value.documents_per_month?.toString() || '10');
              break;
            case 'price_enterprise':
              setPriceEnterprise(value.price?.toString() || '499.00');
              setDocsEnterprise(value.documents_per_month?.toString() || '50');
              break;
            case 'pix_key':
              setPixKey(value.key || 'contato@ibedis.org');
              break;
            case 'crypto_wallet':
              setCryptoWallet(value.address || '');
              break;
            case 'stats':
              setStatsDocuments(value.documents_registered || '1.234+');
              setStatsCompanies(value.companies_served || '847');
              setStatsUptime(value.uptime || '100%');
              setStatsVerification(value.verification || '24/7');
              break;
            case 'plan_features_single':
              setFeaturesSingle(Array.isArray(value) ? value : []);
              break;
            case 'plan_features_professional':
              setFeaturesProfessional(Array.isArray(value) ? value : []);
              break;
            case 'plan_features_enterprise':
              setFeaturesEnterprise(Array.isArray(value) ? value : []);
              break;
          }
        });
      }
    } catch (err: any) {
      setError('Erro ao carregar configurações: ' + err.message);
    }
    
    setLoading(false);
  };

  const updateConfig = async (key: string, value: any) => {
    const { error } = await supabase
      .from('document_registry_config')
      .update({ config_value: value })
      .eq('config_key', key);

    if (error) throw error;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Salvar preços
      await updateConfig('price_single', {
        price: parseFloat(priceSingle),
        currency: 'BRL',
        label: 'por documento'
      });

      await updateConfig('price_professional', {
        price: parseFloat(priceProfessional),
        currency: 'BRL',
        label: 'por mês',
        documents_per_month: parseInt(docsProfessional)
      });

      await updateConfig('price_enterprise', {
        price: parseFloat(priceEnterprise),
        currency: 'BRL',
        label: 'por mês',
        documents_per_month: parseInt(docsEnterprise)
      });

      // Salvar PIX e Crypto
      await updateConfig('pix_key', {
        key: pixKey,
        type: pixKey.includes('@') ? 'email' : 'other'
      });

      await updateConfig('crypto_wallet', {
        address: cryptoWallet,
        network: 'polygon'
      });

      // Salvar estatísticas
      await updateConfig('stats', {
        documents_registered: statsDocuments,
        companies_served: statsCompanies,
        uptime: statsUptime,
        verification: statsVerification
      });

      // Salvar features
      await updateConfig('plan_features_single', featuresSingle);
      await updateConfig('plan_features_professional', featuresProfessional);
      await updateConfig('plan_features_enterprise', featuresEnterprise);

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao salvar: ' + err.message);
    }

    setSaving(false);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  const handleFeatureChange = (
    features: string[], 
    setFeatures: (f: string[]) => void, 
    index: number, 
    value: string
  ) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = (features: string[], setFeatures: (f: string[]) => void) => {
    setFeatures([...features, '']);
  };

  const removeFeature = (features: string[], setFeatures: (f: string[]) => void, index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img 
              src="https://ibedis.com.br/assets/images/ibedis-horizontal-1764442927912.png" 
              alt="IBEDIS" 
              className="h-10"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-amber-100 px-3 py-1 rounded-full">⚠️ Modo Admin</span>
            <Link 
              href="/registro-documentos" 
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Ver Página Pública →
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-emerald-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Registro de Documentos</h1>
                <p className="text-gray-500 text-sm">Edite preços, chaves de pagamento e estatísticas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Preview
              </button>
              <button
                onClick={loadConfigs}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center text-emerald-700">
              <Check className="w-5 h-5 mr-2 flex-shrink-0" />
              {success}
            </div>
          )}

          <div className="space-y-8">
            {/* Seção: Preços */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Preços dos Planos</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Avulso */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Plano Avulso</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceSingle}
                      onChange={(e) => setPriceSingle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {showPreview && (
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(priceSingle)}</div>
                  )}
                </div>

                {/* Profissional */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Plano Profissional</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceProfessional}
                      onChange={(e) => setPriceProfessional(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Documentos/mês</label>
                    <input
                      type="number"
                      value={docsProfessional}
                      onChange={(e) => setDocsProfessional(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {showPreview && (
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(priceProfessional)}/mês</div>
                  )}
                </div>

                {/* Empresarial */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Plano Empresarial</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceEnterprise}
                      onChange={(e) => setPriceEnterprise(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Documentos/mês</label>
                    <input
                      type="number"
                      value={docsEnterprise}
                      onChange={(e) => setDocsEnterprise(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {showPreview && (
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(priceEnterprise)}/mês</div>
                  )}
                </div>
              </div>
            </section>

            {/* Seção: Pagamentos */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Wallet className="w-5 h-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Chaves de Pagamento</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="email@exemplo.com ou CPF/CNPJ"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email, CPF, CNPJ ou chave aleatória</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carteira Polygon (MATIC/USDT)</label>
                  <input
                    type="text"
                    value={cryptoWallet}
                    onChange={(e) => setCryptoWallet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    placeholder="0x..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Endereço da carteira na rede Polygon</p>
                </div>
              </div>
            </section>

            {/* Seção: Estatísticas */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="w-5 h-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Estatísticas da Landing Page</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documentos Registrados</label>
                  <input
                    type="text"
                    value={statsDocuments}
                    onChange={(e) => setStatsDocuments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="1.234+"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresas Atendidas</label>
                  <input
                    type="text"
                    value={statsCompanies}
                    onChange={(e) => setStatsCompanies(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="847"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uptime</label>
                  <input
                    type="text"
                    value={statsUptime}
                    onChange={(e) => setStatsUptime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="100%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verificação</label>
                  <input
                    type="text"
                    value={statsVerification}
                    onChange={(e) => setStatsVerification(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="24/7"
                  />
                </div>
              </div>

              {showPreview && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1a3f4d]">{statsDocuments}</div>
                    <div className="text-sm text-gray-500">Documentos Registrados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1a3f4d]">{statsCompanies}</div>
                    <div className="text-sm text-gray-500">Empresas Atendidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1a3f4d]">{statsUptime}</div>
                    <div className="text-sm text-gray-500">Uptime Blockchain</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1a3f4d]">{statsVerification}</div>
                    <div className="text-sm text-gray-500">Verificação Online</div>
                  </div>
                </div>
              )}
            </section>

            {/* Seção: Features dos Planos */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <List className="w-5 h-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Features dos Planos</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Features Avulso */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Plano Avulso</h3>
                  <div className="space-y-2">
                    {featuresSingle.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(featuresSingle, setFeaturesSingle, index, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => removeFeature(featuresSingle, setFeaturesSingle, index)}
                          className="px-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addFeature(featuresSingle, setFeaturesSingle)}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      + Adicionar feature
                    </button>
                  </div>
                </div>

                {/* Features Profissional */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Plano Profissional</h3>
                  <div className="space-y-2">
                    {featuresProfessional.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(featuresProfessional, setFeaturesProfessional, index, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => removeFeature(featuresProfessional, setFeaturesProfessional, index)}
                          className="px-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addFeature(featuresProfessional, setFeaturesProfessional)}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      + Adicionar feature
                    </button>
                  </div>
                </div>

                {/* Features Empresarial */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Plano Empresarial</h3>
                  <div className="space-y-2">
                    {featuresEnterprise.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(featuresEnterprise, setFeaturesEnterprise, index, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => removeFeature(featuresEnterprise, setFeaturesEnterprise, index)}
                          className="px-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addFeature(featuresEnterprise, setFeaturesEnterprise)}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      + Adicionar feature
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-semibold flex items-center gap-2 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Todas as Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
