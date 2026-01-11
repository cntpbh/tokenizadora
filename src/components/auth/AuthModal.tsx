'use client';

import { useState } from 'react';
import { X, Mail, User, Building, Phone, CreditCard, Lock, Loader2, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase, createUser, getUserByEmail } from '@/lib/supabase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    cpf_cnpj: '',
    phone: '',
    company_name: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setErrorCode(null);
    setSuccess('');
  };

  // Formatar CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  // Validar CPF
  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
    let digit = (sum * 10) % 11;
    if (digit === 10 || digit === 11) digit = 0;
    if (digit !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
    digit = (sum * 10) % 11;
    if (digit === 10 || digit === 11) digit = 0;
    if (digit !== parseInt(numbers[10])) return false;
    
    return true;
  };

  // ==================== LOGIN COM GOOGLE ====================
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError('');

    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (googleError) {
        console.error('Erro Google:', googleError);
        setError('Erro ao conectar com Google. Tente novamente.');
        setLoadingGoogle(false);
        return;
      }

      // O redirecionamento acontece automaticamente
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao conectar com Google. Tente novamente.');
      setLoadingGoogle(false);
    }
  };

  // Verificar se email existe no sistema
  const verifyEmailExists = async (email: string): Promise<{ valid: boolean; error?: string; code?: string }> => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (!data.success) {
        return { valid: false, error: data.error, code: data.code };
      }

      return { valid: true };
    } catch (err) {
      console.error('Erro ao verificar email:', err);
      return { valid: true };
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async () => {
    if (!form.email) {
      setError('Digite seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Formato de email inválido');
      setErrorCode('INVALID_FORMAT');
      return;
    }

    setVerifying(true);
    setError('');
    setErrorCode(null);

    const verification = await verifyEmailExists(form.email);
    
    if (!verification.valid) {
      setError(verification.error || 'Email não encontrado');
      setErrorCode(verification.code || null);
      setVerifying(false);
      return;
    }

    setVerifying(false);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        console.error('Erro Supabase:', resetError);
        
        if (resetError.message.includes('rate limit')) {
          setError('Muitas tentativas. Aguarde alguns minutos.');
          setErrorCode('RATE_LIMIT');
        } else if (resetError.message.includes('User not found')) {
          setError('Email não cadastrado no sistema');
          setErrorCode('EMAIL_NOT_FOUND');
        } else {
          setError('Erro ao enviar email. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada e spam.');
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao enviar email. Tente novamente.');
    }

    setLoading(false);
  };

  // LOGIN
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('Preencha email e senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email ou senha incorretos');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Erro ao fazer login. Tente novamente.');
    }

    setLoading(false);
  };

  // REGISTRO
  const handleRegister = async () => {
    if (step === 1) {
      if (!form.email || !form.full_name || !form.password) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
      if (form.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
      setStep(2);
      return;
    }

    if (!form.cpf_cnpj) {
      setError('CPF/CNPJ é obrigatório');
      return;
    }

    const cpfNumbers = form.cpf_cnpj.replace(/\D/g, '');
    if (cpfNumbers.length === 11 && !validateCpf(form.cpf_cnpj)) {
      setError('CPF inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email já está cadastrado');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Criar registro na tabela users
      await createUser({
        email: form.email,
        full_name: form.full_name,
        cpf_cnpj: cpfNumbers,
        phone: form.phone.replace(/\D/g, ''),
        company_name: form.company_name,
        kyc_status: 'pending',
        kyc_submitted_at: new Date().toISOString(),
      });

      // Login automático
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError('Erro ao criar conta. Tente novamente.');
    }

    setLoading(false);
  };

  // Renderizar mensagem de erro
  const renderError = () => {
    if (!error) return null;

    let bgColor = 'bg-red-50 border-red-200 text-red-700';
    let extraContent = null;

    switch (errorCode) {
      case 'EMAIL_NOT_FOUND':
        extraContent = (
          <button
            onClick={() => { setMode('register'); setStep(1); setError(''); setErrorCode(null); }}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            Criar uma conta →
          </button>
        );
        break;
      case 'OAUTH_ACCOUNT':
        bgColor = 'bg-blue-50 border-blue-200 text-blue-700';
        break;
      case 'RATE_LIMIT':
        bgColor = 'bg-yellow-50 border-yellow-200 text-yellow-700';
        break;
    }

    return (
      <div className={`mb-4 p-3 border rounded-xl text-sm ${bgColor}`}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            {error}
            {extraContent}
          </div>
        </div>
      </div>
    );
  };

  // ==================== BOTÃO GOOGLE ====================
  const GoogleButton = ({ text }: { text: string }) => (
    <button
      onClick={handleGoogleLogin}
      disabled={loadingGoogle}
      className="w-full py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-3"
    >
      {loadingGoogle ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700">{text}</span>
        </>
      )}
    </button>
  );

  const Divider = () => (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500">ou</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? '👋 Bem-vindo de volta!' : 
             mode === 'reset' ? '🔑 Recuperar Senha' : '🌱 Criar Conta'}
          </h2>
          <p className="text-emerald-200 text-sm mt-1">
            {mode === 'login' ? 'Entre na sua conta para continuar' : 
             mode === 'reset' ? 'Digite seu email para recuperar a senha' :
             step === 1 ? 'Passo 1: Dados de acesso' : 'Passo 2: Dados pessoais'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderError()}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              {success}
            </div>
          )}

          {/* RESET PASSWORD */}
          {mode === 'reset' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    disabled={loading || verifying}
                  />
                </div>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading || verifying}
                className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Email de Recuperação'
                )}
              </button>

              <button
                onClick={() => { setMode('login'); setError(''); setErrorCode(null); setSuccess(''); }}
                className="w-full text-center text-emerald-600 hover:underline flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Login
              </button>
            </div>
          )}

          {/* LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Google Button */}
              <GoogleButton text="Entrar com Google" />
              
              <Divider />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setMode('reset'); setError(''); setErrorCode(null); }}
                className="text-sm text-emerald-600 hover:underline"
              >
                Esqueceu a senha?
              </button>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
              </button>

              <p className="text-center text-gray-500 text-sm">
                Não tem conta?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); setErrorCode(null); }}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          )}

          {/* REGISTER STEP 1 */}
          {mode === 'register' && step === 1 && (
            <div className="space-y-4">
              {/* Google Button */}
              <GoogleButton text="Cadastrar com Google" />
              
              <Divider />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition"
              >
                Continuar →
              </button>

              <p className="text-center text-gray-500 text-sm">
                Já tem conta?{' '}
                <button
                  onClick={() => { setMode('login'); setStep(1); setError(''); setErrorCode(null); }}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Entrar
                </button>
              </p>
            </div>
          )}

          {/* REGISTER STEP 2 */}
          {mode === 'register' && step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.cpf_cnpj}
                    onChange={(e) => handleChange('cpf_cnpj', formatCpfCnpj(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={18}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (opcional)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Nome da empresa"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
