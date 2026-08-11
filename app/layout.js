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
  icons: {
    icon: '/jedlik-logo.png',
    shortcut: '/jedlik-logo.png',
    apple: '/jedlik-logo.png',
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