import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { RoleProvider } from '@/context/RoleContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';

export const metadata: Metadata = {
  title: 'MediRush — Medicine. Fast. Reliable.',
  description: 'Multi-vendor medical marketplace for ordering prescription medicines and healthcare essentials from local verified pharmacies.',
  keywords: 'medicine delivery, online pharmacy, local medical store, instant medicine, prescription upload, MediRush',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased text-slate-900 pb-16 lg:pb-0">
        <AuthProvider>
          <RoleProvider>
            <CartProvider>
              <LocationProvider>
                {children}
              </LocationProvider>
            </CartProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
