import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alberta FP Billing Assistant',
  description: 'Click-first Alberta family medicine billing assistant with MOA day sheet.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
