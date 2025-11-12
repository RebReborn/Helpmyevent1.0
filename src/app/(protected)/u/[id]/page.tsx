'use client';

import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
  useCollection,
} from '@/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  Firestore,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import type { Conversation, Event, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Edit,
  Mail,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Star,
  UserPlus,
  UserCheck,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { EventCard } from '@/components/event-card';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ReviewsTab } from '@/components/profile/reviews-tab';

function ProfileLoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-4">
      {/* Hero Section Skeleton */}
      <Card className="relative overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-600/20" />
        <CardContent className="relative -top-16 flex flex-col items-center p-8 text-center md:flex-row md:items-start md:text-left">
          <Skeleton className="mb-4 h-32 w-32 rounded-full border-4 border-background md:mb-0 md:mr-8" />
          <div className="w-full space-y-4">
            <div className="flex flex-col items-center md:flex-row md:justify-between">
              <div className="space-y-3 text-center md:text-left">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex justify-center gap-6 md:justify-start">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="space-y-8 lg:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ServiceProviderProfileDetails({ profile, userId }: { profile: UserProfile, userId: string }) {
  return (
    <div className="space-y-6">
       <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Services & Expertise
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {Array.isArray(profile.skills) &&
                        profile.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="px-3 py-2 text-sm font-medium">
                            {skill}
                            </Badge>
                        ))}
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Performance Metrics
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
                        <div className="space-y-2">
                        <div className="text-2xl font-bold text-primary">24+</div>
                        <div className="text-sm text-muted-foreground">Events</div>
                        </div>
                        <div className="space-y-2">
                        <div className="flex items-center justify-center text-2xl font-bold">
                            4.9 <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 ml-1" />
                        </div>
                        <div className="text-sm text-muted-foreground">Rating</div>
                        </div>
                        <div className="space-y-2">
                        <div className="text-2xl font-bold text-primary">98%</div>
                        <div className="text-sm text-muted-foreground">Success</div>
                        </div>
                        <div className="space-y-2">
                        <div className="text-2xl font-bold text-primary">2y+</div>
                        <div className="text-sm text-muted-foreground">Experience</div>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Portfolio Showcase</CardTitle>
                    <CardDescription>Explore my previous work and events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center">
                            <div className="text-center">
                            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Project {i + 1}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    <Button asChild className="w-full gap-2">
                        <Link href={`/u/${userId}/portfolio`}>
                        View Full Portfolio
                        <Sparkles className="h-4 w-4" />
                        </Link>
                    </Button>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="reviews">
            <ReviewsTab profileId={userId} />
        </TabsContent>
       </Tabs>
    </div>
  );
}

function EventPlannerProfileDetails({ profile }: { profile: UserProfile }) {
  const firestore = useFirestore();
  const userId = (profile as any).userAccountId || profile.id;

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, `users/${userId}/events`));
  }, [firestore, userId]);

  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            My Events
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event History</CardTitle>
              <CardDescription>Events I've organized and managed</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))}
                </div>
              )}
              {!isLoading && (!events || events.length === 0) && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground mb-4">Start creating amazing events to build your portfolio</p>
                  <Button asChild>
                    <Link href="/events/create">Create Your First Event</Link>
                  </Button>
                </div>
              )}
              {!isLoading && events && events.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews">
            <ReviewsTab profileId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const isOwner = currentUser?.uid === id || (profile as any)?.userAccountId === currentUser?.uid;
  const profileUserId = (profile as any)?.userAccountId || (profile as any)?.id;

  // Follow logic
  const followersRef = useMemoFirebase(() => {
    if (!firestore || !profileUserId) return null;
    return collection(firestore, `users/${profileUserId}/followers`);
  }, [firestore, profileUserId]);

  const followingRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return collection(firestore, `users/${currentUser.uid}/following`);
  }, [firestore, currentUser]);

  const { data: followers } = useCollection(followersRef);
  const { data: following } = useCollection(followingRef);

  const isFollowing = useMemo(() => {
    if (!followers || !currentUser) return false;
    return followers.some(follower => follower.id === currentUser.uid);
  }, [followers, currentUser]);
  
  const handleFollowToggle = () => {
    if (!firestore || !currentUser || !profileUserId || isOwner) return;

    const followerDocRef = doc(firestore, `users/${profileUserId}/followers`, currentUser.uid);
    const followingDocRef = doc(firestore, `users/${currentUser.uid}/following`, profileUserId);
    
    const followerData = {
        followerId: currentUser.uid,
        followedId: profileUserId,
        createdAt: serverTimestamp(),
    };
    const followingData = {
        followerId: currentUser.uid,
        followedId: profileUserId,
        createdAt: serverTimestamp(),
    };

    if (isFollowing) {
        deleteDoc(followerDocRef).catch(err => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: followerDocRef.path, operation: 'delete' }));
        });
        deleteDoc(followingDocRef).catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: followingDocRef.path, operation: 'delete' }));
        });
    } else {
        setDoc(followerDocRef, followerData).catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: followerDocRef.path, operation: 'create', requestResourceData: followerData }));
        });
        setDoc(followingDocRef, followingData).catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: followingDocRef.path, operation: 'create', requestResourceData: followingData }));
        });
    }
  };

  useEffect(() => {
    if (firestore && id) {
      setIsLoading(true);
      findUserProfile(firestore, id)
        .then(userProfile => {
          setProfile(userProfile);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [firestore, id]);
  
  const handleMessage = async () => {
    if (!currentUser || !profile || !firestore) return;

    setIsCreatingConversation(true);
    
    const profileOwnerId = (profile as any).userAccountId || profile.id;

    const conversationsRef = collection(firestore, 'conversations');
    const existingConvoQuery = query(
      conversationsRef,
      where('participantIds', 'array-contains', currentUser.uid)
    );

    const querySnapshot = await getDocs(existingConvoQuery);
    let existingConversation: (Conversation & {id: string}) | null = null;
    
    querySnapshot.forEach(doc => {
      const convo = doc.data() as Conversation;
      if (convo.participantIds.includes(profileOwnerId)) {
        existingConversation = {id: doc.id, ...convo};
      }
    });

    if (existingConversation) {
      router.push(`/messages/${existingConversation.id}`);
      return;
    }

    try {
      const initialUnreadCounts = {
        [currentUser.uid]: 0,
        [profileOwnerId]: 0,
      };
      
      const newConversation = await addDoc(conversationsRef, {
        participantIds: [currentUser.uid, profileOwnerId],
        participants: {
          [currentUser.uid]: {
            name: currentUser.displayName || 'New User',
            avatarUrl: currentUser.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${currentUser.uid}`,
          },
          [profileOwnerId]: {
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          },
        },
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        unreadCounts: initialUnreadCounts,
      });
      router.push(`/messages/${newConversation.id}`);
    } catch (error) {
      console.error("Error creating conversation: ", error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  if (isLoading) {
    return <ProfileLoadingSkeleton />;
  }

  if (!profile && !isLoading) {
    notFound();
  }

  if (!profile) {
    return <ProfileLoadingSkeleton />;
  }

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';
  
  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-4">
      {/* Hero Section */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-purple-600/5">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-600/20" />
        <CardContent className="relative -top-16 flex flex-col items-center p-8 text-center md:flex-row md:items-start md:text-left">
          <Avatar className="mb-4 h-32 w-32 border-4 border-background shadow-lg md:mb-0 md:mr-8">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-purple-100">
              {profile.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex flex-col items-center md:flex-row md:justify-between">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <h1 className="font-headline text-4xl font-bold">{profile.name}</h1>
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                </div>
                
                <Badge
                  variant={profile.profileType === 'serviceProvider' ? 'default' : 'secondary'}
                  className="my-3 gap-2 px-3 py-1.5 text-sm"
                >
                  <PartyPopper className="h-4 w-4" />
                  {profile.profileType === 'serviceProvider' ? 'Service Provider' : 'Event Planner'}
                </Badge>

                {profile.bio && (
                  <p className="mt-2 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    {profile.bio}
                  </p>
                )}
              </div>

              {isOwner ? (
                <Button asChild className="mt-4 md:mt-0 gap-2">
                  <Link href="/profile">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              ) : (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row md:mt-0">
                  <Button 
                    variant={isFollowing ? "outline" : "default"} 
                    onClick={handleFollowToggle}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button 
                    onClick={handleMessage} 
                    disabled={isCreatingConversation}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4"/>
                    {isCreatingConversation ? 'Starting...' : 'Message'}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground md:justify-start">
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> 
                  {typeof profile.location === 'string' ? profile.location : profile.location.city}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> 
                Joined {joinDate}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> 
                Active today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Profile Details */}
        <div className="space-y-8 lg:col-span-3">
          {profile.profileType === 'serviceProvider' ? (
            <ServiceProviderProfileDetails profile={profile} userId={profileUserId} />
          ) : (
            <EventPlannerProfileDetails profile={profile} />
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Social Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Followers</span>
                  </div>
                  <span className="font-semibold">{followers?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Following</span>
                  </div>
                  <span className="font-semibold">{following?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Collaborations</span>
                  </div>
                  <span className="font-semibold">23</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Response Rate</span>
                  </div>
                  <span className="font-semibold">95%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isOwner && (
                <>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Heart className="h-4 w-4" />
                    Save to Favorites
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                View Availability
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
