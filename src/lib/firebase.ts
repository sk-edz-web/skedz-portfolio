import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  Firestore,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { FirebaseConfig, CustomerReview } from "../types";

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAzUvLvppvUz_-cpV6Tlm5euOIR5SmPRvE",
  authDomain: "skedz-main.firebaseapp.com",
  databaseURL: "https://skedz-main-default-rtdb.firebaseio.com",
  projectId: "skedz-main",
  storageBucket: "skedz-main.firebasestorage.app",
  messagingSenderId: "713713653066",
  appId: "1:713713653066:web:dead8b3b10638d7a22ddb3",
  measurementId: "G-GRNW1VX6GL",
};

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let analyticsInstance: Analytics | null = null;

export function initFirebase(customConfig?: FirebaseConfig | null): {
  app: FirebaseApp;
  db: Firestore;
} {
  const config = customConfig && customConfig.apiKey && customConfig.projectId ? customConfig : DEFAULT_FIREBASE_CONFIG;

  if (getApps().length === 0) {
    appInstance = initializeApp(config);
  } else {
    appInstance = getApp();
  }

  firestoreInstance = getFirestore(appInstance);

  // Initialize Analytics if supported in browser environment
  if (typeof window !== "undefined") {
    isSupported()
      .then((supported) => {
        if (supported && appInstance) {
          analyticsInstance = getAnalytics(appInstance);
        }
      })
      .catch(() => {
        // Analytics not supported in this context
      });
  }

  return { app: appInstance, db: firestoreInstance };
}

export function getFirebaseDb(customConfig?: FirebaseConfig | null): Firestore {
  if (firestoreInstance) return firestoreInstance;
  const { db } = initFirebase(customConfig);
  return db;
}

export async function saveContactMessageToFirestore(
  config: FirebaseConfig | null | undefined,
  data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }
) {
  const { db } = initFirebase(config);
  const messagesCol = collection(db, "contact_messages");
  const docRef = await addDoc(messagesCol, {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    message: data.message,
    source: "SKEDZ-S.PORTAL",
    createdAt: serverTimestamp(),
    timestampISO: new Date().toISOString(),
  });
  return docRef.id;
}

export async function saveCustomerReviewToFirestore(
  config: FirebaseConfig | null | undefined,
  data: {
    name: string;
    rating: number;
    comment: string;
    deviceId: string;
  }
) {
  const { db } = initFirebase(config);
  const reviewsCol = collection(db, "customer_reviews");
  const docRef = await addDoc(reviewsCol, {
    name: data.name,
    rating: data.rating,
    comment: data.comment,
    deviceId: data.deviceId,
    source: "SKEDZ-S.PORTAL",
    createdAt: serverTimestamp(),
    timestampISO: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getReviewsFromFirestore(
  config?: FirebaseConfig | null
): Promise<CustomerReview[]> {
  try {
    const { db } = initFirebase(config);
    const reviewsCol = collection(db, "customer_reviews");
    const q = query(reviewsCol, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const reviews: CustomerReview[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        name: data.name || "Anonymous",
        rating: Number(data.rating) || 5,
        comment: data.comment || "",
        deviceId: data.deviceId || "",
        createdAt: data.timestampISO || new Date().toISOString(),
      });
    });
    return reviews;
  } catch (err) {
    console.warn("Could not retrieve reviews from Firestore:", err);
    return [];
  }
}

