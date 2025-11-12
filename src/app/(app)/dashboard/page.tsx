'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
} from '@/components/ui/card';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import type { Event, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard } from '@/components/event-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProviderCard } from '@/components/provider-card';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

function DashboardLoadingSkeleton() {
  return (
    <>
      <section className="relative mb-12 rounded-lg bg-gradient-to-r from-primary to-purple-600 p-8 text-primary-foreground shadow-lg md:p-12 overflow-hidden">
        {heroImage && (
          <Image
            alt={heroImage.description}
            src={heroImage.imageUrl}
            fill
            className="object-cover opacity-20"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="relative z-10">
          <h1 className="mb-4 font-headline text-4xl font-bold md:text-5xl">
            Let&apos;s Create Something Amazing
          </h1>
          <p className="mb-6 max-w-2xl text-lg text-purple-200">
            Find the perfect collaborators for your event, or lend your talents to
            bring a vision to life.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/events">
                Discover Events <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              <Link href="/login">Post Your Event</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-3xl font-bold">Featured Events</h2>
          <Button asChild variant="link" className="text-primary">
            <Link href="/events">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
                <Skeleton className="h-56 w-full" />
                <CardFooter className="p-4 flex justify-between bg-muted/50">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-3xl font-bold">
            Featured Providers
          </h2>
          <Button asChild variant="link" className="text-primary">
            <Link href="/providers">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="text-center">
                <Skeleton className="mx-auto h-24 w-24 rounded-full mt-6 mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto mb-3" />
              <CardFooter className="p-4 bg-muted/50">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

export default function Dashboard() {
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'events'));
  }, [firestore]);
  const { data: allEvents, isLoading: isLoadingEvents } = useCollection<Event>(eventsQuery);

  const providersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'serviceProviderProfiles'));
  }, [firestore]);
  const { data: allProviders, isLoading: isLoadingProviders } = useCollection<UserProfile>(providersQuery);

  const featuredEvents = allEvents?.slice(0, 3) || [];
  const featuredProviders = allProviders?.slice(0, 3) || [];
  
  if (isLoadingEvents || isLoadingProviders) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto">
      <section className="relative mb-12 rounded-lg bg-gradient-to-r from-primary to-purple-600 p-8 text-primary-foreground shadow-lg md:p-12 overflow-hidden">
        {heroImage && (
          <Image
            alt={heroImage.description}
            src={heroImage.imageUrl}
            fill
            className="object-cover opacity-20"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="relative z-10">
          <h1 className="mb-4 font-headline text-4xl font-bold md:text-5xl">
            Let&apos;s Create Something Amazing
          </h1>
          <p className="mb-6 max-w-2xl text-lg text-purple-200">
            Find the perfect collaborators for your event, or lend your talents
            to bring a vision to life.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/events">
                Discover Events <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              <Link href="/login">Post Your Event</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-3xl font-bold">Featured Events</h2>
          <Button asChild variant="link" className="text-primary">
            <Link href="/events">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-3xl font-bold">
            Featured Providers
          </h2>
          <Button asChild variant="link" className="text-primary">
            <Link href="/providers">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>
    </div>
  );
}
