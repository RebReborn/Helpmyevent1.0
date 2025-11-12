import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import type { Event, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type EventCardProps = {
  event: Event;
};

function OrganizerAvatar({ userId }: { userId: string }) {
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);
    const { data: organizer } = useDoc<UserProfile>(userDocRef);

    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={organizer?.avatarUrl} alt={organizer?.name} />
                <AvatarFallback>{organizer?.name?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{organizer?.name ?? 'Event Organizer'}</span>
        </div>
    );
}


export function EventCard({ event }: EventCardProps) {
  // The userAccountId might not be available on mock data.
  const eventUrl = `/events/${event.id}${event.userAccountId ? `?userId=${event.userAccountId}`: ''}`;
  
  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <CardHeader className="p-0">
        <Link href={eventUrl}>
          <div className="relative h-56 w-full">
            <Image
              src={event.coverImageUrl || `https://picsum.photos/seed/${event.id}/400/300`}
              alt={`Cover image for ${event.title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="event cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
                <Badge variant="secondary">{event.type}</Badge>
            </div>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="font-headline text-2xl mb-2 leading-tight">
          <Link href={eventUrl} className="hover:text-primary transition-colors">
            {event.title}
          </Link>
        </CardTitle>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {event.description}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{event.location}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-2 bg-muted/20">
        {event.userAccountId ? <OrganizerAvatar userId={event.userAccountId} /> : <div />}
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{event.likes || 0}</span>
            </div>
            <Button asChild size="sm">
                <Link href={eventUrl}>View</Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
