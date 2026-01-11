'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle, Eye, EyeOff, AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      setCheckingToken(true);
      
      // Verificar se há erro na URL (link expirado/inválido)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorCode = hashParams.get('error_code');
      const errorDesc = hashParams.get('error_description');
      
      if (errorCode === 'otp_expired' || errorDesc?.includes('expired')) {
        setLinkExpired(true);
        setCheckingToken(false);
        return;
      }
      
      // Verificar se há token de recovery válido
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (error) {
            console.error('Erro ao setar sessão:', error);
            setLinkExpired(true);
          } else if (data.session) {
            setHasValidToken(true);
          }
        } catch (err) {
          console.error('Erro:', err);
          setLinkExpired(true);
        }
      } else {
        // Verificar sessão existente
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidToken(true);
        } else {
          // Sem token na URL e sem sessão = link inválido ou acesso direto
          setLinkExpired(true);
        }
      }
      
      setCheckingToken(false);
    };
    
    checkSession();
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      setError('Digite seu email');
      return;
    }
    
    setSendingEmail(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
      }
    } catch (err: any) {
      setError('Erro ao enviar email. Tente novamente.');
    }
    
    setSendingEmail(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setLinkExpired(true);
        } else {
          setError(updateError.message);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      setError('Erro ao atualizar senha. Tente novamente.');
    }

    setLoading(false);
  };

  // Loading
  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando link...</p>
        </div>
      </div>
    );
  }

  // Sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Senha Atualizada! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado...
          </p>
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Link expirado - solicitar novo
  if (linkExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Link Expirado</h1>
            <p className="text-amber-100 text-sm mt-1">Solicite um novo link de recuperação</p>
          </div>

          <div className="p-6">
            {emailSent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Email Enviado!</h2>
                <p className="text-gray-600 mb-4">
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </p>
                <p className="text-sm text-gray-500">
                  Não recebeu? Verifique a pasta de spam ou aguarde alguns minutos.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4 text-center">
                  O link de recuperação expirou ou é inválido. Digite seu email para receber um novo link.
                </p>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seu Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleResendEmail}
                  disabled={sendingEmail}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-5 h-5 mr-2" />
                  )}
                  Enviar Novo Link
                </button>
              </>
            )}
          </div>

          <div className="px-6 pb-6 text-center">
            <a href="/" className="text-emerald-600 hover:underline text-sm">
              ← Voltar para página inicial
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de nova senha
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Redefinir Senha</h1>
          <p className="text-emerald-200 text-sm mt-1">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Salvar Nova Senha'
            )}
          </button>
        </form>

        <div className="px-6 pb-6 text-center">
          <a href="/" className="text-emerald-600 hover:underline text-sm">
            ← Voltar para página inicial
          </a>
        </div>
      </div>
    </div>
  );
}
