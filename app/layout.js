import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { LoadingProvider } from '@/components/LoadingOverlay';

export const metadata = {
  title: 'Jedlik Motors — Inventory System',
  description: 'Inventory management system for Jedlik Motors R&D lab. Track components, tools, and consumables with QR codes.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
