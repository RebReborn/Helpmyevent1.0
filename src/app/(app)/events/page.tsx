
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListFilter, Map, Info } from 'lucide-react';
import { EventCard } from '@/components/event-card';
import type { Event, EventType, Location } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const eventTypes: EventType[] = ['Wedding', 'Birthday', 'Corporate', 'Conference', 'Party', 'Other'];

export default function EventsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [showMap, setShowMap] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'events'));
  }, [firestore]);

  const { data: allEvents, isLoading } = useCollection<Event>(eventsQuery);
  
  const filteredEvents = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter(event => {
      const term = searchTerm.toLowerCase();
      const locationString = typeof event.location === 'string' ? event.location : event.location.city;
      
      const matchesSearch = term === '' ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        locationString.toLowerCase().includes(term);
      
      const matchesType = typeFilter === '' || event.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [allEvents, searchTerm, typeFilter]);


  const getCoordinates = (location: string | Location) => {
    if (typeof location === 'object' && location !== null) {
      return { lat: location.lat, lng: location.lng };
    }
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
        'Sunnyvale, CA': { lat: 37.3688, lng: -122.0363 },
        'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
        'Oakland, CA': { lat: 37.8044, lng: -122.2712 },
        'Palo Alto, CA': { lat: 37.4419, lng: -122.1430 },
    };
    return cityCoordinates[location] || { lat: 37.7749, lng: -122.4194 };
  }

  const handleMarkerClick = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleInfoWindowClose = () => {
    setSelectedEvent(null);
  };
  
  const navigateToEvent = (event: Event) => {
    router.push(`/events/${event.id}`);
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Discover Events
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Find the next project to showcase your skills and build your portfolio.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Search by keyword or location..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    More Filters
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                Available for Free Work
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Featured</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setShowMap(!showMap)}>
              <Map className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {showMap ? 'Hide Map' : 'Show Map'}
              </span>
          </Button>
        </div>
        <Button asChild>
          <Link href="/events/create">Create Event</Link>
        </Button>
      </div>

      {showMap && (
        <Card>
          <CardContent className="p-0">
            <div className="h-[400px] w-full">
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <GoogleMap
                  defaultCenter={{ lat: 37.5, lng: -122.2 }}
                  defaultZoom={9}
                  mapId="events-map"
                  gestureHandling={'greedy'}
                >
                  {filteredEvents.map(event => {
                    const position = getCoordinates(event.location);
                    return (
                        <AdvancedMarker 
                            key={event.id} 
                            position={position} 
                            title={event.title}
                            onClick={() => handleMarkerClick(event)}
                        />
                    )
                  })}
                  {selectedEvent && (
                    <InfoWindow 
                        position={getCoordinates(selectedEvent.location)}
                        onCloseClick={handleInfoWindowClose}
                    >
                       <div className="p-2 w-48">
                        <h4 className="font-bold text-md mb-1">{selectedEvent.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{typeof selectedEvent.location === 'string' ? selectedEvent.location : selectedEvent.location.city}</p>
                        <Button size="sm" className="w-full" onClick={() => navigateToEvent(selectedEvent)}>
                           <Info className="mr-2 h-4 w-4" />
                           View Details
                         </Button>
                       </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
             <Card key={i}>
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter className="p-4 flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {filteredEvents.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No events found matching your criteria.</p>
          )}
        </>
      )}
    </div>
  );
}
