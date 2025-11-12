'use client';

import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  Firestore,
  getDoc,
} from 'firebase/firestore';
import { notFound, useParams } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Grid3X3, Image as ImageIcon, Plus, ZoomIn, MapPin, Calendar } from 'lucide-react';
import { mockServiceProviders } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

async function findUserProfile(
  db: Firestore,
  id: string
): Promise<UserProfile | null> {
  // 1. Check if the ID matches a document in the `users` collection.
  const userDocRef = doc(db, 'users', id);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
  }
  
  // 2. Check if the ID matches a document in the `serviceProviderProfiles` collection.
  const spDocRef = doc(db, 'serviceProviderProfiles', id);
  const spDocSnap = await getDoc(spDocRef);
  if (spDocSnap.exists()) {
    return { id: spDocSnap.id, ...spDocSnap.data() } as UserProfile;
  }

  // 3. If not found by ID, query `serviceProviderProfiles` by `userAccountId`.
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

function PortfolioLoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Profile Info Skeleton */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Grid Skeleton */}
        <div className="lg:col-span-3">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioImageDialog({ imageUrl, alt, trigger }: { imageUrl: string; alt: string; trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PortfolioPage() {
  const params = useParams();
  const userId = params.id as string;
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (firestore && userId) {
      setIsLoading(true);
      findUserProfile(firestore, userId)
        .then(userProfile => {
          setProfile(userProfile);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [firestore, userId]);

  if (isLoading) {
    return <PortfolioLoadingSkeleton />;
  }

  if (!profile || profile.profileType !== 'serviceProvider') {
    notFound();
  }

  // Combine real portfolio images with mock ones for a fuller demo
  const mockProvider = mockServiceProviders.find(p => p.id === profile.id || (p as any).userAccountId === (profile as any).userAccountId);
  const portfolioImages = [
    ...((profile as any).portfolioImages || []),
    ...(mockProvider?.portfolioImages || [])
  ];

  // Categorize images if we have mock data with categories
  const categorizedImages = portfolioImages.map((imageUrl, index) => ({
    id: index,
    url: imageUrl,
    category: mockProvider?.portfolioCategories?.[index] || 'General',
    title: mockProvider?.portfolioTitles?.[index] || `Work ${index + 1}`,
    description: mockProvider?.portfolioDescriptions?.[index] || 'Portfolio image'
  }));

  const categories = ['all', ...new Set(categorizedImages.map(img => img.category))];
  const filteredImages = selectedCategory === 'all' 
    ? categorizedImages 
    : categorizedImages.filter(img => img.category === selectedCategory);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="rounded-full">
          <Link href={`/u/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to profile</span>
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-3xl font-bold">Portfolio Gallery</h1>
          <p className="text-muted-foreground">A showcase of work by {profile.name}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Profile Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-4">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <Avatar className="h-20 w-20 border-2 border-background shadow-md">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-lg">
                  {profile.name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {profile.location || 'Location not specified'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.bio && (
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {profile.bio}
              </p>
            )}
            
            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Services</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {profile.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.skills.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="text-center">
                <div className="font-semibold text-foreground">{portfolioImages.length}</div>
                <div>Projects</div>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center">
                <div className="font-semibold text-foreground">4.8</div>
                <div>Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Categories Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full capitalize"
                >
                  {category === 'all' ? (
                    <Grid3X3 className="h-3 w-3 mr-1" />
                  ) : (
                    <ImageIcon className="h-3 w-3 mr-1" />
                  )}
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Portfolio Grid */}
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredImages.map((image) => (
                <PortfolioImageDialog
                  key={image.id}
                  imageUrl={image.url}
                  alt={image.title}
                  trigger={
                    <Card className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-transparent">
                      <CardContent className="p-0 relative">
                        <div className="relative aspect-square">
                          <Image
                            src={image.url}
                            alt={image.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center p-4">
                              <ZoomIn className="h-8 w-8 mx-auto mb-2" />
                              <h3 className="font-semibold text-sm mb-1">{image.title}</h3>
                              <p className="text-xs text-white/80">{image.category}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  }
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="rounded-full bg-muted p-6 mb-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardHeader>
                <CardTitle>No Portfolio Images</CardTitle>
                <CardDescription>
                  {profile.name} hasn't added any portfolio images in the {selectedCategory} category yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/u/${userId}`}>
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          {portfolioImages.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-0">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">Like what you see?</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Contact {profile.name} to discuss your project and bring your vision to life.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild>
                    <Link href={`/messages/${userId}`}>
                      Send Message
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/u/${userId}`}>
                      View Full Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
