'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-event-description.ts';
import '@/ai/flows/recommend-service-providers.ts';
import '@/ai/flows/is-username-taken.ts';
