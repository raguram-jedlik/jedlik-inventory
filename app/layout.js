import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { LoadingProvider } from '@/components/LoadingOverlay';

export const metadata = {
  title: {
    default: 'Inventory',
    template: '%s · Inventory',
  },
  description: 'Inventory management system for Jedlik Motors R&D lab. Track components, tools, and consumables with QR codes.',
  // The `?v=2` cache-buster forces browsers — especially Safari, which
  // caches favicons per-URL in its icon database — to re-fetch the icon
  // after we changed it from the Next.js default to our brand mark.
  // Bump the version any time the icon changes again.
  icons: {
    icon: [
      { url: '/jedlik-logo.png?v=2', type: 'image/png' },
      { url: '/favicon.ico?v=2', sizes: '16x16 32x32 48x48 64x64 128x128 256x256' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: '/jedlik-logo.png?v=2',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <LoadingProvider>
            <div className="app-container">
              {children}
            </div>
            <Navbar />
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}