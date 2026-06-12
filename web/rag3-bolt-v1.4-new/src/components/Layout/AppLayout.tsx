import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import StatusBar from './StatusBar';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col relative">
      {/* Ambient grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-glow-cyan rounded-full pointer-events-none opacity-30 blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-glow-blue rounded-full pointer-events-none opacity-20 blur-3xl" />

      <TopBar />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
