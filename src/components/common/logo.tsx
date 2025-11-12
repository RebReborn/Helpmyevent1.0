import { HandHelping } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 text-primary transition-opacity hover:opacity-80 ${className}`}>
      <HandHelping className="h-7 w-7" />
      <span className="font-headline text-2xl font-bold tracking-wide">
        HelpMyEvent
      </span>
    </Link>
  );
}
