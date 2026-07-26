import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { RoadmapData } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const saveUserRoadmap = async (userId: string, roadmap: RoadmapData) => {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      roadmap,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("Firestore is offline, unable to save roadmap.");
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserRoadmap = async (userId: string): Promise<RoadmapData | null> => {
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().roadmap as RoadmapData;
    }
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("Firestore is offline, unable to fetch user roadmap.");
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
};

export const saveUserProgress = async (userId: string, progress: { completedSteps: string[], stepNotes: Record<string, string>, hoursPerDay: number, lastActivityDate?: string | null, currentStreak?: number }) => {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      progress,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("Firestore is offline, unable to save progress.");
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProgress = async (userId: string): Promise<{ completedSteps: string[], stepNotes: Record<string, string>, hoursPerDay: number, lastActivityDate?: string | null, currentStreak?: number } | null> => {
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().progress as { completedSteps: string[], stepNotes: Record<string, string>, hoursPerDay: number, lastActivityDate?: string | null, currentStreak?: number };
    }
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("Firestore is offline, unable to fetch user progress.");
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
};
