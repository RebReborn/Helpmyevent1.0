'use client';

import { Header } from '@/components/common/header';
import { MainSidebar } from '@/components/common/main-sidebar';
import { BottomNavbar } from '@/components/common/bottom-navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <MainSidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
       <BottomNavbar />
    </div>
  );
}
