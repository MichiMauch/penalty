'use client';

import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-600">
      {showHeader && <Header />}
      <main className={showHeader ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  );
}