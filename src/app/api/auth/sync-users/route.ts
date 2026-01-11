import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client com service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  // Verificar autorização (pode adicionar uma chave secreta)
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_SYNC_KEY || 'ibedis-sync-2024';
  
  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // 1. Buscar todos os usuários da tabela users
    const { data: usersTable, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name');

    if (usersError) {
      return NextResponse.json({ error: 'Erro ao buscar users', details: usersError }, { status: 500 });
    }

    // 2. Buscar todos os usuários do Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ error: 'Erro ao buscar auth.users', details: authError }, { status: 500 });
    }

    const authEmails = new Set(authData.users.map(u => u.email?.toLowerCase()));

    // 3. Encontrar usuários que existem em users mas não em auth.users
    const missingUsers = usersTable?.filter(u => !authEmails.has(u.email?.toLowerCase())) || [];

    return NextResponse.json({
      success: true,
      total_users_table: usersTable?.length || 0,
      total_auth_users: authData.users.length,
      missing_in_auth: missingUsers.length,
      missing_users: missingUsers.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Verificar autorização
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_SYNC_KEY || 'ibedis-sync-2024';
  
  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, email } = body;

    // Ação: Enviar convite para um único email
    if (action === 'invite' && email) {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://token.ibedis.com.br'}/reset-password`
      });

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          email 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Convite enviado para ${email}`,
        user_id: data.user.id
      });
    }

    // Ação: Sincronizar todos os usuários faltantes
    if (action === 'sync-all') {
      // Buscar usuários da tabela users
      const { data: usersTable } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name');

      // Buscar usuários do Auth
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authEmails = new Set(authData?.users.map(u => u.email?.toLowerCase()));

      // Usuários faltantes
      const missingUsers = usersTable?.filter(u => !authEmails.has(u.email?.toLowerCase())) || [];

      const results = {
        total: missingUsers.length,
        success: [] as string[],
        failed: [] as { email: string; error: string }[]
      };

      // Enviar convite para cada um
      for (const user of missingUsers) {
        try {
          const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(user.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://token.ibedis.com.br'}/reset-password`,
            data: {
              full_name: user.full_name,
              users_table_id: user.id
            }
          });

          if (error) {
            results.failed.push({ email: user.email, error: error.message });
          } else {
            results.success.push(user.email);
          }

          // Pequeno delay para não sobrecarregar
          await new Promise(r => setTimeout(r, 500));
        } catch (err: any) {
          results.failed.push({ email: user.email, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sincronização concluída',
        results
      });
    }

    // Ação: Criar usuário com senha específica (para casos especiais)
    if (action === 'create-with-password' && email) {
      const tempPassword = body.password || `Ibedis@${Date.now().toString(36)}`;
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name || ''
        }
      });

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          email 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Usuário criado para ${email}`,
        user_id: data.user.id,
        temp_password: tempPassword,
        note: 'Informe a senha temporária ao usuário e peça para trocar'
      });
    }

    return NextResponse.json({ error: 'Ação inválida. Use: invite, sync-all, create-with-password' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}
