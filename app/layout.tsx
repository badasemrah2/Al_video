import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Video Üreticisi - AI ile Muhteşem Videolar Oluşturun',
  description: 'Metin açıklamalarından çarpıcı videolar üretin veya gelişmiş AI video üreticimizle görsellerinizi canlandırın. Saniyeler içinde profesyonel videolar oluşturun.',
  keywords: 'AI video üreticisi, metinden video, görseldan video, video oluşturma, yapay zeka, n8n entegrasyonu',
  authors: [{ name: 'AI Video Stüdyosu' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}