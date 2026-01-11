import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar service role para verificar usuários
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Validação de formato de email
function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Lista de domínios temporários/descartáveis
const disposableDomains = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com',
  'maildrop.cc', 'yopmail.com', 'getnada.com', 'mohmal.com',
  'tempail.com', 'emailondeck.com', 'dispostable.com'
];

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.some(d => domain?.includes(d));
}

// Verificar se o email existe no sistema
async function checkEmailExists(email: string): Promise<{ 
  exists: boolean; 
  userId?: string;
  provider?: string;
}> {
  try {
    // 1. Verificar na tabela auth.users (usando admin)
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authData?.users) {
      const authUser = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (authUser) {
        const provider = authUser.app_metadata?.provider || 'email';
        return { exists: true, userId: authUser.id, provider };
      }
    }

    // 2. Verificar na tabela users customizada
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (userData) {
      return { exists: true, userId: userData.id, provider: 'email' };
    }

    return { exists: false };
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return { exists: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório',
        code: 'EMAIL_REQUIRED'
      }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Verificar formato do email
    if (!isValidEmailFormat(emailLower)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de email inválido',
        code: 'INVALID_FORMAT'
      }, { status: 400 });
    }

    // 2. Verificar se é email descartável
    if (isDisposableEmail(emailLower)) {
      return NextResponse.json({
        success: false,
        error: 'Email temporário não é permitido',
        code: 'DISPOSABLE_EMAIL'
      }, { status: 400 });
    }

    // 3. Verificar se o email existe no sistema
    const result = await checkEmailExists(emailLower);
    
    if (!result.exists) {
      return NextResponse.json({
        success: false,
        error: 'Este email não está cadastrado no sistema',
        code: 'EMAIL_NOT_FOUND'
      }, { status: 404 });
    }

    // 4. Verificar se é conta OAuth
    if (result.provider && result.provider !== 'email') {
      return NextResponse.json({
        success: false,
        error: `Esta conta foi criada com ${result.provider}. Use ${result.provider} para fazer login.`,
        code: 'OAUTH_ACCOUNT',
        provider: result.provider
      }, { status: 400 });
    }

    // Email válido e existe
    return NextResponse.json({
      success: true,
      message: 'Email verificado com sucesso',
      canRecover: true
    });

  } catch (error: any) {
    console.error('Erro na verificação de email:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao verificar email',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
