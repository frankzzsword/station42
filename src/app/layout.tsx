import './globals.css';
import { Inter } from 'next/font/google';
import StoreInitializer from '@/components/StoreInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Station 42 Admin',
  description: 'Admin panel for Station 42 work order management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreInitializer />
        <div className="min-h-screen bg-gray-900 text-white">
          {children}
        </div>
      </body>
    </html>
  );
}
