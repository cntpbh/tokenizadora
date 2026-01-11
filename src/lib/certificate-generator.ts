/**
 * IBEDIS Certificate Generator
 * Gera certificado PDF formal estilo certidão
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export interface CertificateData {
  certificateCode: string;
  documentTitle: string;
  documentHash: string;
  requesterName: string;
  requesterEmail: string;
  registrationDate: string;
  txHash?: string;
  fileName?: string;
  fileSize?: number;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Cores
  const blue = rgb(0.102, 0.247, 0.302); // #1a3f4d
  const gold = rgb(0.722, 0.588, 0.235); // #b8963c
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);

  let y = height - 60;

  // ========== HEADER COM BORDA ==========
  page.drawRectangle({
    x: 30,
    y: y - 100,
    width: width - 60,
    height: 100,
    color: blue,
  });

  page.drawRectangle({
    x: 30,
    y: y - 100,
    width: width - 60,
    height: 100,
    borderColor: gold,
    borderWidth: 3,
  });

  // Ícone (emoji)
  page.drawText('🏛️', {
    x: width / 2 - 20,
    y: y - 35,
    size: 40,
  });

  // Título
  page.drawText('CERTIFICADO DE AUTENTICIDADE', {
    x: width / 2 - 150,
    y: y - 65,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Registro Digital de Documento em Blockchain', {
    x: width / 2 - 125,
    y: y - 85,
    size: 10,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  y -= 130;

  // ========== CÓDIGO DO CERTIFICADO ==========
  page.drawText('NÚMERO DO CERTIFICADO', {
    x: width / 2 - 80,
    y: y,
    size: 9,
    font: fontRegular,
    color: gray,
  });

  y -= 20;

  page.drawText(data.certificateCode, {
    x: width / 2 - (data.certificateCode.length * 5),
    y: y,
    size: 20,
    font: fontBold,
    color: gold,
  });

  y -= 35;

  // ========== BADGE VERIFICADO ==========
  const badgeWidth = 280;
  const badgeX = (width - badgeWidth) / 2;

  page.drawRectangle({
    x: badgeX,
    y: y - 25,
    width: badgeWidth,
    height: 30,
    color: rgb(0.9, 0.98, 0.9),
    borderColor: rgb(0.2, 0.7, 0.3),
    borderWidth: 2,
  });

  page.drawText('✓ DOCUMENTO VERIFICADO E REGISTRADO', {
    x: badgeX + 30,
    y: y - 17,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.5, 0.2),
  });

  y -= 50;

  // ========== SEÇÃO: DADOS DO DOCUMENTO ==========
  page.drawText('DADOS DO DOCUMENTO', {
    x: 50,
    y: y,
    size: 11,
    font: fontBold,
    color: blue,
  });

  y -= 5;

  page.drawLine({
    start: { x: 50, y: y },
    end: { x: width - 50, y: y },
    thickness: 2,
    color: gold,
  });

  y -= 25;

  // Título
  page.drawRectangle({
    x: 50,
    y: y - 30,
    width: width - 100,
    height: 35,
    color: lightGray,
  });

  page.drawText('Título:', {
    x: 60,
    y: y - 10,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText(data.documentTitle, {
    x: 60,
    y: y - 23,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
    maxWidth: width - 120,
  });

  y -= 45;

  // Hash SHA-256
  page.drawRectangle({
    x: 50,
    y: y - 40,
    width: width - 100,
    height: 45,
    color: lightGray,
  });

  page.drawText('Hash SHA-256 (Impressão Digital do Arquivo):', {
    x: 60,
    y: y - 10,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  const hash1 = data.documentHash.substring(0, 48);
  const hash2 = data.documentHash.substring(48);

  page.drawText(hash1, {
    x: 60,
    y: y - 23,
    size: 8,
    font: fontMono,
    color: rgb(0, 0, 0),
  });

  page.drawText(hash2, {
    x: 60,
    y: y - 35,
    size: 8,
    font: fontMono,
    color: rgb(0, 0, 0),
  });

  y -= 60;

  // ========== SEÇÃO: SOLICITANTE ==========
  page.drawText('DADOS DO SOLICITANTE', {
    x: 50,
    y: y,
    size: 11,
    font: fontBold,
    color: blue,
  });

  y -= 5;

  page.drawLine({
    start: { x: 50, y: y },
    end: { x: width - 50, y: y },
    thickness: 2,
    color: gold,
  });

  y -= 25;

  // Grid 2 colunas
  const col1X = 50;
  const col2X = width / 2 + 20;
  const boxWidth = (width / 2) - 70;

  page.drawRectangle({
    x: col1X,
    y: y - 30,
    width: boxWidth,
    height: 35,
    color: lightGray,
  });

  page.drawText('Nome:', {
    x: col1X + 10,
    y: y - 10,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText(data.requesterName, {
    x: col1X + 10,
    y: y - 23,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
    maxWidth: boxWidth - 20,
  });

  page.drawRectangle({
    x: col2X,
    y: y - 30,
    width: boxWidth,
    height: 35,
    color: lightGray,
  });

  page.drawText('Email:', {
    x: col2X + 10,
    y: y - 10,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText(data.requesterEmail, {
    x: col2X + 10,
    y: y - 23,
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
    maxWidth: boxWidth - 20,
  });

  y -= 45;

  // Data de registro
  page.drawRectangle({
    x: col1X,
    y: y - 30,
    width: boxWidth,
    height: 35,
    color: lightGray,
  });

  page.drawText('Data de Registro:', {
    x: col1X + 10,
    y: y - 10,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText(formatDate(data.registrationDate), {
    x: col1X + 10,
    y: y - 23,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Arquivo
  if (data.fileName) {
    page.drawRectangle({
      x: col2X,
      y: y - 30,
      width: boxWidth,
      height: 35,
      color: lightGray,
    });

    page.drawText('Arquivo Original:', {
      x: col2X + 10,
      y: y - 10,
      size: 8,
      font: fontRegular,
      color: gray,
    });

    const displayName = data.fileName.length > 25 
      ? `${data.fileName.substring(0, 25)}...` 
      : data.fileName;

    page.drawText(displayName, {
      x: col2X + 10,
      y: y - 23,
      size: 8,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });
  }

  y -= 55;

  // ========== BLOCKCHAIN ==========
  page.drawRectangle({
    x: 50,
    y: y - 60,
    width: width - 100,
    height: 65,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawRectangle({
    x: 50,
    y: y - 60,
    width: width - 100,
    height: 65,
    borderColor: gold,
    borderWidth: 2,
  });

  page.drawText('🔗 REGISTRO NA BLOCKCHAIN', {
    x: 60,
    y: y - 15,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('✓ Verificado', {
    x: width - 120,
    y: y - 15,
    size: 9,
    font: fontBold,
    color: rgb(0.4, 0.9, 0.5),
  });

  page.drawText('Rede: Polygon (MATIC) Padrão: ERC-1155', {
    x: 60,
    y: y - 33,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.8, 0.8),
  });

  if (data.txHash) {
    page.drawText(`TX: ${data.txHash.substring(0, 40)}...`, {
      x: 60,
      y: y - 48,
      size: 7,
      font: fontMono,
      color: rgb(0.6, 0.8, 1),
    });
  }

  y -= 80;

  // ========== QR CODE + VERIFICAÇÃO ==========
  const qrCodeUrl = `https://token.ibedis.com.br/certificado-documento/${data.certificateCode}`;
  const qrCodeBase64 = await QRCode.toDataURL(qrCodeUrl, {
    width: 120,
    margin: 1,
    color: { dark: '#1a3f4d', light: '#ffffff' }
  });

  const qrCodeBytes = base64ToUint8Array(qrCodeBase64);
  const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);

  page.drawRectangle({
    x: 50,
    y: y - 80,
    width: width - 100,
    height: 85,
    color: lightGray,
  });

  page.drawImage(qrCodeImage, {
    x: 65,
    y: y - 75,
    width: 70,
    height: 70,
  });

  page.drawText('Escaneie para verificar', {
    x: 155,
    y: y - 25,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('na blockchain Polygon', {
    x: 155,
    y: y - 38,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText('Verificar em:', {
    x: 155,
    y: y - 58,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText('token.ibedis.com.br', {
    x: 155,
    y: y - 70,
    size: 10,
    font: fontBold,
    color: blue,
  });

  // ========== ASSINATURA ==========
  y = 140;

  page.drawLine({
    start: { x: width / 2 - 100, y: y },
    end: { x: width / 2 + 100, y: y },
    thickness: 1,
    color: gray,
  });

  page.drawText('Wemerson Marinho', {
    x: width / 2 - 50,
    y: y - 18,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('Presidente do Conselho de Administração', {
    x: width / 2 - 95,
    y: y - 32,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  // ========== FOOTER ==========
  page.drawText('Metodologia VISIA - ISBN 978-65-01-58740-0 • MCTI/FINEP', {
    x: width / 2 - 135,
    y: 60,
    size: 7,
    font: fontRegular,
    color: gray,
  });

  page.drawText('Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável', {
    x: width / 2 - 175,
    y: 48,
    size: 7,
    font: fontRegular,
    color: gray,
  });

  page.drawText(`© ${new Date().getFullYear()} IBEDIS. Todos os direitos reservados.`, {
    x: width / 2 - 90,
    y: 36,
    size: 7,
    font: fontRegular,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
