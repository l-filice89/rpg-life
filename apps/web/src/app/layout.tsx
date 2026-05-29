import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'rpg-life',
  description: 'Turn real life into an RPG quest board.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
