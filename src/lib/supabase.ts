import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==================== LAZY INITIALIZATION ====================
// CORREÇÃO: Não criar cliente durante import - apenas quando usado
let _supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabaseInstance) return _supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL ou ANON_KEY não configuradas');
  }
  
  _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return _supabaseInstance;
}

// Export como Proxy para manter compatibilidade com código existente
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return (getSupabaseClient() as any)[prop];
  }
});

// ==================== INTERFACES ====================

export interface Project {
  id?: string;
  token_id?: number;
  contract_address?: string;
  name: string;
  description?: string;
  asset_type: string;
  owner_name?: string;
  owner_wallet?: string;
  location?: string;
  total_credits: number;
  available_credits?: number;
  total_supply?: number;
  available_supply?: number;
  price_brl: number;
  min_purchase?: number;
  min_purchase_reason?: string;
  isin?: string;
  image_url?: string;
  video_url?: string;
  document_url?: string;
  institution_name?: string;
  institution_description?: string;
  institution_url?: string;
  tx_hash?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  cpf_cnpj: string;
  phone?: string;
  company_name?: string;
  wallet_address?: string;
  kyc_status?: string;
  kyc_submitted_at?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id?: string;
  project_id?: string;
  user_id?: string;
  type: string;
  buyer_email?: string;
  buyer_name?: string;
  buyer_cpf_cnpj?: string;
  buyer_wallet?: string;
  amount: number;
  price_total: number;
  payment_method?: string;
  payment_status?: string;
  payment_id?: string;
  certificate_code?: string;
  certificate_url?: string;
  tx_hash?: string;
  notes?: string;
  created_at?: string;
}

export interface Certificate {
  id?: string;
  transaction_id?: string;
  project_id?: string;
  user_id?: string;
  certificate_code: string;
  holder_name: string;
  holder_cpf_cnpj: string;
  holder_company?: string;
  token_amount: number;
  token_type: string;
  project_name: string;
  project_location?: string;
  tx_hash?: string;
  issue_date: string;
  valid_until?: string;
  qr_code_data: string;
  pdf_url?: string;
  status?: string;
  created_at?: string;
}

export interface PlatformSettings {
  id?: string;
  pix_enabled?: boolean;
  pix_key?: string;
  pix_recipient_name?: string;
  crypto_enabled?: boolean;
  crypto_wallet_address?: string;
  crypto_accepted_tokens?: string[];
  stripe_enabled?: boolean;
  stripe_public_key?: string;
  stripe_secret_key?: string;
  email_provider?: string;
  email_api_key?: string;
  email_from_address?: string;
  email_from_name?: string;
  platform_name?: string;
  platform_logo_url?: string;
  platform_favicon_url?: string;
  contact_email?: string;
  contact_phone?: string;
  certificate_logo_url?: string;
  certificate_signature_url?: string;
  certificate_signer_name?: string;
  certificate_signer_title?: string;
  updated_at?: string;
}

// ==================== PROJETOS ====================

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createProject(project: Project) {
  console.log('📝 Criando projeto:', project.name);
  
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar projeto:', error.message, error.details);
    throw new Error(`Falha ao salvar projeto: ${error.message}`);
  }
  
  console.log('✅ Projeto criado:', data?.id);
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ==================== USUÁRIOS ====================

export async function createUser(user: Omit<User, 'id'>) {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return [];
  }
}

// ==================== TRANSAÇÕES ====================

export async function getTransactions(limit = 10) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getAllTransactionsAdmin(filters?: {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        projects:project_id (id, name, token_id, image_url, asset_type, location, available_supply, total_credits)
      `)
      .order('created_at', { ascending: false });

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('payment_status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`buyer_email.ilike.%${filters.search}%,tx_hash.ilike.%${filters.search}%,payment_id.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro na query:', error);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    return [];
  }
}

export async function updateTransactionStatus(
  transactionId: string, 
  updates: {
    payment_status?: string;
    tx_hash?: string;
    notes?: string;
    verified_manually?: boolean;
    verified_at?: string;
    verified_by?: string;
  }
) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTransactionsSummary() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('type, payment_status, price_total, payment_method');

    if (error) throw error;

    const summary = {
      total: data?.length || 0,
      totalValue: 0,
      byType: { pix: 0, crypto: 0 },
      byStatus: { pending: 0, completed: 0, failed: 0 },
      byCrypto: { MATIC: 0, USDT: 0, USDC: 0 },
    };

    data?.forEach(tx => {
      summary.totalValue += tx.price_total || 0;
      
      if (tx.type === 'pix') summary.byType.pix++;
      if (tx.type === 'crypto') summary.byType.crypto++;
      
      if (tx.payment_status === 'pending') summary.byStatus.pending++;
      if (tx.payment_status === 'completed') summary.byStatus.completed++;
      if (tx.payment_status === 'failed') summary.byStatus.failed++;

      if (tx.type === 'crypto' && tx.payment_method) {
        if (tx.payment_method === 'MATIC') summary.byCrypto.MATIC++;
        if (tx.payment_method === 'USDT') summary.byCrypto.USDT++;
        if (tx.payment_method === 'USDC') summary.byCrypto.USDC++;
      }
    });

    return summary;
  } catch (err) {
    console.error('Erro ao buscar resumo:', err);
    return null;
  }
}

export async function getUserTransactions(userId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    return [];
  }
}

export async function createTransaction(transaction: Transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== CERTIFICADOS ====================

export async function getUserCertificates(userId: string) {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar certificados:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar certificados:', err);
    return [];
  }
}

export async function getCertificateByCode(code: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_code', code)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createCertificate(certificate: Certificate) {
  const { data, error } = await supabase
    .from('certificates')
    .insert([certificate])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== CONFIGURAÇÕES ====================

export async function getSettings(): Promise<PlatformSettings | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
  return data;
}

export async function updateSettings(settings: Partial<PlatformSettings>) {
  console.log('🔄 updateSettings chamado com:', Object.keys(settings));
  
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('platform_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    console.log('📋 Registro existente:', existing?.id || 'NENHUM');

    if (fetchError) {
      console.error('❌ Erro ao buscar settings:', fetchError);
      throw fetchError;
    }

    const updateData = {
      ...settings,
      updated_at: new Date().toISOString()
    };

    if (existing?.id) {
      console.log('📝 Atualizando ID:', existing.id);
      
      const { data, error } = await supabase
        .from('platform_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select();
      
      if (error) {
        console.error('❌ Erro UPDATE:', error.message, error.details, error.hint);
        throw new Error(`Falha ao atualizar: ${error.message}`);
      }
      
      console.log('✅ Atualizado com sucesso:', data);
      return data?.[0] || data;
    } else {
      console.log('📝 Criando novo registro...');
      
      const { data, error } = await supabase
        .from('platform_settings')
        .insert([updateData])
        .select();
      
      if (error) {
        console.error('❌ Erro INSERT:', error.message, error.details, error.hint);
        throw new Error(`Falha ao criar: ${error.message}`);
      }
      
      console.log('✅ Criado com sucesso:', data);
      return data?.[0] || data;
    }
  } catch (err: any) {
    console.error('❌ Erro em updateSettings:', err);
    throw err;
  }
}

// ==================== ESTATÍSTICAS ====================

export async function getStats() {
  try {
    const [projectsRes, transactionsRes, usersRes] = await Promise.all([
      supabase.from('projects').select('total_credits, status'),
      supabase.from('transactions').select('price_total, payment_status'),
      supabase.from('users').select('id')
    ]);

    const projects = projectsRes.data || [];
    const transactions = transactionsRes.data || [];
    const users = usersRes.data || [];

    const activeProjects = projects.filter(p => p.status === 'active');
    const totalCredits = activeProjects.reduce((sum, p) => sum + (p.total_credits || 0), 0);
    const completedTx = transactions.filter(t => t.payment_status === 'completed');
    const totalVolume = completedTx.reduce((sum, t) => sum + (t.price_total || 0), 0);

    return {
      totalCredits: totalCredits.toLocaleString(),
      projects: activeProjects.length,
      volume: `R$ ${totalVolume.toLocaleString('pt-BR')}`,
      companies: users.length
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      totalCredits: '0',
      projects: 0,
      volume: 'R$ 0',
      companies: 0
    };
  }
}

// ==================== HELPERS ====================

export function generateCertificateCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IBEDIS-${timestamp}-${random}`;
}

export function generateQRCodeData(certificateCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ibedis-token-platform.vercel.app';
  return `${baseUrl}/?verificar=${certificateCode}`;
}

// ==================== EMAIL ====================

export interface EmailData {
  to: string;
  template: 'certificate' | 'welcome' | 'passwordReset';
  data: {
    holderName?: string;
    projectName?: string;
    tokenAmount?: number;
    tokenType?: string;
    totalPrice?: string;
    paymentMethod?: string;
    certificateCode?: string;
    txHash?: string;
    userName?: string;
    resetUrl?: string;
    platformUrl?: string;
    [key: string]: any;
  };
}

export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro ao enviar email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

// ==================== DOCUMENTOS ====================

export interface Document {
  id?: string;
  project_id?: string | null;
  parent_document_id?: string | null;
  category: string;
  subcategory?: string;
  title: string;
  description?: string;
  document_url?: string;
  document_number?: string;
  tx_hash?: string;
  ipfs_hash?: string;
  status?: string;
  visibility?: string;
  publish_date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  project?: Project;
}

export async function getAllDocuments() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        project:projects(id, name, token_id, asset_type, status)
      `)
      .eq('status', 'published')
      .order('publish_date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar documentos:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar documentos:', err);
    return [];
  }
}

export async function getDocumentsByProject(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'published')
      .order('publish_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar documentos do projeto:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar documentos do projeto:', err);
    return [];
  }
}

export async function getInstitutionalDocuments() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .is('project_id', null)
      .eq('status', 'published')
      .order('category', { ascending: true })
      .order('publish_date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar documentos institucionais:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar documentos institucionais:', err);
    return [];
  }
}

export async function getDocumentsAdmin() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        project:projects(id, name, token_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar documentos (admin):', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar documentos (admin):', err);
    return [];
  }
}

export async function createDocument(doc: Document) {
  console.log('📄 Criando documento:', doc.title);
  
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      ...doc,
      status: doc.status || 'published',
      visibility: doc.visibility || 'public',
      publish_date: doc.publish_date || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar documento:', error.message);
    throw new Error(`Falha ao salvar documento: ${error.message}`);
  }
  
  console.log('✅ Documento criado:', data?.id);
  return data;
}

export async function updateDocument(id: string, updates: Partial<Document>) {
  const { data, error } = await supabase
    .from('documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao atualizar documento:', error.message);
    throw new Error(`Falha ao atualizar documento: ${error.message}`);
  }
  
  return data;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ Erro ao deletar documento:', error.message);
    throw new Error(`Falha ao deletar documento: ${error.message}`);
  }
  
  return true;
}

// ==================== DOCUMENT REGISTRATIONS (Blockchain) ====================

export interface DocumentRegistration {
  id?: string;
  user_id?: string;
  requester_name?: string;
  requester_email?: string;
  requester_cpf_cnpj?: string;
  title: string;
  description?: string;
  category: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  document_hash: string;
  tx_hash?: string;
  block_number?: number;
  certificate_code: string;
  certificate_url?: string;
  price?: number;
  payment_method?: string;
  payment_status?: string;
  payment_id?: string;
  paid_at?: string;
  status?: string;
  created_at?: string;
  registered_at?: string;
}

export function generateDocumentCertificateCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}

export async function createDocumentRegistration(registration: Partial<DocumentRegistration>) {
  console.log('📝 Criando registro de documento:', registration.title);
  
  const { data, error } = await supabase
    .from('document_registrations')
    .insert([{
      ...registration,
      certificate_code: registration.certificate_code || generateDocumentCertificateCode(),
      status: 'pending',
      payment_status: 'pending',
      price: registration.price || 29.90,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar registro:', error.message);
    throw new Error(`Falha ao criar registro: ${error.message}`);
  }
  
  console.log('✅ Registro criado:', data.id);
  return data;
}

export async function updateDocumentRegistration(id: string, updates: Partial<DocumentRegistration>) {
  const { data, error } = await supabase
    .from('document_registrations')
    .update({
      ...updates,
      registered_at: updates.tx_hash ? new Date().toISOString() : undefined,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao atualizar registro:', error.message);
    throw new Error(`Falha ao atualizar registro: ${error.message}`);
  }
  
  return data;
}

export async function getUserDocumentRegistrations(userId: string) {
  const { data, error } = await supabase
    .from('document_registrations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar registros do usuário:', error.message);
    return [];
  }
  
  return data || [];
}

export async function getDocumentRegistrationsByEmail(email: string) {
  const { data, error } = await supabase
    .from('document_registrations')
    .select('*')
    .eq('requester_email', email)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar registros por email:', error.message);
    return [];
  }
  
  return data || [];
}

export async function getDocumentRegistrationByCode(certificateCode: string) {
  const { data, error } = await supabase
    .from('document_registrations')
    .select('*')
    .eq('certificate_code', certificateCode)
    .single();
  
  if (error) {
    console.error('❌ Registro não encontrado:', certificateCode);
    return null;
  }
  
  return data;
}

export async function getDocumentRegistrationByHash(documentHash: string) {
  const { data, error } = await supabase
    .from('document_registrations')
    .select('*')
    .eq('document_hash', documentHash)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function getAllDocumentRegistrations() {
  const { data, error } = await supabase
    .from('document_registrations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar registros:', error.message);
    return [];
  }
  
  return data || [];
}

export async function getDocumentRegistrationStats() {
  try {
    const { data, error } = await supabase
      .from('document_registrations')
      .select('status, payment_status, price');
    
    if (error) throw error;
    
    const registrations = data || [];
    const completed = registrations.filter(r => r.status === 'completed');
    const totalRevenue = completed.reduce((sum, r) => sum + (r.price || 0), 0);
    
    return {
      total: registrations.length,
      completed: completed.length,
      pending: registrations.filter(r => r.status === 'pending').length,
      totalRevenue,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { total: 0, completed: 0, pending: 0, totalRevenue: 0 };
  }
}
