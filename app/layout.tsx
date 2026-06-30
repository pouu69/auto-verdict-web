import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Pwa } from '@/components/Pwa';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoVerdict — 엔카 중고차 종합 평가',
  description: '엔카 중고차 매물을 12가지 규칙으로 자동 분석해 사고이력·진단·점수를 한눈에.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AutoVerdict' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0064ff',
};

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {ADSENSE_CLIENT ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <Pwa />
        <div className="av-app-frame">{children}</div>
      </body>
    </html>
  );
}
