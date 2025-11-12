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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { EventType, ServiceCategory, Location } from '@/lib/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const eventTypes: EventType[] = ['Wedding', 'Birthday', 'Corporate', 'Conference', 'Party', 'Other'];
const serviceCategories: ServiceCategory[] = ['Photography', 'DJ', 'Catering', 'Decor', 'Planning', 'Music', 'Videography'];

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.').max(100, 'Title must be less than 100 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description must be less than 500 characters.'),
  type: z.enum(eventTypes),
  date: z.date(),
  location: z.string().min(2, 'Location is required.'),
  serviceNeeds: z.array(z.string()).min(1, 'At least one service is required.'),
});

// A simple function to get coordinates for a few cities.
// In a real app, you'd use a geocoding API.
const getCoordinatesForCity = (city: string): Location => {
    const cityCoordinates: { [key: string]: { lat: number; lng: number, country: string } } = {
        'Sunnyvale, CA': { lat: 37.3688, lng: -122.0363, country: 'USA' },
        'San Francisco, CA': { lat: 37.7749, lng: -122.4194, country: 'USA' },
        'Oakland, CA': { lat: 37.8044, lng: -122.2712, country: 'USA' },
        'Palo Alto, CA': { lat: 37.4419, lng: -122.1430, country: 'USA' },
        'Toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada' },
    };
    const key = Object.keys(cityCoordinates).find(k => city.startsWith(k)) || 'San Francisco, CA';
    const coords = cityCoordinates[key];

    return {
        city: city,
        country: coords.country,
        lat: coords.lat,
        lng: coords.lng,
    }
};


export default function CreateEventPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      serviceNeeds: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to create an event.',
        });
        return;
    }
    
    const eventsCollectionRef = collection(firestore, `users/${user.uid}/events`);

    const newEvent = {
      title: values.title,
      description: values.description,
      type: values.type,
      eventDate: values.date.toISOString(),
      location: getCoordinatesForCity(values.location),
      serviceNeeds: values.serviceNeeds,
      userAccountId: user.uid,
      imageUrls: [], // Placeholder for now
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
        const docRef = await addDoc(eventsCollectionRef, newEvent);
        toast({
            title: 'Event Created!',
            description: `${values.title} has been successfully created.`,
        });
        router.push(`/u/${user.uid}/events/${docRef.id}`);
    } catch (error) {
        console.error("Error creating event: ", error);
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: eventsCollectionRef.path,
                operation: 'create',
                requestResourceData: newEvent,
            })
        );
    }
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create a New Event</CardTitle>
          <CardDescription>
            Tell us about your event and what services you're looking for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Summer Music Festival" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event in detail. What makes it special?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                     <FormDescription>
                        Enter a city and state, e.g., "San Francisco, CA"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="serviceNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services Needed</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value.length && "text-muted-foreground"
                          )}
                        >
                          {field.value.length > 0
                            ? field.value.join(', ')
                            : "Select services"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                       <Command>
                        <CommandInput placeholder="Search services..." />
                        <CommandList>
                            <CommandEmpty>No service found.</CommandEmpty>
                            <CommandGroup>
                            {serviceCategories.map((category) => (
                                <CommandItem
                                key={category}
                                onSelect={() => {
                                    const newValue = field.value.includes(category)
                                    ? field.value.filter((item) => item !== category)
                                    : [...field.value, category];
                                    form.setValue('serviceNeeds', newValue);
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value.includes(category) ? "opacity-100" : "opacity-0"
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
                    Select all the services you are looking for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
