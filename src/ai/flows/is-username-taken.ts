'use server';
/**
 * @fileOverview A utility flow to check if a username is already taken.
 *
 * - isUsernameTaken - A function that checks for username uniqueness.
 * - IsUsernameTakenInput - The input type for the isUsernameTaken function.
 * - IsUsernameTakenOutput - The return type for the isUsernameTaken function.
 */

import { ai } from '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';
import { z } from 'genkit';

const IsUsernameTakenInputSchema = z.object({
  username: z.string().describe('The username to check for uniqueness.'),
});
export type IsUsernameTakenInput = z.infer<typeof IsUsernameTakenInputSchema>;

const IsUsernameTakenOutputSchema = z.object({
  isTaken: z
    .boolean()
    .describe('Whether or not the username is already taken.'),
});
export type IsUsernameTakenOutput = z.infer<typeof IsUsernameTakenOutputSchema>;

export async function isUsernameTaken(
  input: IsUsernameTakenInput
): Promise<IsUsernameTakenOutput> {
  // Directly await the flow, which now returns the tool's output.
  const result = await isUsernameTakenFlow(input);
  return result;
}

const checkUsernameUniqueness = ai.defineTool(
  {
    name: 'checkUsernameUniqueness',
    description: 'Checks if a given username is already in use in the database.',
    inputSchema: IsUsernameTakenInputSchema,
    outputSchema: IsUsernameTakenOutputSchema,
  },
  async ({ username }) => {
    console.log(`Checking username: ${username}`);
    try {
      await initializeServerFirebase();
      const firestore = getFirestore();
      const normalizedUsername = username.toLowerCase();

      const usersQuery = firestore
        .collection('users')
        .where('username', '==', normalizedUsername);
      const serviceProvidersQuery = firestore
        .collection('serviceProviderProfiles')
        .where('username', '==', normalizedUsername);

      const [usersSnapshot, serviceProvidersSnapshot] = await Promise.all([
        usersQuery.get(),
        serviceProvidersQuery.get(),
      ]);

      const isTaken = !usersSnapshot.empty || !serviceProvidersSnapshot.empty;
      console.log(`Username "${username}" is taken: ${isTaken}`);
      return { isTaken };
    } catch (error) {
        console.error("Error in checkUsernameUniqueness tool: ", error);
        // In case of a database error, default to `isTaken: false`
        // to allow signup to proceed, though with a potential for duplicates.
        // A more robust solution might involve returning an error state.
        return { isTaken: false };
    }
  }
);

const isUsernameTakenFlow = ai.defineFlow(
  {
    name: 'isUsernameTakenFlow',
    inputSchema: IsUsernameTakenInputSchema,
    outputSchema: IsUsernameTakenOutputSchema,
  },
  async (input) => {
    // Directly call the tool and return its output.
    // This is more efficient and reliable than using an LLM to trigger the tool.
    return await checkUsernameUniqueness(input);
  }
);
