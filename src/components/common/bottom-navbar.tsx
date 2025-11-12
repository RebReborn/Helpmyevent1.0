'use client';

import {
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Conversation } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

export function BottomNavbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: conversations } = useCollection<Conversation>(conversationsQuery);

  const totalUnreadMessages = useMemo(() => {
    if (!conversations || !user) return 0;
    return conversations.reduce((total, convo) => {
      return total + (convo.unreadCounts?.[user.uid] || 0);
    }, 0);
  }, [conversations, user]);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/events', icon: CalendarDays, label: 'Events' },
    { href: '/providers', icon: Users, label: 'Providers' },
    { href: '/offers', icon: Megaphone, label: 'Offers' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-50">
      <nav className="grid h-full grid-cols-5 items-center">
        {navItems.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-all h-full',
              { 'text-primary': pathname.startsWith(href) }
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {badge && (
                <Badge className="absolute -top-2 -right-3 h-4 w-4 min-w-4 justify-center rounded-full p-0 text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
