'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit, Loader2, Search, Calendar,
  Link2, Eye, ExternalLink, Building2, Save, X, Shield, Award,
  Copy, CheckCircle, Hash, Clock, AlertTriangle
} from 'lucide-react';
import { 
  getDocumentsAdmin, getProjects, createDocument, updateDocument, 
  deleteDocument, Document, Project 
} from '@/lib/supabase';
import { useAddress } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const CATEGORIES = [
  { value: 'EDITAL', label: '📋 Edital' },
  { value: 'CONTRATO', label: '📝 Contrato' },
  { value: 'RELATORIO', label: '📊 Relatório' },
  { value: 'ATA', label: '📄 Ata' },
  { value: 'ACORDO', label: '🤝 Acordo de Cooperação' },
  { value: 'ESTATUTO', label: '📜 Estatuto/Governança' },
  { value: 'CERTIFICADO', label: '🏆 Credenciamento' },
  { value: 'REGULAMENTO', label: '🛡️ Regulamento' },
  { value: 'PROPOSTA', label: '💼 Proposta' },
  { value: 'OUTRO', label: '📁 Outro' },
];

const VISIBILITY = [
  { value: 'public', label: 'Público' },
  { value: 'holders', label: 'Apenas Holders' },
  { value: 'admin', label: 'Apenas Admin' },
];

async function generateDocumentHash(data: any): Promise<string> {
  const text = JSON.stringify({
    title: data.title,
    category: data.category,
    description: data.description,
    document_url: data.document_url,
    document_number: data.document_number,
    publish_date: data.publish_date,
    timestamp: new Date().toISOString()
  });
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [registerOnBlockchain, setRegisterOnBlockchain] = useState(true);
  const [blockchainStatus, setBlockchainStatus] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);
  
  // NOVO: Estado para controlar resultado do registro
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredTxHash, setRegisteredTxHash] = useState<string | null>(null);

  const address = useAddress();

  const [form, setForm] = useState({
    project_id: '',
    category: 'EDITAL',
    title: '',
    description: '',
    document_url: '',
    document_number: '',
    tx_hash: '',
    ipfs_hash: '',
    visibility: 'public',
    publish_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, projectsData] = await Promise.all([
        getDocumentsAdmin(),
        getProjects()
      ]);
      setDocuments(docsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      project_id: '',
      category: 'EDITAL',
      title: '',
      description: '',
      document_url: '',
      document_number: '',
      tx_hash: '',
      ipfs_hash: '',
      visibility: 'public',
      publish_date: new Date().toISOString().split('T')[0],
    });
    setEditingDoc(null);
    setShowForm(false);
    setRegisterOnBlockchain(true);
    setBlockchainStatus('');
    setRegistrationComplete(false);
    setRegistrationSuccess(false);
    setRegisteredTxHash(null);
  };

  const handleEdit = (doc: Document) => {
    setForm({
      project_id: doc.project_id || '',
      category: doc.category,
      title: doc.title,
      description: doc.description || '',
      document_url: doc.document_url || '',
      document_number: doc.document_number || '',
      tx_hash: doc.tx_hash || '',
      ipfs_hash: doc.ipfs_hash || '',
      visibility: doc.visibility || 'public',
      publish_date: doc.publish_date || new Date().toISOString().split('T')[0],
    });
    setEditingDoc(doc);
    setShowForm(true);
    setRegisterOnBlockchain(false);
    setRegistrationComplete(false);
    setRegistrationSuccess(false);
    setRegisteredTxHash(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (!form.title || !form.category) {
      alert('Título e categoria são obrigatórios');
      return;
    }

    const canRegisterOnBlockchain = registerOnBlockchain && !editingDoc?.tx_hash;

    if (canRegisterOnBlockchain) {
      if (!address) {
        alert('Conecte sua carteira para registrar na blockchain!');
        return;
      }
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        alert('Metamask não encontrado! Instale a extensão.');
        return;
      }
    }

    setSaving(true);
    setBlockchainStatus('');
    setRegistrationComplete(false);
    setRegistrationSuccess(false);
    setRegisteredTxHash(null);
    
    try {
      let txHash = form.tx_hash;
      let ipfsHash = form.ipfs_hash;

      if (canRegisterOnBlockchain) {
        // PASSO 1: Gerar hash
        setBlockchainStatus('🔐 Gerando hash SHA256 do documento...');
        await new Promise(r => setTimeout(r, 500)); // Pequeno delay para UI
        
        const documentHash = await generateDocumentHash(form);
        ipfsHash = documentHash;
        
        // PASSO 2: Salvar documento no banco
        setBlockchainStatus('💾 Salvando documento no banco de dados...');
        await new Promise(r => setTimeout(r, 500));
        
        const docData = {
          ...form,
          project_id: form.project_id || null,
          ipfs_hash: documentHash,
        };

        let savedDoc;
        if (editingDoc) {
          savedDoc = await updateDocument(editingDoc.id!, docData);
        } else {
          savedDoc = await createDocument(docData as Document);
        }

        // PASSO 3: Registrar na blockchain
        try {
          const registryData = JSON.stringify({
            type: 'IBEDIS_DOCUMENT_REGISTRY',
            version: '1.0',
            documentId: savedDoc.id,
            documentHash,
            title: form.title.substring(0, 100),
            category: form.category,
            timestamp: new Date().toISOString(),
            platform: 'token.ibedis.com.br'
          });

          // PASSO 4: Abrir Metamask
          setBlockchainStatus('🦊 Abrindo Metamask... Aguarde a janela aparecer!');
          await new Promise(r => setTimeout(r, 500));

          const ethereum = (window as any).ethereum;
          
          // Solicitar acesso às contas
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          const userAddress = accounts[0];
          
          // Converter dados para hex
          const dataHex = '0x' + Array.from(new TextEncoder().encode(registryData))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          // Endereço de registro (burn address padrão)
          // Usamos um endereço burn para evitar erro de "internal accounts"
          const REGISTRY_ADDRESS = '0x000000000000000000000000000000000000dEaD';

          setBlockchainStatus('✍️ CONFIRME A TRANSAÇÃO NO METAMASK!');

          // Enviar transação usando eth_sendTransaction direto
          const txHashResult = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: userAddress,
              to: REGISTRY_ADDRESS,
              value: '0x0',
              data: dataHex,
            }],
          });

          setBlockchainStatus('⏳ Transação enviada! Aguardando confirmação na Polygon...');

          // Aguardar confirmação
          const provider = new ethers.providers.Web3Provider(ethereum);
          const receipt = await provider.waitForTransaction(txHashResult);

          txHash = txHashResult;
          
          // PASSO 5: Atualizar documento com tx_hash
          setBlockchainStatus('📝 Atualizando documento com hash da transação...');
          await updateDocument(savedDoc.id, { tx_hash: txHash });
          
          // SUCESSO!
          setBlockchainStatus('✅ REGISTRADO COM SUCESSO NA BLOCKCHAIN!');
          setRegistrationSuccess(true);
          setRegisteredTxHash(txHash);
          setRegistrationComplete(true);
          
          await loadData();
          
        } catch (blockchainError: any) {
          console.error('Erro na blockchain:', blockchainError);
          
          if (blockchainError.code === 'ACTION_REJECTED' || blockchainError.code === 4001) {
            setBlockchainStatus('❌ Transação cancelada pelo usuário. Documento salvo sem registro blockchain.');
          } else if (blockchainError.message?.includes('user rejected')) {
            setBlockchainStatus('❌ Transação rejeitada. Documento salvo sem registro blockchain.');
          } else {
            setBlockchainStatus(`⚠️ Erro: ${blockchainError.message || 'Erro desconhecido'}. Documento salvo sem blockchain.`);
          }
          
          setRegistrationSuccess(false);
          setRegistrationComplete(true);
          await loadData();
        }
      } else {
        // Salvar sem blockchain
        const docData = {
          ...form,
          project_id: form.project_id || null,
        };

        if (editingDoc) {
          await updateDocument(editingDoc.id!, docData);
        } else {
          await createDocument(docData as Document);
        }
        
        await loadData();
        resetForm(); // Só fecha automaticamente se não for registro blockchain
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setBlockchainStatus(`❌ Erro: ${error.message}`);
      setRegistrationComplete(true);
      setRegistrationSuccess(false);
    }
    
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    
    setDeleting(id);
    try {
      await deleteDocument(id);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      alert(`Erro ao deletar: ${error.message}`);
    }
    setDeleting(null);
  };

  const filteredDocs = documents.filter(doc => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      doc.title.toLowerCase().includes(s) ||
      doc.category.toLowerCase().includes(s) ||
      doc.document_number?.toLowerCase().includes(s)
    );
  });

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  const isAlreadyRegistered = !!(editingDoc?.tx_hash);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-emerald-600 mr-3" />
          <div>
            <h3 className="font-bold text-gray-800">Gerenciar Documentos</h3>
            <p className="text-sm text-gray-500">
              {documents.length} documento{documents.length !== 1 ? 's' : ''} cadastrado{documents.length !== 1 ? 's' : ''}
              {' • '}
              <span className="text-emerald-600">{documents.filter(d => d.tx_hash).length} na blockchain</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editingDoc ? 'Editar Documento' : 'Novo Documento'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg" disabled={saving}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de documento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vinculado ao Projeto
                  </label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    <option value="">📍 Institucional (sem projeto)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        Token #{p.token_id} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Edital de Convocação 001/2025"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={saving}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Breve descrição do documento..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={saving}
                />
              </div>

              {/* URL e Número */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Documento (PDF)
                  </label>
                  <input
                    type="url"
                    value={form.document_url}
                    onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número/Código
                  </label>
                  <input
                    type="text"
                    value={form.document_number}
                    onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                    placeholder="Ex: IBEDIS-ACT-2025-001"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Data e Visibilidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Publicação
                  </label>
                  <input
                    type="date"
                    value={form.publish_date}
                    onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibilidade
                  </label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    {VISIBILITY.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ========== SEÇÃO DE BLOCKCHAIN ========== */}
              
              {/* SE JÁ ESTÁ REGISTRADO */}
              {isAlreadyRegistered ? (
                <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800">✅ Registrado na Blockchain</h4>
                          <p className="text-xs text-green-600">Registro imutável na Polygon</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="bg-white border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">HASH DA TRANSAÇÃO</span>
                        <button onClick={() => copyToClipboard(editingDoc.tx_hash!, 'tx')} className="text-purple-600 hover:text-purple-800">
                          {copied === 'tx' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="font-mono text-xs text-gray-800 break-all">{editingDoc.tx_hash}</p>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`https://polygonscan.com/tx/${editingDoc.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-[#8247E5] text-white rounded-lg text-sm font-medium flex items-center justify-center hover:bg-[#6b3bc7] transition"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver na Polygonscan
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* SE NÃO ESTÁ REGISTRADO */
                <div className={`border rounded-xl p-4 ${
                  registerOnBlockchain
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Shield className={`w-5 h-5 mr-3 ${
                        registerOnBlockchain ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className={`font-medium ${
                          registerOnBlockchain ? 'text-purple-900' : 'text-gray-700'
                        }`}>Registro na Blockchain</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Registra o documento na Polygon com hash SHA256 (custo ~$0.001)
                        </p>
                      </div>
                    </div>
                    
                    {!saving && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={registerOnBlockchain}
                          onChange={(e) => setRegisterOnBlockchain(e.target.checked)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-purple-700 font-medium">Registrar</span>
                      </label>
                    )}
                  </div>

                  {registerOnBlockchain && !address && !saving && (
                    <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Conecte sua carteira (Metamask) para registrar na blockchain
                      </p>
                    </div>
                  )}

                  {registerOnBlockchain && address && !saving && !registrationComplete && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 flex items-center">
                        ✅ Carteira conectada: {address.slice(0, 6)}...{address.slice(-4)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Ao clicar em "Salvar e Registrar", o Metamask abrirá para assinar
                      </p>
                    </div>
                  )}

                  {/* STATUS DO PROCESSO */}
                  {blockchainStatus && (
                    <div className={`mt-3 p-4 rounded-lg text-sm ${
                      blockchainStatus.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' :
                      blockchainStatus.includes('❌') || blockchainStatus.includes('⚠️') ? 'bg-red-100 text-red-800 border border-red-300' :
                      'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {saving && !registrationComplete && (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      )}
                      <span className="font-medium">{blockchainStatus}</span>
                    </div>
                  )}

                  {/* RESULTADO DO REGISTRO */}
                  {registrationComplete && registrationSuccess && registeredTxHash && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                        <span className="font-bold text-green-800">Registro concluído com sucesso!</span>
                      </div>
                      <div className="bg-white rounded p-3 mb-3">
                        <span className="text-xs text-gray-500 block mb-1">Hash da Transação:</span>
                        <p className="font-mono text-xs break-all text-gray-800">{registeredTxHash}</p>
                      </div>
                      <a
                        href={`https://polygonscan.com/tx/${registeredTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-[#8247E5] text-white rounded-lg text-sm font-medium hover:bg-[#6b3bc7] transition"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver na Polygonscan
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              {registrationComplete ? (
                // Após registro completo, mostrar apenas botão de fechar
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Fechar
                </button>
              ) : (
                // Durante o processo normal
                <>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || (registerOnBlockchain && !isAlreadyRegistered && !address)}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : registerOnBlockchain && !isAlreadyRegistered ? (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Salvar e Registrar
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Lista */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum documento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                      {getCategoryLabel(doc.category)}
                    </span>
                    {doc.project_id ? (
                      <span className="text-xs text-gray-500">
                        Token #{(doc as any).project?.token_id || '?'} - {(doc as any).project?.name || 'Projeto'}
                      </span>
                    ) : (
                      <span className="text-xs text-purple-600 flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        Institucional
                      </span>
                    )}
                    {doc.tx_hash && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Blockchain
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-gray-800">{doc.title}</h4>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{doc.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {doc.document_number && <span>Nº {doc.document_number}</span>}
                    {doc.publish_date && (
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(doc.publish_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {doc.tx_hash && (
                    <a
                      href={`/certificado-documento?id=${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Ver Certificado"
                    >
                      <Award className="w-4 h-4" />
                    </a>
                  )}
                  {doc.tx_hash && (
                    <a
                      href={`https://polygonscan.com/tx/${doc.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Ver na Blockchain"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {doc.document_url && (
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Ver documento"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(doc)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id!)}
                    disabled={deleting === doc.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Excluir"
                  >
                    {deleting === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="pt-4 border-t flex gap-4">
        <a
          href="/transparencia"
          target="_blank"
          className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver Transparência
        </a>
        <a
          href="/institucional"
          target="_blank"
          className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Ver Institucional
        </a>
      </div>
    </div>
  );
}
