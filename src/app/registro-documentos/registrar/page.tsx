'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Upload, Loader2, AlertCircle, Copy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { supabase, getUserByEmail } from '@/lib/supabase';
import type { User } from '@/lib/supabase';

async function calcularHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function RegistrarDocumento() {
  const [etapa, setEtapa] = useState(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [form, setForm] = useState({ titulo: '', nome: '', email: '', cpfCnpj: '', senha: '', criarConta: false });
  const [preco, setPreco] = useState<number>(0.90);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [registroId, setRegistroId] = useState('');
  const [certificadoCodigo, setCertificadoCodigo] = useState('');
  const [ipfsDocHash, setIpfsDocHash] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    carregarConfig();
    carregarUsuario();
  }, []);

  const carregarConfig = async () => {
    try {
      const res = await fetch('/api/documentos/registrar');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.price) setPreco(data.price);
      }
    } catch (e) { }
  };

  const carregarUsuario = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const userData = await getUserByEmail(session.user.email);
        if (userData) {
          setUser(userData);
          setForm(f => ({ ...f, nome: userData.full_name || '', email: userData.email || '', cpfCnpj: userData.cpf_cnpj || '' }));
        }
      }
    } catch (e) { }
  };

  useEffect(() => {
    if (!registroId || etapa !== 3) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.from('document_registrations').select('status, payment_status, certificate_code, ipfs_document_hash').eq('id', registroId).single();
        if (data?.status === 'completed' || data?.payment_status === 'completed') {
          clearInterval(interval);
          if (data.certificate_code) setCertificadoCodigo(data.certificate_code);
          if (data.ipfs_document_hash) setIpfsDocHash(data.ipfs_document_hash);
          setEtapa(4);
        }
      } catch (e) { }
    }, 3000);
    return () => clearInterval(interval);
  }, [registroId, etapa]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setErro('Arquivo muito grande. Máximo 50MB.'); return; }
    setArquivo(file);
    setForm(f => ({ ...f, titulo: file.name.replace(/\.[^/.]+$/, '') }));
    setHash(await calcularHash(file));
    setErro('');
  }

  async function gerarPix() {
    if (!form.titulo || !form.nome || !form.email) { setErro('Preencha todos os campos obrigatórios'); return; }
    if (form.criarConta && (!form.senha || form.senha.length < 6)) { setErro('Senha deve ter no mínimo 6 caracteres'); return; }

    setCarregando(true);
    setErro('');

    try {
      if (form.criarConta) {
        const { error } = await supabase.auth.signUp({ email: form.email, password: form.senha, options: { data: { name: form.nome } } });
        if (error && !error.message.includes('already registered')) throw new Error('Erro ao criar conta: ' + error.message);
      }

      const formData = new FormData();
      if (arquivo) formData.append('file', arquivo);
      formData.append('hash', hash);
      formData.append('titulo', form.titulo);
      formData.append('nome', form.nome);
      formData.append('email', form.email);
      formData.append('cpfCnpj', form.cpfCnpj || '');

      const res = await fetch('/api/documentos/registrar', { method: 'POST', body: formData });

      // Tratamento de resposta vazia ou inválida (timeout, erro de rede, etc.)
      const text = await res.text();
      if (!text) {
        throw new Error('Servidor não retornou resposta. Verifique sua conexão e tente novamente.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Resposta inválida do servidor:', text.substring(0, 500));
        throw new Error('Resposta inválida do servidor. Pode ser timeout - tente com arquivo menor ou sem arquivo.');
      }

      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao processar');

      setRegistroId(data.registro.id);
      setCertificadoCodigo(data.registro.certificado);

      if (data.pix) {
        setQrCode(data.pix.qr_code_base64);
        setPixCopiaECola(data.pix.qr_code);
        setEtapa(3);
      } else if (data.pix_error) {
        // PIX falhou - mostrar erro específico
        throw new Error('Erro ao gerar PIX: ' + data.pix_error + '. Verifique se o Mercado Pago está configurado.');
      } else {
        setEtapa(4);
      }

      if (data.ipfs?.document_hash) setIpfsDocHash(data.ipfs.document_hash);
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar');
    } finally {
      setCarregando(false);
    }
  }

  function copiarPix() {
    if (pixCopiaECola) {
      navigator.clipboard.writeText(pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-white flex flex-col">
      <Header activeTab="registro-documentos" setActiveTab={() => { }} user={user} isAdmin={false} onLoginClick={() => setShowAuthModal(true)} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a3f4d]">Registrar Documento</h1>
        </div>

        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${etapa >= step ? 'bg-[#1a3f4d] text-white' : 'bg-gray-200 text-gray-400'}`}>
                {etapa > step ? '✓' : step}
              </div>
              {step < 4 && <div className={`w-12 h-1 ${etapa > step ? 'bg-[#1a3f4d]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" /><span>{erro}</span>
            <button onClick={() => setErro('')} className="ml-auto">×</button>
          </div>
        )}

        {etapa === 1 && (
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#1a3f4d] mb-6 text-center flex items-center justify-center gap-2">
              <Upload className="w-6 h-6" /> Selecione o Documento
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-[#1a3f4d] hover:bg-[#1a3f4d]/5" onClick={() => document.getElementById('arquivo')?.click()}>
              <input id="arquivo" type="file" className="hidden" onChange={handleUpload} />
              {arquivo ? (
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-[#1a3f4d]">{arquivo.name}</p>
                  <p className="text-[#1a3f4d]/60">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="mt-3 text-xs font-mono text-[#1a3f4d]/70 break-all bg-gray-100 p-2 rounded">SHA-256: {hash.slice(0, 32)}...</p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-[#1a3f4d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#1a3f4d]" />
                  </div>
                  <p className="text-[#1a3f4d]">Clique ou arraste seu arquivo</p>
                  <p className="text-sm text-[#1a3f4d]/50">PDF, DOC, Imagens (máx 50MB)</p>
                </div>
              )}
            </div>
            <button onClick={() => arquivo && setEtapa(2)} disabled={!arquivo} className="mt-6 w-full py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold hover:bg-[#1a3f4d]/90 disabled:bg-gray-300">
              Continuar →
            </button>
          </div>
        )}

        {etapa === 2 && (
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#1a3f4d] mb-6 text-center">📝 Dados do Registro</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-1">Título *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a3f4d]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-1">Seu Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a3f4d]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a3f4d]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a3f4d] mb-1">CPF/CNPJ</label>
                <input type="text" value={form.cpfCnpj} onChange={e => setForm({ ...form, cpfCnpj: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1a3f4d]" />
              </div>
              {!user && (
                <div className="bg-[#1a3f4d]/5 border rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.criarConta} onChange={e => setForm({ ...form, criarConta: e.target.checked })} className="w-5 h-5" />
                    <span className="text-[#1a3f4d]">Criar conta</span>
                  </label>
                  {form.criarConta && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[#1a3f4d] mb-1">Senha *</label>
                      <input type="password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} className="w-full px-4 py-3 border rounded-xl" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl flex justify-between items-center">
              <span>Valor:</span>
              <span className="text-2xl font-bold text-[#b8963c]">R$ {preco.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={() => setEtapa(1)} className="flex-1 py-3 border text-[#1a3f4d] rounded-xl">← Voltar</button>
              <button onClick={gerarPix} disabled={carregando} className="flex-1 py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                {carregando ? <><Loader2 className="w-5 h-5 animate-spin" />Processando...</> : '🇧🇷 Gerar PIX'}
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-bold text-[#1a3f4d] mb-4">📱 Pague com PIX</h2>
            {qrCode && <div className="bg-white border-2 rounded-xl p-4 max-w-xs mx-auto mb-4"><img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-full" /></div>}
            <button onClick={copiarPix} className="px-6 py-3 bg-[#1a3f4d] text-white rounded-xl mb-4 flex items-center gap-2 mx-auto">
              <Copy className="w-4 h-4" />{copiado ? 'Copiado!' : 'Copiar código PIX'}
            </button>
            <p className="text-2xl font-bold text-[#b8963c] mb-4">R$ {preco.toFixed(2)}</p>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-700 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Aguardando pagamento...</p>
            </div>
            <p className="mt-4 text-sm text-[#1a3f4d]/60">Certificado: <span className="font-mono font-bold">{certificadoCodigo}</span></p>
          </div>
        )}

        {etapa === 4 && (
          <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a3f4d]">Documento Registrado!</h2>
            <div className="bg-[#1a3f4d]/5 border rounded-xl p-6 mt-6">
              <p className="text-[#1a3f4d]/60">Código do Certificado</p>
              <p className="text-3xl font-mono font-bold text-[#1a3f4d] mt-2">{certificadoCodigo}</p>
            </div>
            {ipfsDocHash && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl text-left">
                <p className="text-purple-700 font-semibold">🔗 IPFS</p>
                <a href={`https://gateway.pinata.cloud/ipfs/${ipfsDocHash}`} target="_blank" className="text-xs text-purple-600 font-mono hover:underline">{ipfsDocHash.slice(0, 30)}...</a>
              </div>
            )}
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
              <Link href={`/certificado-documento/${certificadoCodigo}`} className="px-6 py-3 bg-[#1a3f4d] text-white rounded-xl font-semibold">Ver Certificado</Link>
              <button onClick={() => window.location.reload()} className="px-6 py-3 border text-[#1a3f4d] rounded-xl">Novo Registro</button>
            </div>
          </div>
        )}
      </main>

      <Footer />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); carregarUsuario(); }} />}
    </div>
  );
}
