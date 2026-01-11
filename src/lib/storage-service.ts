// src/lib/storage-service.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadStampedDocument(
  buffer: Buffer,
  certificateCode: string,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const ext = fileName.split('.').pop() || 'pdf';
    const path = `documents/${certificateCode}/${certificateCode}_stamped.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl, path };
  } catch (error) {
    console.error('Upload stamped error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function uploadCertificate(
  buffer: Buffer,
  certificateCode: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const path = `certificates/${certificateCode}/${certificateCode}_certificate.pdf`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl, path };
  } catch (error) {
    console.error('Upload certificate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function uploadOriginalDocument(
  buffer: Buffer,
  certificateCode: string,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const ext = fileName.split('.').pop() || 'pdf';
    const path = `originals/${certificateCode}/${certificateCode}_original.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl, path };
  } catch (error) {
    console.error('Upload original error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
