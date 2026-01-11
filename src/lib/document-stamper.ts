/**
 * IBEDIS Document Stamper
 * Adiciona carimbo de autenticidade em PDFs e imagens
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import QRCode from 'qrcode';

const IBEDIS_BLUE = { r: 0.102, g: 0.247, b: 0.302 }; // #1a3f4d
const IBEDIS_GOLD = { r: 0.722, g: 0.588, b: 0.235 }; // #b8963c

export interface StampConfig {
  certificateCode: string;
  documentHash: string;
  registrationDate: string;
  requesterName: string;
  verificationUrl?: string;
}

export interface StampResult {
  success: boolean;
  stampedBuffer?: Buffer;
  error?: string;
}

async function generateQRCode(url: string, size: number = 100): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: '#1a3f4d', light: '#ffffff' }
  });
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
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function stampPDF(pdfBuffer: Buffer, config: StampConfig): Promise<StampResult> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const verificationUrl = config.verificationUrl ||
      `https://token.ibedis.com.br/certificado-documento/${config.certificateCode}`;

    const qrCodeBase64 = await generateQRCode(verificationUrl, 80);
    const qrCodeBytes = base64ToUint8Array(qrCodeBase64);
    const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const isLastPage = i === totalPages - 1;

      const stampHeight = isLastPage ? 85 : 45;
      const stampY = 10;

      page.drawRectangle({
        x: 20,
        y: stampY,
        width: width - 40,
        height: stampHeight,
        color: rgb(IBEDIS_BLUE.r, IBEDIS_BLUE.g, IBEDIS_BLUE.b),
        opacity: 0.95,
      });

      page.drawRectangle({
        x: 20,
        y: stampY,
        width: width - 40,
        height: stampHeight,
        borderColor: rgb(IBEDIS_GOLD.r, IBEDIS_GOLD.g, IBEDIS_GOLD.b),
        borderWidth: 2,
      });

      page.drawText('🏛️ IBEDIS - Documento Registrado em Blockchain', {
        x: 30,
        y: stampY + stampHeight - 15,
        size: 8,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      const line2 = `Certificado: ${config.certificateCode} | Data: ${formatDate(config.registrationDate)}`;
      page.drawText(line2, {
        x: 30,
        y: stampY + stampHeight - 28,
        size: 7,
        font: fontRegular,
        color: rgb(1, 1, 1),
      });

      const hashDisplay = `Hash SHA-256: ${config.documentHash.substring(0, 32)}...`;
      page.drawText(hashDisplay, {
        x: 30,
        y: stampY + stampHeight - 40,
        size: 6,
        font: fontMono,
        color: rgb(0.9, 0.9, 0.9),
      });

      if (isLastPage) {
        const qrSize = 60;
        const qrX = width - 90;
        const qrY = stampY + 12;

        page.drawImage(qrCodeImage, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });

        page.drawText('Verifique', {
          x: qrX + 12,
          y: qrY - 8,
          size: 5,
          font: fontRegular,
          color: rgb(1, 1, 1),
        });

        page.drawText(`Solicitante: ${config.requesterName}`, {
          x: 30,
          y: stampY + 20,
          size: 6,
          font: fontRegular,
          color: rgb(0.9, 0.9, 0.9),
        });

        page.drawText(`Verificar: token.ibedis.com.br/certificado-documento/${config.certificateCode}`, {
          x: 30,
          y: stampY + 8,
          size: 5,
          font: fontMono,
          color: rgb(IBEDIS_GOLD.r, IBEDIS_GOLD.g, IBEDIS_GOLD.b),
        });
      }

      page.drawText(`${i + 1}/${totalPages}`, {
        x: width - 50,
        y: height - 20,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const stampedPdfBytes = await pdfDoc.save();
    return {
      success: true,
      stampedBuffer: Buffer.from(stampedPdfBytes)
    };
  } catch (error: any) {
    console.error('Erro ao carimbar PDF:', error);
    return { success: false, error: error.message };
  }
}

export async function stampImage(imageBuffer: Buffer, config: StampConfig): Promise<StampResult> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    const stampHeight = 100;
    const newHeight = originalHeight + stampHeight;

    const verificationUrl = config.verificationUrl ||
      `https://token.ibedis.com.br/certificado-documento/${config.certificateCode}`;

    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 80,
      margin: 1,
      color: { dark: '#1a3f4d', light: '#ffffff' }
    });

    const stampSvg = `
      <svg width="${originalWidth}" height="${stampHeight}">
        <rect width="${originalWidth}" height="${stampHeight}" fill="#1a3f4d" opacity="0.95"/>
        <rect width="${originalWidth}" height="${stampHeight}" fill="none" stroke="#b8963c" stroke-width="2"/>
        <text x="20" y="25" font-family="Arial" font-size="14" font-weight="bold" fill="white">
          🏛️ IBEDIS - Documento Registrado em Blockchain
        </text>
        <text x="20" y="45" font-family="Arial" font-size="11" fill="white">
          Certificado: ${config.certificateCode} | Data: ${formatDate(config.registrationDate)}
        </text>
        <text x="20" y="62" font-family="Courier" font-size="9" fill="#e0e0e0">
          Hash SHA-256: ${config.documentHash.substring(0, 40)}...
        </text>
        <text x="20" y="78" font-family="Arial" font-size="10" fill="#e0e0e0">
          Solicitante: ${config.requesterName}
        </text>
        <text x="20" y="92" font-family="Courier" font-size="8" fill="#b8963c">
          Verificar: token.ibedis.com.br/certificado-documento/${config.certificateCode}
        </text>
      </svg>
    `;

    const stampBuffer = await sharp(Buffer.from(stampSvg))
      .png()
      .toBuffer();

    const stampedImage = await sharp({
      create: {
        width: originalWidth,
        height: newHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .composite([
        { input: imageBuffer, top: 0, left: 0 },
        { input: stampBuffer, top: originalHeight, left: 0 },
        { input: qrCodeBuffer, top: originalHeight + 10, left: originalWidth - 90 }
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    return {
      success: true,
      stampedBuffer: stampedImage
    };
  } catch (error: any) {
    console.error('Erro ao carimbar imagem:', error);
    return { success: false, error: error.message };
  }
}

export async function stampDocument(
  fileBuffer: Buffer,
  fileType: string,
  config: StampConfig
): Promise<StampResult> {
  const isPdf = fileType === 'application/pdf' || fileType.includes('pdf');
  const isJpg = fileType === 'image/jpeg' || fileType === 'image/jpg' || 
                fileType.includes('jpeg') || fileType.includes('jpg');

  if (isPdf) {
    return await stampPDF(fileBuffer, config);
  } else if (isJpg) {
    return await stampImage(fileBuffer, config);
  } else {
    return {
      success: false,
      error: `Tipo não suportado: ${fileType}. Use PDF ou JPG.`
    };
  }
}
