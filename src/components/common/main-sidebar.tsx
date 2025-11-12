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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Conversation } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';

export function MainSidebar() {
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
    { href: '/messages', icon: MessageSquare, label: 'Messages', badge: totalUnreadMessages > 0 ? totalUnreadMessages.toString() : undefined },
  ];

  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Logo />
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map(({ href, icon: Icon, label, badge }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  { 'bg-muted text-primary': pathname.startsWith(href) }
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Card>
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle className="font-headline text-lg">Post an Event</CardTitle>
              <CardDescription>
                Need help with your event? Find talented people to collaborate with.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Button size="sm" className="w-full" asChild>
                <Link href="/events/create">Create Event</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
