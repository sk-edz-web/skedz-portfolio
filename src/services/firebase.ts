import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  push, 
  remove, 
  update,
  get
} from 'firebase/database';
import { ProjectItem, SiteSettings, InquiryItem } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyAhScqRViJMBouB_gN7E_thvNCsU0v4Yc8",
  authDomain: "skedz-496712.firebaseapp.com",
  databaseURL: "https://skedz-496712-default-rtdb.firebaseio.com",
  projectId: "skedz-496712",
  storageBucket: "skedz-496712.firebasestorage.app",
  messagingSenderId: "697426663825",
  appId: "1:697426663825:web:a759cf6a10d43ab6206230",
  measurementId: "G-3D0MZCDDFB"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export const defaultSettings: SiteSettings = {
  name: "Sarathi",
  tagline: "Web Developer & Freelance Editor",
  heroTitle: "Crafting High-Performance Code & Cinematic Edits",
  heroSubtitle: "Merging engineering precision with visual storytelling to build modern digital experiences.",
  role1: "Web Developer",
  role2: "Freelance Editor",
  webExperienceYears: "3+ Years",
  webExperienceDesc: "Specializing in React, TypeScript, responsive layouts, and interactive modern web applications.",
  editorExperienceYears: "4+ Years",
  editorExperienceDesc: "Expertise in cinematic storytelling, fast-paced rhythm editing, color grading, and motion graphics.",
  aboutBio: "Hello! I am Sarathi, an enthusiastic Web Developer and creative Freelance Editor based in Tamil Nadu. I bridge the worlds of programming and cinematic design—building clean, high-performance web products while also directing dynamic visual edits.",
  aboutPhilosophyWeb: "Clean architecture, component modularity, fluid responsiveness, and aesthetic precision.",
  aboutPhilosophyEdit: "Rhythm, pacing, immersive color grading, and visual storytelling that captures attention.",
  skillsWeb: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Node.js", "Firebase", "REST APIs", "UI/UX Design"],
  skillsEdit: ["Premiere Pro", "After Effects", "DaVinci Resolve", "CapCut Pro", "Color Grading", "Sound Design", "Motion VFX"],
  email: "sarathik354@gmail.com",
  phone: "9345306572",
  whatsappMessage: "Hi Sarathi, I reviewed your portfolio and would like to discuss a project!",
  avatarUrl: "https://i.ibb.co/MyQn2Mnh/myimg.jpg",
  accentColor: "#38bdf8",
  secondaryAccent: "#c084fc",
  textAlign: "center",
  backgroundTheme: "dark-slate"
};

const SETTINGS_KEY = 'sarathi_site_settings_cache';
const PROJECTS_KEY = 'sarathi_projects_cache';

/**
 * Subscribe to Real-time Projects
 */
export function subscribeToProjects(
  callback: (projects: ProjectItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const projectsRef = ref(db, 'projects');
  
  const unsubscribe = onValue(projectsRef, (snapshot) => {
    try {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
        return;
      }
      
      const list: ProjectItem[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        title: val.title || 'Untitled Project',
        description: val.description || '',
        category: (val.category === 'edit' ? 'edit' : 'web'),
        images: Array.isArray(val.images) ? val.images : (val.image ? [val.image] : []),
        link: val.link || '#',
        tags: Array.isArray(val.tags) ? val.tags : (val.tags ? String(val.tags).split(',').map(s => s.trim()) : []),
        createdAt: val.createdAt || Date.now(),
        featured: !!val.featured
      }));

      // Sort newest first
      list.sort((a, b) => b.createdAt - a.createdAt);

      localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
      callback(list);
    } catch (e: any) {
      console.warn('Error parsing projects from RTDB:', e);
      if (onError) onError(e);
    }
  }, (error) => {
    console.warn('RTDB onValue error for projects:', error);
    // Try cached version
    const cached = localStorage.getItem(PROJECTS_KEY);
    if (cached) {
      try {
        callback(JSON.parse(cached));
      } catch {
        callback([]);
      }
    } else {
      callback([]);
    }
    if (onError) onError(error);
  });

  return () => unsubscribe();
}

/**
 * Save new project to Firebase
 */
export async function createProject(project: Omit<ProjectItem, 'id'>): Promise<string> {
  const projectsRef = ref(db, 'projects');
  const newRef = push(projectsRef);
  const id = newRef.key;
  if (!id) throw new Error('Failed to generate project key');

  const payload = {
    ...project,
    createdAt: project.createdAt || Date.now()
  };

  await set(newRef, payload);
  return id;
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, updates: Partial<ProjectItem>): Promise<void> {
  const projectRef = ref(db, `projects/${id}`);
  await update(projectRef, updates);
}

/**
 * Delete a project from Firebase
 */
export async function deleteProject(id: string): Promise<void> {
  const projectRef = ref(db, `projects/${id}`);
  await remove(projectRef);
}

/**
 * Subscribe to Real-time Site Settings
 */
export function subscribeToSiteSettings(
  callback: (settings: SiteSettings) => void
): () => void {
  const settingsRef = ref(db, 'site_settings');

  const unsubscribe = onValue(settingsRef, (snapshot) => {
    try {
      const val = snapshot.val();
      if (val) {
        const merged: SiteSettings = {
          ...defaultSettings,
          ...val,
          role2: (!val.role2 || val.role2 === 'Editor') ? 'Freelance Editor' : val.role2,
          skillsWeb: Array.isArray(val.skillsWeb) ? val.skillsWeb : defaultSettings.skillsWeb,
          skillsEdit: Array.isArray(val.skillsEdit) ? val.skillsEdit : defaultSettings.skillsEdit
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        callback(merged);
      } else {
        // First time or empty
        const cached = localStorage.getItem(SETTINGS_KEY);
        if (cached) {
          try {
            callback({ ...defaultSettings, ...JSON.parse(cached) });
            return;
          } catch {
            // ignore
          }
        }
        callback(defaultSettings);
      }
    } catch (e) {
      console.warn('Error reading settings snapshot:', e);
      callback(defaultSettings);
    }
  }, (err) => {
    console.warn('RTDB settings listener warning:', err);
    const cached = localStorage.getItem(SETTINGS_KEY);
    if (cached) {
      try {
        callback({ ...defaultSettings, ...JSON.parse(cached) });
        return;
      } catch {
        // ignore
      }
    }
    callback(defaultSettings);
  });

  return () => unsubscribe();
}

/**
 * Save site settings to Firebase
 */
export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const settingsRef = ref(db, 'site_settings');
  await update(settingsRef, settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings, ...settings }));
}

const INQUIRIES_KEY = 'sarathi_inquiries_cache';

/**
 * Save new inquiry (Contact submission)
 */
export async function createInquiry(inquiry: Omit<InquiryItem, 'id'>): Promise<string> {
  const inqRef = ref(db, 'inquiries');
  const newRef = push(inqRef);
  const id = newRef.key || `inq_${Date.now()}`;

  const payload: InquiryItem = {
    ...inquiry,
    id,
    createdAt: inquiry.createdAt || Date.now(),
    read: false
  };

  try {
    await set(newRef, payload);
  } catch (err) {
    console.warn('Firebase RTDB save inquiry error, falling back to localStorage:', err);
  }

  // Update local cache
  try {
    const cached = localStorage.getItem(INQUIRIES_KEY);
    const list: InquiryItem[] = cached ? JSON.parse(cached) : [];
    list.unshift(payload);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  return id;
}

/**
 * Subscribe to Real-time Inquiries
 */
export function subscribeToInquiries(
  callback: (inquiries: InquiryItem[]) => void
): () => void {
  const inqRef = ref(db, 'inquiries');

  const unsubscribe = onValue(inqRef, (snapshot) => {
    try {
      const data = snapshot.val();
      if (!data) {
        // Check local cache
        const cached = localStorage.getItem(INQUIRIES_KEY);
        if (cached) {
          callback(JSON.parse(cached));
        } else {
          callback([]);
        }
        return;
      }

      const list: InquiryItem[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        name: val.name || 'Anonymous',
        subject: val.subject || 'No Subject',
        message: val.message || '',
        method: val.method || 'web',
        createdAt: val.createdAt || Date.now(),
        read: !!val.read
      }));

      // Sort newest first
      list.sort((a, b) => b.createdAt - a.createdAt);

      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(list));
      callback(list);
    } catch (e) {
      console.warn('Error reading inquiries snapshot:', e);
      const cached = localStorage.getItem(INQUIRIES_KEY);
      if (cached) {
        try {
          callback(JSON.parse(cached));
          return;
        } catch {
          // ignore
        }
      }
      callback([]);
    }
  }, (err) => {
    console.warn('RTDB inquiries listener warning:', err);
    const cached = localStorage.getItem(INQUIRIES_KEY);
    if (cached) {
      try {
        callback(JSON.parse(cached));
        return;
      } catch {
        // ignore
      }
    }
    callback([]);
  });

  return () => unsubscribe();
}

/**
 * Delete inquiry
 */
export async function deleteInquiry(id: string): Promise<void> {
  try {
    const itemRef = ref(db, `inquiries/${id}`);
    await remove(itemRef);
  } catch (err) {
    console.warn('Firebase RTDB delete inquiry error:', err);
  }

  // Update local cache
  try {
    const cached = localStorage.getItem(INQUIRIES_KEY);
    if (cached) {
      const list: InquiryItem[] = JSON.parse(cached);
      const updated = list.filter(item => item.id !== id);
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

/**
 * Mark inquiry as read/unread
 */
export async function markInquiryRead(id: string, read: boolean): Promise<void> {
  try {
    const itemRef = ref(db, `inquiries/${id}`);
    await update(itemRef, { read });
  } catch (err) {
    console.warn('Firebase RTDB mark inquiry read error:', err);
  }

  // Update local cache
  try {
    const cached = localStorage.getItem(INQUIRIES_KEY);
    if (cached) {
      const list: InquiryItem[] = JSON.parse(cached);
      const updated = list.map(item => item.id === id ? { ...item, read } : item);
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}
