import { NextRequest, NextResponse } from 'next/server';

// Esta API foi descontinuada.
// O registro de documentos agora é feito diretamente via carteira conectada no frontend.
// Veja: src/components/settings/DocumentsManager.tsx

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    error: 'Esta API foi descontinuada. O registro de documentos agora é feito via carteira conectada.' 
  }, { status: 410 }); // 410 Gone
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API descontinuada. Use a interface de admin com carteira conectada.' 
  }, { status: 410 });
}
