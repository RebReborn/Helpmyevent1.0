'use client';

import { recommendServiceProviders, RecommendServiceProvidersOutput } from '@/ai/flows/recommend-service-providers';
import type { Event } from '@/lib/types';
import { Wand2 } from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

type ProviderRecommendationsProps = {
  event: Event;
};

export function ProviderRecommendations({ event }: ProviderRecommendationsProps) {
  const [isPending, startTransition] = useTransition();
  const [recommendations, setRecommendations] = useState<RecommendServiceProvidersOutput | null>(null);
  const { toast } = useToast();

  const handleGetRecommendations = () => {
    startTransition(async () => {
      try {
        const result = await recommendServiceProviders({
          eventType: event.type,
          eventDate: event.date,
          eventLocation: event.location,
          serviceNeeds: event.serviceNeeds,
          budget: 'Portfolio building (free)',
          additionalDetails: event.description,
        });
        setRecommendations(result);
      } catch (error) {
        console.error('AI Recommendation Error:', error);
        toast({
          variant: 'destructive',
          title: 'AI Error',
          description: 'Could not generate recommendations at this time.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Wand2 className="h-6 w-6 text-primary" />
          AI Provider Suggestions
        </CardTitle>
        <CardDescription>
          Let our AI suggest the best-fit service providers for your event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!recommendations && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center">
            <h3 className="text-lg font-semibold">Ready to find your perfect match?</h3>
            <p className="text-sm text-muted-foreground">
              Click the button to get personalized recommendations.
            </p>
            <Button onClick={handleGetRecommendations} disabled={isPending}>
              {isPending ? 'Generating...' : 'Get Recommendations'}
            </Button>
          </div>
        )}

        {isPending && !recommendations && (
            <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">AI is thinking...</p>
                <Progress value={50} className="w-full h-2 mt-2 animate-pulse" />
            </div>
        )}

        {recommendations && (
          <div className="space-y-4">
            {recommendations.recommendedProviders.map((provider, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card/50">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold">{provider.providerName}</h4>
                        <div className="flex gap-2 my-1">
                            {provider.providerSkills.map(skill => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-primary text-lg">{provider.suitabilityScore}%</p>
                        <p className="text-xs text-muted-foreground">Match</p>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{provider.reasoning}</p>
                <Button size="sm" variant="link" className="p-0 h-auto mt-2">View Profile</Button>
              </div>
            ))}
             <Button onClick={handleGetRecommendations} disabled={isPending} variant="outline" className="w-full mt-4">
              {isPending ? 'Regenerating...' : 'Generate Again'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
