'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Event, ServiceProvider } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  description: z
    .string()
    .min(10, 'Offer description must be at least 10 characters.')
    .max(500, 'Description must be less than 500 characters.'),
  price: z.coerce
    .number()
    .min(0, 'Price must be a positive number.')
    .positive('Price must be greater than zero.'),
});

type SubmitOfferDialogProps = {
  event: Event;
  serviceProviderProfile: ServiceProvider;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function SubmitOfferDialog({
  event,
  serviceProviderProfile,
  children,
  isOpen,
  onOpenChange,
}: SubmitOfferDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      price: 0.0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !event) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit an offer.',
      });
      return;
    }

    const offersCollectionRef = collection(firestore, 'offers');

    const newOffer = {
      eventID: event.id,
      eventOwnerId: event.userAccountId, // Assuming userAccountId is the owner
      serviceProviderProfileId: user.uid, // The service provider is the current user
      description: values.description,
      price: values.price,
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = addDoc(offersCollectionRef, newOffer);
      toast({
        title: 'Offer Submitted!',
        description: 'Your offer has been sent to the event creator.',
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting offer: ', error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: offersCollectionRef.path,
          operation: 'create',
          requestResourceData: newOffer,
        })
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Submit Offer</DialogTitle>
          <DialogDescription>
            Send your proposal for the event: <strong>{event.title}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe what you're offering (e.g., '8 hours of wedding photography coverage, fully edited digital gallery')."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Submitting...'
                  : 'Submit Offer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
