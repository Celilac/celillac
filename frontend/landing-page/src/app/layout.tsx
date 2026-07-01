import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'CeLiLac — Segurança Alimentar para Celíacos',
  description:
    'Plataforma de verificação de alérgenos para celíacos e pessoas com restrições alimentares. Detecte glúten, incluindo traços de contaminação cruzada, antes de consumir qualquer produto.',
  keywords: ['celíaco', 'glúten', 'alérgenos', 'segurança alimentar', 'intolerância alimentar'],
  openGraph: {
    title: 'CeLiLac — Segurança Alimentar para Celíacos',
    description: 'Verifique a compatibilidade de produtos com seu perfil alimentar em segundos.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
