
'use client';
import Image from 'next/image';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { notFound, useRouter, useParams } from 'next/navigation';
import {
  Calendar,
  Camera,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  Share2,
  Utensils,
  Video,
  Paintbrush,
  PenTool,
  Edit,
  Trash2,
} from 'lucide-react';
import type { ServiceCategory, Event, UserProfile, Comment } from '@/lib/types';
import { ProviderRecommendations } from '@/components/ai/provider-recommendations';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, serverTimestamp, addDoc, getDoc, getDocs, where, Firestore, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { SubmitOfferDialog } from '@/components/offers/submit-offer-dialog';

const serviceIcons: Record<ServiceCategory, React.ElementType> = {
    Photography: Camera,
    DJ: Music,
    Catering: Utensils,
    Decor: Paintbrush,
    Planning: PenTool,
    Music: Music,
    Videography: Video,
};

async function findUserProfile(
  db: Firestore,
  id: string
): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', id);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
  }

  const spDocRef = doc(db, 'serviceProviderProfiles', id);
  const spDocSnap = await getDoc(spDocRef);
  if (spDocSnap.exists()) {
    return { id: spDocSnap.id, ...spDocSnap.data() } as UserProfile;
  }

  const spQuery = query(
    collection(db, 'serviceProviderProfiles'),
    where('userAccountId', '==', id)
  );
  const spQuerySnap = await getDocs(spQuery);
  if (!spQuerySnap.empty) {
    const spDoc = spQuerySnap.docs[0];
    return { id: spDoc.id, ...spDoc.data() } as UserProfile;
  }

  return null;
}

function OrganizerDetails({ userId }: { userId: string }) {
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);
    const { data: organizer, isLoading } = useDoc<UserProfile>(userDocRef);

    if (isLoading) {
        return (
             <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        )
    }

    if (!organizer) return null;

    return (
        <Link href={`/u/${userId}`} className="flex items-center gap-4 group">
            <Avatar className="h-12 w-12">
            <AvatarImage src={organizer.avatarUrl} alt={organizer.name} />
            <AvatarFallback>{organizer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
            <p className="text-sm text-muted-foreground">Organized by</p>
            <p className="font-bold group-hover:text-primary transition-colors">{organizer.name}</p>
            </div>
        </Link>
    )
}

function CommentSection({ eventId, userId }: { eventId: string; userId: string; }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This needs to find the event's user ID to construct the path
  // For now, this is passed in as a prop.

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !userId || !eventId) return null;
    return query(collection(firestore, `users/${userId}/events/${eventId}/comments`), orderBy('createdAt', 'desc'));
  }, [firestore, userId, eventId]);

  const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

  const handleAddComment = async () => {
    if (!user || !firestore || !commentText.trim() || !userId) return;

    setIsSubmitting(true);
    const commentsCollectionRef = collection(firestore, `users/${userId}/events/${eventId}/comments`);
    
    const newComment = {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorAvatar: user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`,
      content: commentText,
      createdAt: serverTimestamp(),
      parentId: eventId,
      parentType: 'event',
    };

    try {
        addDoc(commentsCollectionRef, newComment);
        setCommentText('');
    } catch (error) {
        console.error("Error posting comment: ", error);
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: commentsCollectionRef.path,
                operation: 'create',
                requestResourceData: newComment,
            })
        );
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && (
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user.photoURL ?? undefined} />
              <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button onClick={handleAddComment} disabled={!commentText.trim() || isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        )}
        {isLoading && <Skeleton className="h-20 w-full" />}
        {!isLoading && comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar>
                <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{comment.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {comment.createdAt && new Date(comment.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p>{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          !isLoading && <p className="text-muted-foreground text-center">No comments yet. Be the first to comment!</p>
        )}
      </CardContent>
    </Card>
  );
}


export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventDocRef, setEventDocRef] = useState<any>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!firestore || !eventId) return;
      setIsLoading(true);

      const eventsQuery = query(
        collectionGroup(firestore, 'events'),
        where('id', '==', eventId)
      );

      try {
        const querySnapshot = await getDocs(eventsQuery);
        if (!querySnapshot.empty) {
          const eventDoc = querySnapshot.docs[0];
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
          setEventDocRef(eventDoc.ref);
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [firestore, eventId]);

  useEffect(() => {
    if (user && firestore) {
      findUserProfile(firestore, user.uid).then(profile => {
        setCurrentUserProfile(profile);
      });
    }
  }, [user, firestore]);
  
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !eventDocRef) return null;
    return query(collection(eventDocRef, `comments`));
  }, [firestore, eventDocRef]);
  const { data: comments } = useCollection<Comment>(commentsQuery);

  const isOwner = user?.uid === event?.userAccountId;
  const isServiceProvider = currentUserProfile?.profileType === 'serviceProvider';

  const handleDeleteEvent = async () => {
    if (!isOwner || !eventDocRef) return;
    try {
      await deleteDoc(eventDocRef);
      toast({
        title: 'Event Deleted',
        description: 'Your event has been successfully deleted.',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting event:', error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: eventDocRef.path,
          operation: 'delete'
      }));
    }
  };

  if (isLoading) {
    return (
        <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-0">
            <Skeleton className="h-64 md:h-96 w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-24 w-full" />
                        </CardContent>
                        <CardHeader>
                             <Skeleton className="h-12 w-48" />
                        </CardHeader>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
  }

  if (!event) {
    notFound();
  }
  
  const locationString = typeof event.location === 'string' ? event.location : event.location.city;


  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-0">
      <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-96">
        <Image
          src={event.coverImageUrl || `https://picsum.photos/seed/${event.id}/1200/800`}
          alt={event.title}
          fill
          className="object-cover"
          data-ai-hint="event cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white md:p-8">
          <Badge variant="secondary" className="mb-2">
            {event.type}
          </Badge>
          <h1 className="font-headline text-3xl font-bold md:text-5xl">{event.title}</h1>
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{locationString}</span>
            </div>
          </div>
        </div>
      </div>
      
      {isOwner && (
        <Card>
          <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
            <p className="text-center font-semibold sm:text-left">You are the owner of this event.</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 sm:flex-none">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      event and remove its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteEvent}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-foreground/80">{event.description}</p>
                </CardContent>
                 <CardHeader className="flex flex-row items-center justify-between">
                    {event.userAccountId && <OrganizerDetails userId={event.userAccountId} />}
                    {!isOwner && <Button variant="outline">Follow Organizer</Button>}
                </CardHeader>
            </Card>

            {event.imageUrls && event.imageUrls.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Inspiration Board</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {event.imageUrls.map((img, index) => (
                            <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                                <Image src={img} alt={`Inspiration ${index + 1}`} fill className="object-cover transition-transform hover:scale-105" data-ai-hint="inspiration image"/>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {event.userAccountId && <CommentSection eventId={eventId} userId={event.userAccountId} />}

            <ProviderRecommendations event={event} />
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Services Needed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {event.serviceNeeds.map(service => {
                        const Icon = serviceIcons[service as ServiceCategory] || Heart;
                        return (
                            <div key={service} className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
                                <Icon className="h-6 w-6 text-primary" />
                                <span className="font-semibold">{service}</span>
                            </div>
                        );
                    })}
                </CardContent>
                 <CardContent>
                   {isServiceProvider && !isOwner && currentUserProfile && (
                     <SubmitOfferDialog
                        event={event}
                        serviceProviderProfile={currentUserProfile}
                        isOpen={isOfferDialogOpen}
                        onOpenChange={setIsOfferDialogOpen}
                      >
                        <Button className="w-full" size="lg">Submit an Offer</Button>
                      </SubmitOfferDialog>
                    )}
                    {!isServiceProvider && !isOwner && (
                        <Button className="w-full" size="lg" disabled>
                            Only Service Providers can submit offers
                        </Button>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardContent className="flex justify-around p-4">
                    <Button variant="ghost" className="flex flex-col h-auto gap-1">
                        <Heart className="h-5 w-5" />
                        <span className="text-xs">{event.likes || 0} Likes</span>
                    </Button>
                    <Button variant="ghost" className="flex flex-col h-auto gap-1">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs">{comments?.length || 0} Comments</span>
                    </Button>
                    <Button variant="ghost" className="flex flex-col h-auto gap-1">
                        <Share2 className="h-5 w-5" />
                        <span className="text-xs">Share</span>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
