import {
  Bell,
  CalendarDays,
  Menu,
  Megaphone,
  MessageSquare,
  Search,
  Users,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser as useUserAuth } from '@/firebase';
import { Logo } from './logo';
import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import type { Conversation } from '@/lib/types';
import { ModeToggle } from '../mode-toggle';

const mockNotifications = [
    {
        id: '1',
        title: 'New offer received for "Rustic Barn Wedding"',
        description: 'Creative Captures sent you an offer.',
        time: '5m ago',
        isRead: false,
    },
    {
        id: '2',
        title: 'New message from Gourmet Gatherings',
        description: "Sounds great! Let's discuss the menu.",
        time: '1h ago',
        isRead: false,
    },
    {
        id: '3',
        title: 'Your offer for "Tech Startup Launch Party" was accepted!',
        description: 'Congratulations! The event organizer has accepted your offer.',
        time: '4h ago',
        isRead: true,
    },
     {
        id: '4',
        title: 'Alice Johnson started following you',
        description: 'Expand your network and collaborate.',
        time: '1d ago',
        isRead: true,
    }
]

export function Header() {
  const { user, isUserLoading } = useUserAuth();
  const auth = useAuth();
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
  
  const mobileNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/events', icon: CalendarDays, label: 'Events' },
    { href: '/providers', icon: Users, label: 'Providers' },
    { href: '/offers', icon: Megaphone, label: 'Offers' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', badge: totalUnreadMessages > 0 ? totalUnreadMessages.toString() : undefined },
  ];

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };
  
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';
  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Logo className="mb-4" />
            {mobileNavItems.map(({ href, icon: Icon, label, badge }) => (
                <Link
                key={label}
                href={href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                {label}
                {badge && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Post an Event</CardTitle>
                <CardDescription>
                  Need help with your event? Find talented people to collaborate with.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/events/create">Create Event</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events, providers..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      
      {!isUserLoading && user && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px]">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                    {mockNotifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-3 cursor-pointer">
                            {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                            )}
                            <div className={notification.isRead ? 'pl-4' : ''}>
                              <p className="font-semibold text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                            </div>
                        </DropdownMenuItem>
                    ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                    View all notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ''} />}
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.displayName || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.uid && (
                <DropdownMenuItem asChild>
                  <Link href={`/u/${user.uid}`}><User className="mr-2 h-4 w-4" />View Profile</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile"><Settings className="mr-2 h-4 w-4" />Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      {!isUserLoading && !user && (
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
            </Button>
             <Button asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </div>
      )}
    </header>
  );
}
