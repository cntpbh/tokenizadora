'use client';

import { useState, useEffect } from 'react';
import { User, Award, FileText, Clock, ExternalLink, LogOut, Settings, ChevronRight, Wallet, Save, Loader2, CheckCircle, Edit2 } from 'lucide-react';
import { getUserCertificates, getUserTransactions, updateUser, Certificate, User as UserType } from '@/lib/supabase';
import CertificateView from '../certificate/CertificateView';

interface ClientAreaProps {
  user: UserType;
  onLogout: () => void;
  onUserUpdate?: (user: UserType) => void;
}

export default function ClientArea({ user, onLogout, onUserUpdate }: ClientAreaProps) {
  const [activeTab, setActiveTab] = useState<'certificados' | 'historico' | 'perfil'>('certificados');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  
  // Estados para edição do perfil
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: user.phone || '',
    company_name: user.company_name || '',
    wallet_address: user.wallet_address || '',
  });

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    setProfileForm({
      phone: user.phone || '',
      company_name: user.company_name || '',
      wallet_address: user.wallet_address || '',
    });
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certs, txs] = await Promise.all([
        getUserCertificates(user.id).catch(() => []),
        getUserTransactions(user.id).catch(() => [])
      ]);
      setCertificates(certs || []);
      setTransactions(txs || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setCertificates([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateUser(user.id, {
        phone: profileForm.phone.replace(/\D/g, ''),
        company_name: profileForm.company_name,
        wallet_address: profileForm.wallet_address,
      });
      
      if (onUserUpdate && updated) {
        onUserUpdate({ ...user, ...updated });
      }
      
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
    setSaving(false);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const maskCpfCnpj = (value: string) => {
    if (!value) return '';
    if (value.length === 11) {
      return `${value.slice(0, 3)}.***.***-${value.slice(-2)}`;
    } else if (value.length === 14) {
      return `${value.slice(0, 2)}.***.***/****-${value.slice(-2)}`;
    }
    return value;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      completed: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      active: 'bg-emerald-100 text-emerald-700',
      retired: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      completed: 'Concluído',
      pending: 'Pendente',
      failed: 'Falhou',
      active: 'Ativo',
      retired: 'Aposentado',
    };
    return labels[status] || status;
  };

  // Modal de Certificado
  if (selectedCertificate) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="max-w-4xl w-full py-8">
          <button
            onClick={() => setSelectedCertificate(null)}
            className="mb-4 text-white hover:text-emerald-300 flex items-center"
          >
            ← Voltar para Área do Cliente
          </button>
          <CertificateView 
            certificate={selectedCertificate} 
            onClose={() => setSelectedCertificate(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-t-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.full_name}</h2>
              <p className="text-emerald-200">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          {[
            { id: 'certificados', label: 'Meus Certificados', icon: Award },
            { id: 'historico', label: 'Histórico', icon: Clock },
            { id: 'perfil', label: 'Perfil', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center font-medium transition ${
                activeTab === tab.id
                  ? 'text-emerald-700 border-b-2 border-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-2xl shadow-lg p-6 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-500">Carregando...</span>
          </div>
        ) : (
          <>
            {/* CERTIFICADOS */}
            {activeTab === 'certificados' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    📜 Meus Certificados ({certificates.length})
                  </h3>
                </div>

                {certificates.length === 0 ? (
                  <div className="text-center py-16">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-600 mb-2">Nenhum certificado ainda</h4>
                    <p className="text-gray-500">Compre tokens para receber seus certificados de ativos sustentáveis.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        onClick={() => setSelectedCertificate(cert)}
                        className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition cursor-pointer border border-gray-200 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="bg-emerald-100 p-3 rounded-lg mr-4 group-hover:bg-emerald-200 transition">
                              <Award className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{cert.project_name}</h4>
                              <p className="text-sm text-gray-500">
                                {cert.token_amount?.toLocaleString()} tokens • {cert.token_type}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <code className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {cert.certificate_code}
                          </code>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(cert.status || 'active')}`}>
                            {getStatusLabel(cert.status || 'active')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HISTÓRICO */}
            {activeTab === 'historico' && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  📋 Histórico de Transações ({transactions.length})
                </h3>

                {transactions.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-600 mb-2">Nenhuma transação</h4>
                    <p className="text-gray-500">Suas compras aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${
                              tx.payment_status === 'completed' ? 'bg-emerald-100' : 'bg-yellow-100'
                            }`}>
                              <FileText className={`w-5 h-5 ${
                                tx.payment_status === 'completed' ? 'text-emerald-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                Compra de Tokens
                              </p>
                              <p className="text-sm text-gray-500">
                                {tx.amount} tokens • {tx.payment_method?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              R$ {tx.price_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(tx.payment_status)}`}>
                              {getStatusLabel(tx.payment_status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm text-gray-500">
                          <span>{new Date(tx.created_at).toLocaleString('pt-BR')}</span>
                          {tx.tx_hash && (
                            <a
                              href={`https://polygonscan.com/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline flex items-center"
                            >
                              Ver blockchain <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PERFIL */}
            {activeTab === 'perfil' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">👤 Meu Perfil</h3>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </button>
                  )}
                </div>

                {saved && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Perfil atualizado com sucesso!
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome - não editável */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm text-gray-500">Nome Completo</label>
                    <p className="font-medium text-gray-800">{user.full_name}</p>
                  </div>

                  {/* Email - não editável */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-800">{user.email}</p>
                  </div>

                  {/* CPF/CNPJ - não editável */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm text-gray-500">CPF/CNPJ</label>
                    <p className="font-medium text-gray-800">{maskCpfCnpj(user.cpf_cnpj)}</p>
                  </div>

                  {/* Telefone - editável */}
                  <div className={`rounded-xl p-4 ${editing ? 'bg-white border-2 border-emerald-500' : 'bg-gray-50'}`}>
                    <label className="text-sm text-gray-500">Telefone</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formatPhone(profileForm.phone)}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-800">{formatPhone(user.phone || '') || 'Não informado'}</p>
                    )}
                  </div>

                  {/* Empresa - editável */}
                  <div className={`rounded-xl p-4 md:col-span-2 ${editing ? 'bg-white border-2 border-emerald-500' : 'bg-gray-50'}`}>
                    <label className="text-sm text-gray-500">Empresa (opcional)</label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileForm.company_name}
                        onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                        placeholder="Nome da empresa"
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-800">{user.company_name || 'Não informado'}</p>
                    )}
                  </div>

                  {/* Carteira - editável */}
                  <div className={`rounded-xl p-4 md:col-span-2 ${editing ? 'bg-white border-2 border-purple-500' : 'bg-purple-50'}`}>
                    <label className="text-sm text-purple-600 flex items-center">
                      <Wallet className="w-4 h-4 mr-1" />
                      Carteira Polygon (para receber tokens)
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileForm.wallet_address}
                        onChange={(e) => setProfileForm({ ...profileForm, wallet_address: e.target.value })}
                        placeholder="0x..."
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                    ) : (
                      <p className="font-mono text-sm text-gray-800">
                        {user.wallet_address || 'Nenhuma carteira cadastrada'}
                      </p>
                    )}
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">
                        Cole aqui o endereço da sua carteira MetaMask ou similar (rede Polygon)
                      </p>
                    )}
                  </div>
                </div>

                {/* Botões de ação quando editando */}
                {editing && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setProfileForm({
                          phone: user.phone || '',
                          company_name: user.company_name || '',
                          wallet_address: user.wallet_address || '',
                        });
                      }}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Status KYC */}
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      user.kyc_status === 'approved' ? 'bg-emerald-500' : 
                      user.kyc_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-gray-800">
                      Status KYC: {
                        user.kyc_status === 'approved' ? '✅ Aprovado' :
                        user.kyc_status === 'pending' ? '⏳ Em análise' : '❌ Rejeitado'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
