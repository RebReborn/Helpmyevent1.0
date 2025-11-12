'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import type { Conversation } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Search, Users, MessageCircle, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import MessagePage from './[id]/page';

function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
}: {
  conversation: Conversation;
  currentUserId: string;
  isSelected: boolean;
}) {
  const otherParticipantId = conversation.participantIds.find(
    id => id !== currentUserId
  );
  const otherParticipant = otherParticipantId
    ? conversation.participants[otherParticipantId]
    : null;

  const formatTime = (timestamp: any) => {
    if (!timestamp?.seconds) return '';

    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const unreadCount = conversation.unreadCounts?.[currentUserId] || 0;
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        'flex items-center gap-4 p-3 transition-all rounded-lg border-l-4 border-l-transparent',
        isSelected
          ? 'bg-muted border-l-primary'
          : 'hover:bg-muted/50 hover:border-l-primary/50 group'
      )}
    >
      <div className="relative">
        <Avatar
          className={cn(
            'h-12 w-12 border-2 transition-colors',
            isSelected
              ? 'border-primary/20'
              : 'border-background group-hover:border-primary/20'
          )}
        >
          <AvatarImage
            src={otherParticipant?.avatarUrl}
            alt={otherParticipant?.name}
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
            {otherParticipant?.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        {otherParticipant && (otherParticipant as any).isOnline && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm truncate">
            {otherParticipant?.name || 'Unknown User'}
          </p>
          <div className="flex items-center gap-2">
            {conversation.lastMessageAt && (
              <p className="text-xs text-muted-foreground">
                {formatTime(conversation.lastMessageAt)}
              </p>
            )}
            {hasUnread && (
              <Badge
                variant="destructive"
                className="h-5 min-w-[1.25rem] p-1 text-xs justify-center rounded-full"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate max-w-xs">
          {conversation.lastMessage || 'Start a conversation...'}
        </p>
      </div>
    </Link>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function ConversationsSidebar({
  selectedConversationId,
}: {
  selectedConversationId?: string;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: conversations, isLoading } =
    useCollection<Conversation>(conversationsQuery);

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter(convo => {
      if (!user) return false;
      const otherParticipantId = convo.participantIds.find(
        id => id !== user.uid
      );
      const otherParticipant = otherParticipantId
        ? convo.participants[otherParticipantId]
        : null;

      const term = searchTerm.toLowerCase();

      return (
        term === '' ||
        otherParticipant?.name.toLowerCase().includes(term) ||
        convo.lastMessage?.toLowerCase().includes(term)
      );
    });
  }, [conversations, searchTerm, user]);

  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const timeA = a.lastMessageAt?.seconds || 0;
      const timeB = b.lastMessageAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [filteredConversations]);

  return (
    <div className="flex flex-col border-r bg-card/50 backdrop-blur-sm h-full">
      <CardHeader className="p-4 pb-3 space-y-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Messages
          </CardTitle>
          <Button size="sm" className="rounded-full h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 h-9 rounded-full bg-background border"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-2 overflow-y-auto">
        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && sortedConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="rounded-full border bg-muted/50 p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchTerm
                ? 'Try adjusting your search terms or start a new conversation.'
                : 'Start a new conversation to connect with others.'}
            </p>
            {!searchTerm && (
              <Button className="mt-4 rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
            )}
          </div>
        )}

        {user && sortedConversations.length > 0 && (
          <div className="space-y-1">
            {sortedConversations.map(convo => (
              <ConversationItem
                key={convo.id}
                conversation={convo}
                currentUserId={user.uid}
                isSelected={convo.id === selectedConversationId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center p-8 h-full">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="relative">
          <div className="rounded-full border bg-primary/5 p-6 text-primary">
            <MessageCircle className="h-16 w-16" />
          </div>
          <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-headline text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your Messages
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Choose a conversation from the sidebar to start messaging, or create
            a new one to connect with others.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="rounded-full gap-2">
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
          <Button variant="outline" className="rounded-full gap-2">
            <Users className="h-4 w-4" />
            Find People
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
          <Calendar className="h-3 w-3" />
          <span>Your conversations are synced across all devices</span>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage({
  params,
}: {
  params: { id?: string };
}) {
  const pathname = usePathname();
  const selectedConversationId = params.id || (pathname.split('/')[2] ?? undefined);
  const isChatPage = !!selectedConversationId;

  return (
    <div
      className={cn(
        'grid h-full grid-cols-1 md:grid-cols-[350px_1fr] bg-background',
        'md:h-[calc(100vh_-_60px)]' // 60px is the header height
      )}
    >
      <div
        className={cn('h-full', isChatPage && 'hidden md:flex')}
      >
        <ConversationsSidebar
          selectedConversationId={selectedConversationId}
        />
      </div>

      <div className={cn('h-full', !isChatPage && 'hidden md:flex')}>
        {isChatPage ? <MessagePage /> : <EmptyState />}
      </div>
    </div>
  );
}
