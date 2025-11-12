'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import type { Event, Offer, ServiceProvider, UserProfile } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Inbox,
  User,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

type OfferWithDetails = Offer & {
  event: Event | null;
  provider: ServiceProvider | null;
};

function OfferStatusBadge({ status }: { status: Offer['status'] }) {
  const statusConfig = {
    submitted: {
      label: 'Pending Review',
      variant: 'secondary' as const,
      icon: Clock,
      color: 'text-yellow-600'
    },
    accepted: {
      label: 'Accepted',
      variant: 'default' as const,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    rejected: {
      label: 'Declined',
      variant: 'destructive' as const,
      icon: XCircle,
      color: 'text-red-600'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1.5 capitalize">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}

function OfferListItem({ offer, isReceived }: { offer: OfferWithDetails, isReceived: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!offer.event || !offer.provider) {
    return null;
  }
  
  const handleStatusChange = async (status: 'accepted' | 'rejected') => {
    if (!firestore) return;
    
    setIsUpdating(true);
    const offerRef = doc(firestore, 'offers', offer.id);

    try {
      await updateDoc(offerRef, { 
        status: status,
        updatedAt: new Date()
      });
      
      toast({
        title: `Offer ${status === 'accepted' ? 'Accepted!' : 'Declined'}`,
        description: status === 'accepted' 
          ? `You've accepted the offer from ${offer.provider?.name}. Time to get planning!`
          : `You've declined the offer from ${offer.provider?.name}.`,
      });
    } catch (error) {
      console.error('Error updating offer status:', error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: offerRef.path,
          operation: 'update',
          requestResourceData: { status }
      }));
      
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the offer status. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return 'Recently';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-lg group">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Event & Offer Details */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {formatDate(offer.createdAt)}
                </Badge>
                <OfferStatusBadge status={offer.status} />
              </div>
              
              <Link
                href={`/events/${offer.event.id}`}
                className="block text-xl font-semibold hover:text-primary transition-colors group-hover:underline"
              >
                {offer.event.title}
              </Link>
              
              {offer.event.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {typeof offer.event.location === 'string' 
                    ? offer.event.location 
                    : offer.event.location.city
                  }
                </div>
              )}
            </div>
            
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1 justify-end text-2xl font-bold text-primary">
                <DollarSign className="h-5 w-5" />
                {offer.price.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total offer</p>
            </div>
          </div>

          {/* Offer Description */}
          {offer.description && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed">{offer.description}</p>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Footer with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {isReceived ? (
            <>
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src={offer.provider.avatarUrl} alt={offer.provider.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                  {offer.provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  href={`/u/${offer.provider.id}`}
                  className="font-medium hover:text-primary transition-colors hover:underline"
                >
                  {offer.provider.name}
                </Link>
                <p className="text-sm text-muted-foreground">Service Provider</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 p-2 rounded-full bg-muted" />
              <div>
                <p className="font-medium">{offer.event.organizer?.name || 'Event Organizer'}</p>
                <p className="text-sm text-muted-foreground">Event Owner</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isReceived && offer.status === 'submitted' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusChange('rejected')}
                disabled={isUpdating}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>
              <Button 
                size="sm"
                onClick={() => handleStatusChange('accepted')}
                disabled={isUpdating}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isUpdating ? 'Accepting...' : 'Accept Offer'}
              </Button>
            </>
          )}
          
          {!isReceived && offer.status === 'submitted' && (
            <Badge variant="outline" className="gap-1.5">
              <Clock className="h-3 w-3" />
              Waiting for response
            </Badge>
          )}
          
          {(offer.status === 'accepted' || offer.status === 'rejected') && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/messages?user=${isReceived ? offer.provider.id : offer.event.userAccountId}`}>
                <Send className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OffersList({ offers, isLoading, isReceived }: { offers: OfferWithDetails[], isLoading: boolean, isReceived: boolean }) {
  const stats = useMemo(() => {
    const total = offers.length;
    const pending = offers.filter(o => o.status === 'submitted').length;
    const accepted = offers.filter(o => o.status === 'accepted').length;
    
    return { total, pending, accepted };
  }, [offers]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 bg-muted/20">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Offers Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-8 w-20 ml-auto" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="border-dashed text-center py-12">
        <CardContent className="space-y-4">
          <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto flex items-center justify-center">
            {isReceived ? (
              <Inbox className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Send className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              No {isReceived ? 'Received' : 'Sent'} Offers
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {isReceived 
                ? "You haven't received any offers yet. Create events to attract service providers."
                : "You haven't sent any offers to event organizers yet. Browse events to find opportunities."
              }
            </p>
            <Button asChild>
              <Link href={isReceived ? "/events/create" : "/events"}>
                {isReceived ? "Create an Event" : "Browse Events"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Total Offers</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Accepted</span>
            </div>
            <p className="text-2xl font-bold">{stats.accepted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.map(offer => (
          <OfferListItem key={offer.id} offer={offer} isReceived={isReceived} />
        ))}
      </div>
    </div>
  );
}

async function fetchOfferDetails(firestore: any, offers: Offer[]): Promise<OfferWithDetails[]> {
  const detailedOffers: OfferWithDetails[] = [];

  for (const offer of offers) {
    let event: Event | null = null;
    let provider: ServiceProvider | null = null;

    // Fetch Event
    if (offer.eventOwnerId) {
      const eventsQuery = query(
        collection(firestore, `users/${offer.eventOwnerId}/events`),
        where('id', '==', offer.eventID)
      );
      const eventSnap = await getDocs(eventsQuery);

      if (!eventSnap.empty) {
        const eventDoc = eventSnap.docs[0];
        event = { id: eventDoc.id, ...eventDoc.data() } as Event;

        // Fetch event organizer details
        const organizerQuery = query(
          collection(firestore, 'users'),
          where('id', '==', event.userAccountId)
        );
        const organizerSnap = await getDocs(organizerQuery);
        if (!organizerSnap.empty) {
          event.organizer = { id: organizerSnap.docs[0].id, ...organizerSnap.docs[0].data()} as UserProfile;
        }
      }
    }
    
    // Fetch Provider
    if (offer.serviceProviderProfileId) {
      const providerQuery = query(
        collection(firestore, 'serviceProviderProfiles'),
        where('id', '==', offer.serviceProviderProfileId)
      );
      const providerSnap = await getDocs(providerQuery);
      if (!providerSnap.empty) {
        const providerDoc = providerSnap.docs[0];
        provider = { id: providerDoc.id, ...providerDoc.data() } as ServiceProvider;
      }
    }

    detailedOffers.push({ ...offer, event, provider });
  }

  return detailedOffers;
}

export default function OffersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [receivedOffers, setReceivedOffers] = useState<OfferWithDetails[]>([]);
  const [sentOffers, setSentOffers] = useState<OfferWithDetails[]>([]);
  const [isLoadingReceived, setIsLoadingReceived] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);

  // Fetch user's events for received offers
  const userEventsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/events`));
  }, [firestore, user]);
  
  const { data: userEvents, isLoading: isLoadingUserEvents } = useCollection<Event>(userEventsQuery);

  // Fetch received offers
  useEffect(() => {
    if (isLoadingUserEvents || !userEvents || !firestore) return;

    const eventIds = userEvents.map(e => e.id);
    if (eventIds.length === 0) {
      setIsLoadingReceived(false);
      setReceivedOffers([]);
      return;
    }

    const offersQuery = query(
      collection(firestore, 'offers'),
      where('eventID', 'in', eventIds)
    );
    
    const unsubscribe = onSnapshot(offersQuery, async (snapshot) => {
      const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      const detailed = await fetchOfferDetails(firestore, offers);
      setReceivedOffers(detailed);
      setIsLoadingReceived(false);
    });

    return () => unsubscribe();
  }, [userEvents, isLoadingUserEvents, firestore]);
  
  // Fetch sent offers
  const sentOffersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'offers'),
      where('serviceProviderProfileId', '==', user.uid)
    );
  }, [firestore, user]);
  
  const { data: rawSentOffers, isLoading: isLoadingSentRaw } = useCollection<Offer>(sentOffersQuery);

  useEffect(() => {
    if (!firestore || isLoadingSentRaw) return;
    if (!rawSentOffers) {
        setIsLoadingSent(false);
        setSentOffers([]);
        return;
    }
    
    fetchOfferDetails(firestore, rawSentOffers).then(detailed => {
        setSentOffers(detailed);
        setIsLoadingSent(false);
    });
  }, [rawSentOffers, isLoadingSentRaw, firestore]);

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Manage Offers
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track proposals for your events and monitor offers you've sent to clients
          </p>
        </div>

        {/* Tabs */}
        <Card className="border-0 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <Tabs defaultValue="received" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="received" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Offers Received
                  {receivedOffers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                      {receivedOffers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Offers Sent
                  {sentOffers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                      {sentOffers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="received" className="mt-6">
                <OffersList offers={receivedOffers} isLoading={isLoadingReceived} isReceived={true} />
              </TabsContent>
              
              <TabsContent value="sent" className="mt-6">
                <OffersList offers={sentOffers} isLoading={isLoadingSent} isReceived={false} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}