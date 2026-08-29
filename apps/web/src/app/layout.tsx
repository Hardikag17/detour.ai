import type { Metadata } from 'next';
import { Cascadia_Mono, Satisfy } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const cascadia = Cascadia_Mono({ subsets: ['latin'], variable: '--font-cascadia' });
const satisfy = Satisfy({ subsets: ['latin'], weight: '400', variable: '--font-satisfy' });

export const metadata: Metadata = {
  title: 'detour.ai — Discover everything in between',
  description:
    "Tell us where you're going. We'll find the reasons to stop — cafés, dhabas, waterfalls, forts and stays along your route.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cascadia.variable} ${satisfy.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
