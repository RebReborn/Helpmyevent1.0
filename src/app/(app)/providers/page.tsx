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
import { ListFilter } from 'lucide-react';
import type { ServiceProvider, ServiceCategory } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Star } from 'lucide-react';
import { useMemo, useState } from 'react';

const serviceCategories: ServiceCategory[] = ['Photography', 'DJ', 'Catering', 'Decor', 'Planning', 'Music', 'Videography'];

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  return (
    <Card
      key={provider.id}
      className="text-center transition-shadow hover:shadow-xl flex flex-col"
    >
      <CardContent className="p-6 flex-grow">
        <Avatar className="mx-auto h-24 w-24 mb-4 border-4 border-muted">
          <AvatarImage
            src={provider.avatarUrl}
            alt={provider.name}
          />
          <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="font-headline text-xl mb-1">
          <Link
            href={`/u/${provider.id}`}
            className="hover:text-primary transition-colors"
          >
            {provider.name}
          </Link>
        </CardTitle>
        {Array.isArray(provider.skills) && provider.skills.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            {provider.skills.join(' & ')}
          </p>
        )}
        {Array.isArray(provider.skills) && (
            <div className="flex justify-center flex-wrap gap-2 mb-4">
                {provider.skills.map(skill => (
                <Badge key={skill} variant="secondary">
                    {skill}
                </Badge>
                ))}
            </div>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className='flex items-center gap-1'>
                <Users className="h-4 w-4" /> {provider.followers || 0}
            </div>
             <div className='flex items-center gap-1'>
                <Star className="h-4 w-4" /> {provider.rating || 'N/A'}
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50">
        <Button asChild className="w-full">
          <Link href={`/u/${provider.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProvidersLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
                <CardContent className="p-6 text-center">
                <Skeleton className="mx-auto h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto mb-3" />
                <div className="flex justify-center gap-2 mb-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-24 mx-auto" />
              </CardContent>
              <CardFooter className="p-4 bg-muted/50">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
}

export default function ProvidersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const providersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'serviceProviderProfiles'));
  }, [firestore]);

  const { data: allProviders, isLoading } = useCollection<ServiceProvider>(providersQuery);

  const filteredProviders = useMemo(() => {
    if (!allProviders) return [];
    return allProviders.filter(provider => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = term === '' ||
        provider.name.toLowerCase().includes(term) ||
        (provider.skills && (provider.skills as string[]).some(skill => skill.toLowerCase().includes(term))) ||
        (provider.location && (typeof provider.location === 'string' ? provider.location : provider.location.city).toLowerCase().includes(term));
      
      const matchesSkill = skillFilter === '' || (provider.skills && (provider.skills as string[]).includes(skillFilter));

      return matchesSearch && matchesSkill;
    });
  }, [allProviders, searchTerm, skillFilter]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Discover Service Providers
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Find talented professionals to bring your event to life.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name, skill, or location..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceCategories.map(type => (
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
                <DropdownMenuCheckboxItem>Top Rated</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isLoading && <ProvidersLoadingSkeleton />}

      {!isLoading && (
        <>
          {filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProviders.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No providers found matching your criteria.</p>
          )}
        </>
      )}
    </div>
  );
}
