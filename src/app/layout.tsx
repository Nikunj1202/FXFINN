import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { PWARegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: { default: 'FXFINN — Personal Wealth', template: '%s · FXFINN' },
  description: 'A clear view of your money, assets, liabilities and wealth progress.',
  applicationName: 'FXFINN',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'FXFINN', statusBarStyle: 'default' },
};
export const viewport: Viewport = { themeColor: '#111d33', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body><PWARegister/>{children}</body></html>;
}
