import type { Metadata } from 'next';
import { Sora, Manrope } from 'next/font/google';
import './globals.css';

// As mesmas famílias do design. `next/font` hospeda os arquivos junto da
// aplicação, então não há requisição para o Google em produção.
const sora = Sora({
  variable: '--fonte-titulo-next',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const manrope = Manrope({
  variable: '--fonte-corpo-next',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TCA Move · Operador logístico integrado',
    template: '%s · TCA Move',
  },
  description:
    'Transporte rodoviário, armazenagem e last mile em uma só operação. ' +
    'Visibilidade em tempo real do coleta ao destinatário.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
