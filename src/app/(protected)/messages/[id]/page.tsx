'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { cn } from '@/lib/utils';
import type { Conversation, Message, UserProfile } from '@/lib/types';
import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  Image,
  Smile,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

function ChatHeader({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const otherParticipantId = conversation.participantIds.find(
    id => id !== currentUserId
  );
  const otherParticipant = otherParticipantId
    ? conversation.participants[otherParticipantId]
    : null;

  if (!otherParticipant) {
    return (
      <div className="flex items-center gap-4 border-b p-4 bg-card/95 backdrop-blur-sm">
        <Button asChild variant="ghost" size="icon" className="md:hidden">
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b p-4 bg-card/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="md:hidden">
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Link
          href={`/u/${otherParticipantId}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-background group-hover:border-primary/20 transition-colors">
              <AvatarImage
                src={otherParticipant.avatarUrl}
                alt={otherParticipant.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                {otherParticipant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {(otherParticipant as any).isOnline && (
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{otherParticipant.name}</p>
            <p className="text-xs text-muted-foreground">
              {(otherParticipant as any).isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  author,
}: {
  message: Message;
  isOwn: boolean;
  author?: Pick<UserProfile, 'name' | 'avatarUrl'>;
}) {
  const formatTime = (timestamp: any) => {
    if (!timestamp?.seconds) return '';
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn('flex gap-3 max-w-[80%]', {
        'ml-auto': isOwn,
        'mr-auto': !isOwn,
      })}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={author?.avatarUrl} alt={author?.name} />
          <AvatarFallback className="text-xs">
            {author?.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-1 w-full">
        <div
          className={cn('rounded-2xl px-4 py-2 shadow-sm', {
            'bg-primary text-primary-foreground rounded-br-md': isOwn,
            'bg-muted rounded-bl-md': !isOwn,
          })}
        >
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
        <div
          className={cn('flex text-xs text-muted-foreground', {
            'justify-end': isOwn,
            'justify-start': !isOwn,
          })}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function ChatMessages({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const firestore = useFirestore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversation.id) return null;
    return query(
      collection(firestore, 'conversations', conversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, conversation.id]);

  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex gap-3 max-w-[80%]', {
              'ml-auto': i % 2 === 0,
              'mr-auto': i % 2 !== 0,
            })}
          >
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <div className="space-y-2 flex-1">
              <Skeleton
                className={cn('h-16 rounded-2xl', {
                  'rounded-br-md': i % 2 === 0,
                  'rounded-bl-md': i % 2 !== 0,
                })}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 p-4 space-y-6"
    >
      {messages?.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start the conversation by sending the first message below.
            </p>
          </div>
        </div>
      )}

      {messages?.map(message => {
        const isOwn = message.senderId === currentUserId;
        const author = isOwn
          ? undefined
          : conversation.participants[message.senderId];
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={isOwn}
            author={author}
          />
        );
      })}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
}

function ChatInput({
  conversationId,
  conversation,
}: {
  conversationId: string;
  conversation: Conversation;
}) {
  const [message, setMessage] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !firestore || !user) return;

    const messagesColRef = collection(
      firestore,
      'conversations',
      conversationId,
      'messages'
    );
    const convoDocRef = doc(firestore, 'conversations', conversationId);

    try {
      await addDoc(messagesColRef, {
        conversationId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        content: message.trim(),
        createdAt: serverTimestamp(),
      });

      // Increment unread count for the other user
      const otherUserId = conversation.participantIds.find(
        id => id !== user.uid
      );
      const unreadCountUpdate = otherUserId
        ? { [`unreadCounts.${otherUserId}`]: increment(1) }
        : {};

      await updateDoc(convoDocRef, {
        lastMessage: message.trim(),
        lastMessageAt: serverTimestamp(),
        ...unreadCountUpdate,
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="border-t bg-card/95 backdrop-blur-sm p-4 sticky bottom-0">
      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
        >
          <Image className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
            className="pr-10 resize-none min-h-[40px] max-h-32"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim()}
          className="h-10 w-10 flex-shrink-0 bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send Message</span>
        </Button>
      </form>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b p-4 bg-card/95">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex gap-3 max-w-[80%]', {
              'ml-auto': i % 2 === 0,
              'mr-auto': i % 2 !== 0,
            })}
          >
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton
              className={cn('h-16 rounded-2xl flex-1', {
                'rounded-br-md': i % 2 === 0,
                'rounded-bl-md': i % 2 !== 0,
              })}
            />
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

export default function MessagePage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const conversationDocRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading } =
    useDoc<Conversation>(conversationDocRef);

  // Effect to mark conversation as read when it's opened
  useEffect(() => {
    if (firestore && user && conversationId && conversation) {
      if (
        conversation.unreadCounts &&
        conversation.unreadCounts[user.uid] > 0
      ) {
        const convoDocRef = doc(firestore, 'conversations', conversationId);
        updateDoc(convoDocRef, {
          [`unreadCounts.${user.uid}`]: 0,
        }).catch(console.error);
      }
    }
  }, [firestore, user, conversationId, conversation]);

  if (isLoading || !user) {
    return <LoadingState />;
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Conversation not found
          </h2>
          <p className="text-muted-foreground">
            The conversation you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
        <Button asChild>
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to messages
          </Link>
        </Button>
      </div>
    );
  }

  if (!conversation.participantIds.includes(user.uid)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Access denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view this conversation.
          </p>
        </div>
        <Button asChild>
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to messages
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader conversation={conversation} currentUserId={user.uid} />
      <ChatMessages conversation={conversation} currentUserId={user.uid} />
      <ChatInput conversationId={conversationId} conversation={conversation} />
    </div>
  );
}
