import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface DocumentoRegistrado {
  id: string;
  hash: string;
  ipfs_hash: string;
  titulo: string;
  criado_em: string;
  email_usuario: string;
}

export async function generateCertificadoPDF(
  documento: DocumentoRegistrado
): Promise<Buffer> {
  const doc = new jsPDF();

  // Gerar QR Code do IPFS
  const qrDataUrl = await QRCode.toDataURL(
    `https://gateway.pinata.cloud/ipfs/${documento.ipfs_hash}`,
    {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }
  );

  // Cabeçalho
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO DE REGISTRO', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Blockchain Document Registry - IBEDIS', 105, 40, { align: 'center' });

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // Dados do documento
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DO DOCUMENTO', 20, 65);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Título:`, 20, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(documento.titulo, 40, 80);

  doc.setFont('helvetica', 'normal');
  doc.text(`Hash SHA-256:`, 20, 90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(documento.hash, 20, 97);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`IPFS CID:`, 20, 107);
  doc.setFont('helvetica', 'bold');
  doc.text(documento.ipfs_hash, 20, 114);

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Data de Registro: ${new Date(documento.criado_em).toLocaleString('pt-BR')}`,
    20,
    124
  );

  // QR Code
  doc.addImage(qrDataUrl, 'PNG', 75, 140, 60, 60);
  doc.setFontSize(9);
  doc.text('Escaneie para verificar no IPFS', 105, 210, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'IBEDIS - Instituto Brasileiro de Educação e Desenvolvimento em Inovação Sustentável',
    105,
    270,
    { align: 'center' }
  );
  doc.text('www.ibedis.org | Metodologia VISIA - ISBN 978-65-01-58740-0', 105, 280, {
    align: 'center'
  });

  return Buffer.from(doc.output('arraybuffer'));
}
