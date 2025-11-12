'use server';

/**
 * @fileOverview AI flow to recommend service providers based on event details.
 *
 * - recommendServiceProviders - A function that recommends service providers.
 * - RecommendServiceProvidersInput - The input type for the recommendServiceProviders function.
 * - RecommendServiceProvidersOutput - The return type for the recommendServiceProviders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendServiceProvidersInputSchema = z.object({
  eventType: z.string().describe('The type of event (e.g., wedding, birthday, corporate).'),
  eventDate: z.string().describe('The date of the event.'),
  eventLocation: z.string().describe('The location of the event.'),
  serviceNeeds: z.array(z.string()).describe('A list of service needs (e.g., photographer, DJ, catering).'),
  budget: z.string().describe('The budget for the event.'),
  additionalDetails: z.string().optional().describe('Any additional details about the event.'),
});

export type RecommendServiceProvidersInput = z.infer<typeof RecommendServiceProvidersInputSchema>;

const RecommendServiceProvidersOutputSchema = z.object({
  recommendedProviders: z.array(
    z.object({
      providerName: z.string().describe('The name of the service provider.'),
      providerSkills: z.array(z.string()).describe('The skills of the service provider'),
      suitabilityScore: z.number().describe('A score indicating how suitable the provider is for the event.'),
      reasoning: z.string().describe('Explanation of why the provider is a good match.'),
    })
  ).describe('A list of recommended service providers.'),
});

export type RecommendServiceProvidersOutput = z.infer<typeof RecommendServiceProvidersOutputSchema>;

export async function recommendServiceProviders(
  input: RecommendServiceProvidersInput
): Promise<RecommendServiceProvidersOutput> {
  return recommendServiceProvidersFlow(input);
}

const recommendServiceProvidersPrompt = ai.definePrompt({
  name: 'recommendServiceProvidersPrompt',
  input: {schema: RecommendServiceProvidersInputSchema},
  output: {schema: RecommendServiceProvidersOutputSchema},
  prompt: `You are an AI assistant specialized in recommending service providers for events.

  Based on the following event details, recommend a list of service providers that would be a good fit.
  Provide a suitability score (0-100) and reasoning for each recommendation.

  Event Type: {{{eventType}}}
  Event Date: {{{eventDate}}}
  Event Location: {{{eventLocation}}}
  Service Needs: {{#each serviceNeeds}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Budget: {{{budget}}}
  Additional Details: {{{additionalDetails}}}

  Format your response as a JSON object with a "recommendedProviders" array. Each object in the array should include "providerName",  their skills using the "providerSkills" array, "suitabilityScore", and "reasoning".`,
});

const recommendServiceProvidersFlow = ai.defineFlow(
  {
    name: 'recommendServiceProvidersFlow',
    inputSchema: RecommendServiceProvidersInputSchema,
    outputSchema: RecommendServiceProvidersOutputSchema,
  },
  async input => {
    const {output} = await recommendServiceProvidersPrompt(input);
    return output!;
  }
);
