export type ProjectCategory = 'web' | 'edit';

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  images: string[];
  link: string;
  tags: string[];
  createdAt: number;
  featured?: boolean;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  role1: string;
  role2: string;
  webExperienceYears: string;
  webExperienceDesc: string;
  editorExperienceYears: string;
  editorExperienceDesc: string;
  aboutBio: string;
  aboutPhilosophyWeb: string;
  aboutPhilosophyEdit: string;
  skillsWeb: string[];
  skillsEdit: string[];
  email: string;
  phone: string;
  whatsappMessage: string;
  avatarUrl: string;
  accentColor: string;
  secondaryAccent: string;
  textAlign: 'center' | 'left';
  backgroundTheme: 'dark-slate' | 'midnight' | 'cyber-noir' | 'deep-emerald';
}

export type ActivePage = 'home' | 'works' | 'about' | 'contact' | 'admin';

export interface InquiryItem {
  id: string;
  name: string;
  subject: string;
  message: string;
  method?: 'email' | 'whatsapp' | 'web';
  createdAt: number;
  read?: boolean;
}
