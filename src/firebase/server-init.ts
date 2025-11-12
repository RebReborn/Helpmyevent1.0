'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseConfig } from './config';

/**
 * Initializes and returns the Firebase Admin App instance.
 * Ensures that initialization only happens once.
 */
export async function initializeServerFirebase(): Promise<App> {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
