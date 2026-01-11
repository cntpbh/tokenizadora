'use client';

import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { 
  Smartphone, Wallet, Mail, Palette, Award, Save, Loader2, 
  Eye, EyeOff, CheckCircle, Copy, Code, ExternalLink, AlertCircle, Info,
  Users, Search, Download, Phone, Building2, Calendar, FileText, Package,
  CreditCard, RefreshCw, TrendingUp, Banknote
} from 'lucide-react';
import { getSettings, updateSettings, PlatformSettings, getAllUsers, User } from '@/lib/supabase';

// Lazy loading para componentes pesados - carrega só quando necessário
const DocumentsManager = lazy(() => import('./DocumentsManager'));
const ProjectsManager = lazy(() => import('./ProjectsManager'));
const TransactionsManager = lazy(() => import('./TransactionsManager'));
const CryptoSettings = lazy(() => import('./CryptoSettings'));
const WithdrawalManager = lazy(() => import('../wallet/WithdrawalManager'));

// Componente de loading para Suspense
const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
    <span className="ml-2 text-gray-500">Carregando...</span>
  </div>
);

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'pix' | 'crypto' | 'transacoes' | 'saques' | 'email' | 'branding' | 'certificado' | 'widget' | 'usuarios' | 'documentos' | 'projetos'>('pix');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Estado para usuários
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [settings, setSettings] = useState<PlatformSettings>({
    pix_enabled: true,
    pix_key: '',
    pix_recipient_name: '',
    crypto_enabled: true,
    crypto_wallet_address: '',
    crypto_accepted_tokens: ['MATIC', 'USDC', 'USDT'],
    email_provider: 'resend',
    email_api_key: '',
    email_from_address: '',
    email_from_name: '',
    platform_name: 'IBEDIS Token',
    platform_logo_url: '',
    contact_email: '',
    certificate_logo_url: '',
    certificate_signature_url: '',
    certificate_signer_name: '',
    certificate_signer_title: '',
  });

  const PLATFORM_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ibedis-token-platform.vercel.app';

  // Cache para evitar recarregamentos desnecessários
  const settingsLoaded = useRef(false);
  const usersLoaded = useRef(false);

  // Carrega settings apenas uma vez
  useEffect(() => {
    if (!settingsLoaded.current) {
      settingsLoaded.current = true;
      loadSettings();
    }
  }, []);

  // Carregar usuários apenas quando a aba for selecionada E não carregou ainda
  useEffect(() => {
    if (activeTab === 'usuarios' && !usersLoaded.current && users.length === 0) {
      usersLoaded.current = true;
      loadUsers();
    }
  }, [activeTab, users.length]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
    setLoadingUsers(false);
  }, []);

  // Campos por aba para salvar apenas o necessário
  const getFieldsByTab = () => {
    switch (activeTab) {
      case 'pix':
        return {
          pix_enabled: settings.pix_enabled,
          pix_key: settings.pix_key,
          pix_recipient_name: settings.pix_recipient_name,
        };
      case 'crypto':
        return {
          crypto_enabled: settings.crypto_enabled,
          crypto_wallet_address: settings.crypto_wallet_address,
          crypto_accepted_tokens: settings.crypto_accepted_tokens,
        };
      case 'email':
        return {
          email_provider: settings.email_provider,
          email_api_key: settings.email_api_key,
          email_from_address: settings.email_from_address,
          email_from_name: settings.email_from_name,
        };
      case 'branding':
        return {
          platform_name: settings.platform_name,
          platform_logo_url: settings.platform_logo_url,
          contact_email: settings.contact_email,
        };
      case 'certificado':
        return {
          certificate_logo_url: settings.certificate_logo_url,
          certificate_signature_url: settings.certificate_signature_url,
          certificate_signer_name: settings.certificate_signer_name,
          certificate_signer_title: settings.certificate_signer_title,
        };
      default:
        return settings;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('🔄 Salvando configurações...');
    
    try {
      const fieldsToSave = getFieldsByTab();
      console.log('📝 Campos a salvar:', fieldsToSave);
      
      const result = await updateSettings(fieldsToSave);
      console.log('✅ Resultado:', result);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      alert(`Erro ao salvar: ${error.message || 'Tente novamente'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const toggleToken = (token: string) => {
    const tokens = settings.crypto_accepted_tokens || [];
    if (tokens.includes(token)) {
      handleChange('crypto_accepted_tokens', tokens.filter(t => t !== token));
    } else {
      handleChange('crypto_accepted_tokens', [...tokens, token]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert('Digite um email para teste');
      return;
    }
    
    setSendingTest(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          template: 'test',
          data: {}
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: `Email enviado com sucesso via ${data.provider}!` });
      } else {
        setTestResult({ success: false, message: data.error || 'Erro ao enviar email' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Erro ao enviar email' });
    }
    
    setSendingTest(false);
  };

  // Widget HTML codes
  const widgetSimple = `<iframe src="${PLATFORM_URL}/widget" width="400" height="450" frameborder="0" scrolling="no" style="border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>`;
  
  const widgetResponsivo = `<div style="position:relative;width:100%;max-width:500px;margin:0 auto;">
  <iframe src="${PLATFORM_URL}/widget" width="100%" height="450" frameborder="0" scrolling="no" style="border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>
</div>`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'pix', label: 'PIX', icon: Smartphone },
    { id: 'crypto', label: 'Crypto', icon: Wallet },
    { id: 'transacoes', label: 'Transações', icon: CreditCard },
    { id: 'saques', label: 'Saques', icon: Banknote },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'branding', label: 'Marca', icon: Palette },
    { id: 'certificado', label: 'Certificado', icon: Award },
    { id: 'widget', label: 'Widget', icon: Code },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'projetos', label: 'Projetos', icon: Package },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <h2 className="text-xl font-bold text-white">⚙️ Configurações</h2>
        <p className="text-amber-100 text-sm">Configure pagamentos, email e personalização</p>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-emerald-700 border-b-2 border-emerald-700 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        
        {/* PIX - Simplificado */}
        {activeTab === 'pix' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <Smartphone className="w-6 h-6 text-emerald-600 mr-3" />
                <div>
                  <h3 className="font-bold text-gray-800">Pagamento via PIX</h3>
                  <p className="text-sm text-gray-500">Integração com Mercado Pago</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pix_enabled}
                  onChange={(e) => handleChange('pix_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-checked:bg-emerald-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {settings.pix_enabled ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            </div>

            {/* Info Mercado Pago */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800">Integração Mercado Pago</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    O PIX é processado automaticamente via Mercado Pago. O QR Code é gerado em tempo real e o pagamento é confirmado automaticamente.
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-2">✅ Configurado via variáveis de ambiente:</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• <code className="bg-gray-100 px-1 rounded">MERCADOPAGO_ACCESS_TOKEN</code></li>
                      <li>• Webhook automático para confirmação</li>
                      <li>• QR Code gerado dinamicamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                <span className="text-emerald-700 font-medium">Mercado Pago configurado e ativo</span>
              </div>
            </div>
          </div>
        )}

        {/* Crypto */}
        {activeTab === 'crypto' && (
          <Suspense fallback={<TabLoader />}>
            <CryptoSettings 
              settings={settings}
              handleChange={handleChange}
              toggleToken={toggleToken}
            />
          </Suspense>
        )}

        {/* Transações */}
        {activeTab === 'transacoes' && (
          <Suspense fallback={<TabLoader />}>
            <TransactionsManager />
          </Suspense>
        )}

        {/* NOVO: Saques */}
        {activeTab === 'saques' && (
          <Suspense fallback={<TabLoader />}>
            <WithdrawalManager />
          </Suspense>
        )}

        {/* Email */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provedor de Email</label>
              <select
                value={settings.email_provider || 'resend'}
                onChange={(e) => handleChange('email_provider', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="resend">Resend</option>
                <option value="sendgrid">SendGrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={settings.email_api_key || ''}
                  onChange={(e) => handleChange('email_api_key', e.target.value)}
                  placeholder="Sua API Key"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Remetente</label>
                <input
                  type="email"
                  value={settings.email_from_address || ''}
                  onChange={(e) => handleChange('email_from_address', e.target.value)}
                  placeholder="noreply@seudominio.com"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Remetente</label>
                <input
                  type="text"
                  value={settings.email_from_name || ''}
                  onChange={(e) => handleChange('email_from_name', e.target.value)}
                  placeholder="IBEDIS Token"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Testar Email */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="font-medium text-emerald-800 flex items-center mb-3">
                <Mail className="w-4 h-4 mr-2" />
                Testar Configuração de Email
              </h4>
              <p className="text-sm text-emerald-700 mb-3">
                Após salvar as configurações, teste enviando um email.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center"
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enviar Teste
                </button>
              </div>
              {testResult && (
                <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {testResult.success ? <CheckCircle className="w-4 h-4 inline mr-2" /> : <AlertCircle className="w-4 h-4 inline mr-2" />}
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-800 mb-2">📝 Como configurar:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Crie conta no <a href="https://resend.com" target="_blank" className="text-emerald-600 hover:underline">Resend</a> (gratuito até 3.000 emails/mês)</li>
                <li>Gere uma API Key em API Keys → Create API Key</li>
                <li>Cole a chave acima e salve</li>
                <li>Use o email de teste do Resend ou verifique seu domínio</li>
              </ol>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>💡 Dica:</strong> Para usar seu próprio domínio (ex: marinho@ibedis.org), você precisa verificar o domínio no Resend adicionando registros DNS.
              </div>
            </div>
          </div>
        )}

        {/* Branding */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Plataforma</label>
              <input
                type="text"
                value={settings.platform_name || ''}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                placeholder="IBEDIS Token"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL do Logo</label>
              <input
                type="url"
                value={settings.platform_logo_url || ''}
                onChange={(e) => handleChange('platform_logo_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              {settings.platform_logo_url && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img src={settings.platform_logo_url} alt="Logo" className="h-12 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contato</label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="contato@exemplo.com"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Certificado */}
        {activeTab === 'certificado' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo do Certificado</label>
              <input
                type="url"
                value={settings.certificate_logo_url || ''}
                onChange={(e) => handleChange('certificate_logo_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagem da Assinatura</label>
              <input
                type="url"
                value={settings.certificate_signature_url || ''}
                onChange={(e) => handleChange('certificate_signature_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Signatário</label>
                <input
                  type="text"
                  value={settings.certificate_signer_name || ''}
                  onChange={(e) => handleChange('certificate_signer_name', e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <input
                  type="text"
                  value={settings.certificate_signer_title || ''}
                  onChange={(e) => handleChange('certificate_signer_title', e.target.value)}
                  placeholder="Diretor Executivo"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Widget */}
        {activeTab === 'widget' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 flex items-center mb-2">
                <Code className="w-4 h-4 mr-2" />
                Embed Widget
              </h4>
              <p className="text-sm text-blue-700">
                Cole este código em seu site para exibir um widget de compra de tokens.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código Simples</label>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto">
                  {widgetSimple}
                </pre>
                <button
                  onClick={() => copyToClipboard(widgetSimple)}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código Responsivo</label>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto">
                  {widgetResponsivo}
                </pre>
                <button
                  onClick={() => copyToClipboard(widgetResponsivo)}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href={`${PLATFORM_URL}/widget`}
                target="_blank"
                className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Widget
              </a>
            </div>
          </div>
        )}

        {/* Usuários */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-emerald-600 mr-3" />
                <div>
                  <h3 className="font-bold text-gray-800">Usuários Cadastrados</h3>
                  <p className="text-sm text-gray-500">
                    {users.length} usuário{users.length !== 1 ? 's' : ''} na plataforma
                  </p>
                </div>
              </div>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition flex items-center"
              >
                {loadingUsers ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Atualizar
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Lista de Usuários */}
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum usuário cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {users
                  .filter(user => {
                    if (!userSearch) return true;
                    const search = userSearch.toLowerCase();
                    return (
                      user.full_name?.toLowerCase().includes(search) ||
                      user.email?.toLowerCase().includes(search) ||
                      user.cpf_cnpj?.includes(search) ||
                      user.company_name?.toLowerCase().includes(search)
                    );
                  })
                  .map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{user.full_name}</h4>
                          <p className="text-sm text-emerald-600">{user.email}</p>
                          
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            {user.cpf_cnpj && (
                              <span className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {user.cpf_cnpj}
                              </span>
                            )}
                            {user.phone && (
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phone}
                              </span>
                            )}
                            {user.company_name && (
                              <span className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {user.company_name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right text-xs text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(user.created_at || '').toLocaleDateString('pt-BR')}
                          </div>
                          {user.kyc_status && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.kyc_status === 'approved' 
                                ? 'bg-green-100 text-green-700'
                                : user.kyc_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.kyc_status === 'approved' ? '✓ Verificado' : 
                               user.kyc_status === 'pending' ? '⏳ Pendente' : user.kyc_status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {user.wallet_address && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-400 font-mono truncate">
                            🔗 {user.wallet_address}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Estatísticas */}
            {users.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{users.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.wallet_address).length}
                  </p>
                  <p className="text-xs text-gray-500">Com Wallet</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.company_name).length}
                  </p>
                  <p className="text-xs text-gray-500">Empresas</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documentos */}
        {activeTab === 'documentos' && (
          <Suspense fallback={<TabLoader />}>
            <DocumentsManager />
          </Suspense>
        )}

        {/* Projetos */}
        {activeTab === 'projetos' && (
          <Suspense fallback={<TabLoader />}>
            <ProjectsManager />
          </Suspense>
        )}

        {/* Botão Salvar */}
        {activeTab !== 'widget' && activeTab !== 'usuarios' && activeTab !== 'documentos' && activeTab !== 'projetos' && activeTab !== 'transacoes' && activeTab !== 'saques' && (
          <div className="mt-8 pt-6 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {saved && (
                <span className="flex items-center text-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Configurações salvas!
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Salvar Configurações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
