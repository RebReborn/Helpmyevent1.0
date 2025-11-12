'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '../(app)/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden md:block md:w-[220px] lg:w-[280px] border-r bg-card p-4">
                <Skeleton className="h-10 w-3/4 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
            <div className="flex-1">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                    <Skeleton className="h-8 w-8 md:hidden" />
                    <div className="w-full flex-1">
                        <Skeleton className="h-8 w-full max-w-sm" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </header>
                <main className="p-4 lg:p-6">
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        </div>
    );
  }

  if (!user) {
      return null; // or a redirect, but useEffect handles it
  }

  return <AppLayout>{children}</AppLayout>;
}
