
'use client';

import {
    Card,
    CardContent,
    CardFooter,
    CardTitle,
} from '@/components/ui/card';
import type { ServiceProvider } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Star } from 'lucide-react';
import Link from 'next/link';

export function ProviderCard({ provider }: { provider: ServiceProvider }) {
  const profileUrl = (provider as any).userAccountId || provider.id;

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
            href={`/u/${profileUrl}`}
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
          <Link href={`/u/${profileUrl}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
