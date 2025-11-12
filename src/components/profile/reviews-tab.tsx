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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '../ui/textarea';
import type { Review } from '@/lib/types';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Progress } from '../ui/progress';

const reviewFormSchema = z.object({
  rating: z.number().min(1, 'Rating is required.').max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters.').max(500, 'Comment must be less than 500 characters.'),
});

function StarRatingInput({ field, disabled }: { field: any, disabled: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => field.onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            className={cn(
              'h-6 w-6 cursor-pointer transition-colors',
              star <= (hover || field.value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
        <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{review.reviewerName}</p>
            <p className="text-xs text-muted-foreground">
              {review.createdAt && new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                )}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
      </div>
    </div>
  );
}

function ReviewForm({ profileId }: { profileId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  async function onSubmit(values: z.infer<typeof reviewFormSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to leave a review.' });
      return;
    }
    
    if (user.uid === profileId) {
      toast({ variant: 'destructive', title: 'Error', description: 'You cannot review your own profile.' });
      return;
    }

    const reviewsCollectionRef = collection(firestore, `reviews`);
    
    const newReview: Omit<Review, 'id'> = {
      reviewedEntityId: profileId,
      reviewedEntityType: 'user',
      reviewerUserAccountId: user.uid,
      reviewerName: user.displayName || 'Anonymous',
      reviewerAvatar: user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`,
      rating: values.rating,
      comment: values.comment,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(reviewsCollectionRef, newReview);
      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting review: ", error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your review. Please try again.',
      });
    }
  }
  
  if (!user || user.uid === profileId) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>Share your experience working with this professional.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating</FormLabel>
                  <FormControl>
                    <StarRatingInput field={field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your experience..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ReviewsSummary({ reviews, isLoading }: { reviews: Review[], isLoading: boolean }) {
    const summary = useMemo(() => {
        if (!reviews || reviews.length === 0) {
            return {
                average: 0,
                total: 0,
                distribution: [0, 0, 0, 0, 0]
            };
        }

        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        const distribution = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            distribution[5 - r.rating]++;
        });

        return {
            average: parseFloat(average.toFixed(1)),
            total,
            distribution: distribution.map(d => (d / total) * 100),
        };
    }, [reviews]);
    
    if (isLoading) {
        return (
             <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                           <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-4 w-8" />
                           </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center space-y-2 border-r-0 md:border-r pr-0 md:pr-6">
                    <p className="text-4xl font-bold">{summary.average.toFixed(1)}</p>
                    <div className="flex">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-5 w-5', i < Math.round(summary.average) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50')} />
                    ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Based on {summary.total} reviews</p>
                </div>
                <div className="space-y-1.5">
                    {summary.distribution.map((percentage, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-medium flex items-center gap-1 w-12">{5-i} <Star className="h-3 w-3" /></span>
                            <Progress value={percentage} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(percentage)}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function ReviewsTab({ profileId }: { profileId: string }) {
  const firestore = useFirestore();

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(
        collection(firestore, `reviews`), 
        where('reviewedEntityId', '==', profileId),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, profileId]);

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
  
  return (
    <div className="space-y-6">
        <ReviewsSummary reviews={reviews || []} isLoading={isLoading} />
      
        <Card>
            <CardContent className="p-6 space-y-6">
                {isLoading && (
                [...Array(3)].map((_, i) => (
                    <div key={i}>
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-4 w-1/5" />
                                <Skeleton className="h-12 w-full mt-2" />
                            </div>
                        </div>
                        {i < 2 && <Separator className="my-6" />}
                    </div>
                ))
                )}
                {!isLoading && reviews && reviews.length > 0 ? (
                reviews.map((review, i) => (
                    <React.Fragment key={review.id}>
                        <ReviewCard review={review} />
                        {i < reviews.length - 1 && <Separator />}
                    </React.Fragment>
                ))
                ) : (
                !isLoading && (
                    <div className="text-center py-10">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No reviews yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Be the first one to leave a review.
                        </p>
                    </div>
                )
                )}
            </CardContent>
        </Card>

        <ReviewForm profileId={profileId} />
    </div>
  );
}
