'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, serverTimestamp, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import type { ServiceCategory, UserProfile } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User, Building, MapPin, Mail, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const serviceCategories: ServiceCategory[] = ['Photography', 'DJ', 'Catering', 'Decor', 'Planning', 'Music', 'Videography'];

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be less than 50 characters.'),
  bio: z.string().max(200, 'Bio must be less than 200 characters.').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters.').optional(),
  profileType: z.enum(['eventPoster', 'serviceProvider']),
  skills: z.array(z.string()).optional(),
});

export default function ProfileSettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
      location: '',
      profileType: 'eventPoster',
      skills: [],
    },
  });

  const profileType = form.watch('profileType');
  const skills = form.watch('skills');

  useEffect(() => {
    async function fetchProfile() {
      if (!user || !firestore) return;
      setIsLoading(true);
      
      let userProfile: UserProfile | null = null;
      
      // Check users collection
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userProfile = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
      } else {
        // Check serviceProviderProfiles collection
        const spQuery = query(collection(firestore, 'serviceProviderProfiles'), where('userAccountId', '==', user.uid));
        const spSnap = await getDocs(spQuery);
        if (!spSnap.empty) {
            const spDoc = spSnap.docs[0];
            userProfile = { id: spDoc.id, ...spDoc.data() } as UserProfile;
        }
      }

      setProfile(userProfile);

      if (userProfile) {
        form.reset({
          name: userProfile.name || user.displayName || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          profileType: userProfile.profileType || 'eventPoster',
          skills: (userProfile.skills as string[] | undefined) || [],
        });
      } else if (user) {
          form.reset({
              name: user.displayName || '',
              bio: '',
              location: '',
              profileType: 'eventPoster',
              skills: [],
          });
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [user, firestore, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication error. Please try again.',
      });
      return;
    }
    
    const isSwitchingToProvider = values.profileType === 'serviceProvider' && profile?.profileType !== 'serviceProvider';

    const collectionName = isSwitchingToProvider || values.profileType === 'serviceProvider' ? 'serviceProviderProfiles' : 'users';
    
    const docId = collectionName === 'serviceProviderProfiles' 
      ? (profile?.profileType === 'serviceProvider' ? profile.id : user.uid)
      : user.uid;
      
    const docRef = doc(firestore, collectionName, docId);

    try {
        const dataToSave: Partial<UserProfile> = {
            ...values,
            email: user.email,
            avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`,
            updatedAt: serverTimestamp() as any,
        };

        if (values.profileType === 'eventPoster') {
          dataToSave.skills = [];
        }

        if (collectionName === 'serviceProviderProfiles') {
            (dataToSave as any).userAccountId = user.uid;
        }

        await setDoc(docRef, dataToSave, { merge: true });

        toast({
            title: 'Profile Updated Successfully! 🎉',
            description: 'Your profile has been updated and is now live.',
        });

        router.push(`/u/${user.uid}`);

    } catch (error) {
        console.error("Error updating profile: ", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update your profile. Please try again.',
        });
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Preview Card Skeleton */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>

          {/* Form Skeleton */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Preview Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-4">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user?.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user?.uid}`} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-blue-100 to-purple-100">
                  {form.watch('name')?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <Badge variant={profileType === 'serviceProvider' ? 'default' : 'secondary'} className="px-2 py-1 text-xs">
                  {profileType === 'serviceProvider' ? (
                    <Building className="h-3 w-3 mr-1" />
                  ) : (
                    <User className="h-3 w-3 mr-1" />
                  )}
                  {profileType === 'serviceProvider' ? 'Provider' : 'Event Planner'}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-xl font-headline">
              {form.watch('name') || 'Your Name'}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {form.watch('location') || 'Add location'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {form.watch('bio') || 'Your bio will appear here...'}
              </p>
            </div>
            
            {profileType === 'serviceProvider' && skills && skills.length > 0 && (
              <div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Services Offered</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="font-headline text-2xl">Profile Settings</CardTitle>
            </div>
            <CardDescription>
              Customize your public profile and tell others about yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Display Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., John Doe or Creative Events Co." 
                            {...field} 
                            className="transition-colors focus:border-primary"
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your public profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., San Francisco, CA" 
                            {...field} 
                            className="transition-colors focus:border-primary"
                          />
                        </FormControl>
                        <FormDescription>
                          Your city and state/country
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Bio</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            placeholder="Tell us a little about yourself or your business. What makes you unique?"
                            className="resize-none min-h-[100px] transition-colors focus:border-primary"
                            {...field}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            {field.value?.length || 0}/200
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        A brief introduction helps others get to know you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileType"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div>
                        <FormLabel className="text-base">I am a...</FormLabel>
                        <FormDescription>
                          Choose the role that best describes you on this platform
                        </FormDescription>
                      </div>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4 md:grid-cols-2"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="eventPoster" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                              <User className="h-6 w-6 mb-2 text-muted-foreground" />
                              <span className="font-semibold">Event Planner</span>
                              <span className="text-sm text-muted-foreground text-center mt-1">
                                I create events and look for talent
                              </span>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="serviceProvider" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                              <Building className="h-6 w-6 mb-2 text-muted-foreground" />
                              <span className="font-semibold">Service Provider</span>
                              <span className="text-sm text-muted-foreground text-center mt-1">
                                I offer my skills for events
                              </span>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {profileType === 'serviceProvider' && (
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Services & Skills</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-auto min-h-10 py-2",
                                  !field.value?.length && "text-muted-foreground"
                                )}
                              >
                                <div className="flex flex-wrap gap-1 flex-1 justify-start">
                                  {field.value && field.value.length > 0 ? (
                                    field.value.map((skill) => (
                                      <Badge key={skill} variant="secondary" className="mr-1">
                                        {skill}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span>Select your skills and services</span>
                                  )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search skills..." />
                              <CommandList>
                                <CommandEmpty>No skill found.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                  {serviceCategories.map((category) => (
                                    <CommandItem
                                      key={category}
                                      onSelect={() => {
                                        const value = field.value || [];
                                        const newValue = value.includes(category)
                                          ? value.filter((item) => item !== category)
                                          : [...value, category];
                                        form.setValue('skills', newValue);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value?.includes(category) ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {category}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Select the services you offer. This helps event planners find you.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="flex-1 gap-2"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}