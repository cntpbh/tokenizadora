import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IBEDIS Token - Plataforma de Ativos Sustentaveis',
  description: 'Tokenizacao e comercializacao de creditos de carbono, CPR Verde e ativos ambientais. Powered by Polygon.',
  keywords: 'carbono, creditos de carbono, tokenizacao, REDD+, CPR Verde, ESG, sustentabilidade, blockchain',
  authors: [{ name: 'IBEDIS' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'IBEDIS Token - Ativos Sustentaveis Tokenizados',
    description: 'Plataforma de tokenizacao de creditos de carbono e ativos ambientais',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IBEDIS Token - Ativos Sustentaveis Tokenizados',
    description: 'Plataforma de tokenizacao de creditos de carbono e ativos ambientais',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
