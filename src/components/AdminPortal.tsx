import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Edit3, 
  UploadCloud, 
  Settings2, 
  Trash2, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Image as ImageIcon, 
  Palette, 
  Layers, 
  Code2, 
  Film, 
  RefreshCw,
  LogOut,
  Save,
  Sliders,
  AlignLeft,
  AlignCenter,
  MessageSquare,
  Mail,
  Search,
  Crop,
  CheckCircle2,
  Clock,
  Send,
  Home,
  Briefcase,
  User,
  PhoneCall,
  Sparkles,
  Eye,
  Globe,
  Share2
} from 'lucide-react';
import { ProjectCategory, ProjectItem, SiteSettings, InquiryItem } from '../types';
import { getCardShareUrl } from '../utils/share';
import { 
  createProject, 
  updateProject, 
  deleteProject, 
  saveSiteSettings,
  defaultSettings,
  subscribeToInquiries,
  deleteInquiry,
  markInquiryRead
} from '../services/firebase';
import ImageAdjustModal from './ImageAdjustModal';
import ImgbbUploader from './ImgbbUploader';

interface AdminPortalProps {
  projects: ProjectItem[];
  settings: SiteSettings;
  onExitAdmin: () => void;
}

export default function AdminPortal({
  projects,
  settings,
  onExitAdmin,
}: AdminPortalProps) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sarathi_admin_auth') === 'true';
  });

  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'upload' | 'manage' | 'inquiries'>('edit');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Section 4: Inquiries state
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Interactive Image Adjust Modal state
  const [adjustModalState, setAdjustModalState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    defaultAspectRatio: '1:1' | '16:9' | '4:3' | 'free';
    onSave: (url: string) => void;
  }>({
    isOpen: false,
    imageUrl: '',
    title: 'Adjust Image',
    defaultAspectRatio: '16:9',
    onSave: () => {}
  });

  // Section 1: Edit Site Settings form state
  const [selectedEditPage, setSelectedEditPage] = useState<'home' | 'works' | 'about' | 'contact' | 'global'>('home');
  const [formDataSettings, setFormDataSettings] = useState<SiteSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync settings when updated from Firebase
  useEffect(() => {
    setFormDataSettings(settings);
  }, [settings]);

  // Subscribe to real-time inquiries when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = subscribeToInquiries((list) => {
      setInquiries(list);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Section 2: Upload Card form state
  const [uploadCategory, setUploadCategory] = useState<ProjectCategory>('web');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [uploadImages, setUploadImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Section 3: Manage Cards state
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [manageFilter, setManageFilter] = useState<'all' | ProjectCategory>('all');
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const adjustUploadFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Login handler
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // Validate credentials: email: admin@skedz, pass: admin67
    if (inputEmail.trim() === 'admin@skedz' && inputPassword === 'admin67') {
      setIsAuthenticated(true);
      sessionStorage.setItem('sarathi_admin_auth', 'true');
      setLoginError(false);
      showToast('Admin access granted.');
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sarathi_admin_auth');
    setInputPassword('');
    onExitAdmin();
  };

  // Convert uploaded image file to Data URL
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Url = event.target.result as string;
          setUploadImages((prev) => [...prev, base64Url]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Avatar file upload handler with direct crop & adjust support
  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        // Open interactive adjuster
        setAdjustModalState({
          isOpen: true,
          imageUrl: base64Url,
          title: 'Crop & Adjust Profile Avatar (1:1 Square)',
          defaultAspectRatio: '1:1',
          onSave: (adjustedUrl) => {
            setFormDataSettings((prev) => ({ ...prev, avatarUrl: adjustedUrl }));
            showToast('Avatar updated! Remember to click "Save All Settings".');
          }
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenAvatarAdjust = () => {
    const currentUrl = formDataSettings.avatarUrl || '/myimg.jpeg';
    setAdjustModalState({
      isOpen: true,
      imageUrl: currentUrl,
      title: 'Adjust Current Profile Avatar (1:1 Square)',
      defaultAspectRatio: '1:1',
      onSave: (adjustedUrl) => {
        setFormDataSettings((prev) => ({ ...prev, avatarUrl: adjustedUrl }));
        showToast('Avatar updated! Remember to click "Save All Settings".');
      }
    });
  };

  // Upload local file and open adjuster for project cards
  const handleUploadAndAdjustFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        setAdjustModalState({
          isOpen: true,
          imageUrl: base64Url,
          title: 'Crop & Adjust Project Card Image',
          defaultAspectRatio: '16:9',
          onSave: (adjustedUrl) => {
            setUploadImages((prev) => [...prev, adjustedUrl]);
            showToast('Adjusted image added to project card!');
          }
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Adjust an already added image in the project form
  const handleAdjustExistingUploadImage = (index: number) => {
    const currentImg = uploadImages[index];
    if (!currentImg) return;

    setAdjustModalState({
      isOpen: true,
      imageUrl: currentImg,
      title: `Adjust Image #${index + 1}`,
      defaultAspectRatio: '16:9',
      onSave: (adjustedUrl) => {
        setUploadImages((prev) => prev.map((img, i) => i === index ? adjustedUrl : img));
        showToast('Image adjustments applied!');
      }
    });
  };

  // Inquiry actions
  const handleDeleteInquiry = async (id: string) => {
    try {
      await deleteInquiry(id);
      showToast('Inquiry removed from list.');
    } catch (err: any) {
      showToast('Error deleting inquiry: ' + (err.message || 'Unknown error'));
    }
  };

  const handleToggleInquiryRead = async (id: string, currentRead?: boolean) => {
    try {
      await markInquiryRead(id, !currentRead);
      showToast(!currentRead ? 'Marked as read' : 'Marked as unread');
    } catch (err: any) {
      showToast('Error updating inquiry: ' + (err.message || 'Unknown error'));
    }
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setUploadImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const removeUploadImage = (idx: number) => {
    setUploadImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save Site Customization
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await saveSiteSettings(formDataSettings);
      showToast('Live site settings updated successfully in Firebase!');
    } catch (err: any) {
      console.error(err);
      showToast('Error saving settings to Firebase: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Upload Project Card
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast('Please enter a project title.');
      return;
    }

    setIsUploading(true);
    try {
      const tagsArray = uploadTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await createProject({
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        category: uploadCategory,
        images: uploadImages,
        link: uploadLink.trim() || '#',
        tags: tagsArray,
        createdAt: Date.now(),
        featured: uploadFeatured,
      });

      // Reset form
      setUploadTitle('');
      setUploadDescription('');
      setUploadTags('');
      setUploadLink('');
      setUploadImages([]);
      setUploadFeatured(false);

      showToast('Project card uploaded successfully to Firebase!');
      setActiveTab('manage');
    } catch (err: any) {
      console.error(err);
      showToast('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  // Save Card Edits
  const handleUpdateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsUpdatingCard(true);
    try {
      await updateProject(editingProject.id, {
        title: editingProject.title,
        description: editingProject.description,
        category: editingProject.category,
        link: editingProject.link,
        images: editingProject.images,
        tags: editingProject.tags,
        featured: editingProject.featured,
      });
      showToast('Project card updated successfully!');
      setEditingProject(null);
    } catch (err: any) {
      console.error(err);
      showToast('Update failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdatingCard(false);
    }
  };

  // Delete Card
  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      showToast('Card deleted from Firebase.');
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete card.');
    }
  };

  // ================= LOGIN SCREEN =================
  if (!isAuthenticated) {
    return (
      <div
        id="admin-login-screen"
        className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-7 rounded-2xl bg-white border border-slate-200 shadow-xl relative overflow-hidden"
        >
          {/* Top subtle bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-heading text-slate-900">
              Private Admin Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Authorized credentials required to proceed.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Identifier
              </label>
              <input
                id="admin-input-identifier"
                type="text"
                required
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Enter admin ID"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-sky-500 shadow-xs transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Passcode
              </label>
              <input
                id="admin-input-passcode"
                type="password"
                required
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-sky-500 shadow-xs transition-colors"
              />
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Invalid credentials. Access denied.</span>
              </motion.div>
            )}

            <button
              type="submit"
              id="btn-admin-submit-login"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              Authenticate & Enter
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={onExitAdmin}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Return to public portfolio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ================= AUTHENTICATED ADMIN DASHBOARD =================
  return (
    <div id="admin-portal-root" className="min-h-screen bg-[#070b14] text-slate-100 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-sky-500/50 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 backdrop-blur-xl"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-heading">
                Admin Portal
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-semibold">Firebase RTDB Live</span>
                <span>•</span>
                <span>skedz-496712</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              id="btn-admin-open-edit-studio"
              onClick={() =>
                setAdjustModalState({
                  isOpen: true,
                  imageUrl: formDataSettings.avatarUrl || 'https://i.ibb.co/MyQn2Mnh/myimg.jpg',
                  title: 'Creative Edit Studio (Photo & Video App)',
                  defaultAspectRatio: '16:9',
                  onSave: (url) => setFormDataSettings((prev) => ({ ...prev, avatarUrl: url }))
                })
              }
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
              title="Launch the creative photo & video editing suite"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Open Edit App</span>
            </button>
            <button
              id="btn-admin-preview-site"
              onClick={onExitAdmin}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Site</span>
            </button>
            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 3 Main Admin Section Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mb-8 overflow-x-auto">
          {/* Section One: Edit */}
          <button
            id="tab-admin-edit"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'edit'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Section 1: Edit Site</span>
          </button>

          {/* Section Two: Upload */}
          <button
            id="tab-admin-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Section 2: Upload Card</span>
          </button>

          {/* Section Three: Manage */}
          <button
            id="tab-admin-manage"
            onClick={() => setActiveTab('manage')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manage'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Section 3: Manage Cards ({projects.length})</span>
          </button>

          {/* Section Four: Inquiries */}
          <button
            id="tab-admin-inquiries"
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
              activeTab === 'inquiries'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Section 4: Inquiries</span>
            {inquiries.length > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'inquiries'
                    ? 'bg-slate-950 text-white'
                    : 'bg-sky-500 text-slate-950'
                }`}
              >
                {inquiries.length}
              </span>
            )}
          </button>
        </div>

        {/* ================= SECTION 1: EDIT (PAGE-BY-PAGE SITE CUSTOMIZER) ================= */}
        {activeTab === 'edit' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Page Selection Bar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    Live Page Customizer & Database Sync
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white font-heading mt-0.5">
                  Select a Page to Edit
                </h2>
                <p className="text-xs text-slate-400">
                  Select any page below to customize its text, images, and colors with live Firebase persistence.
                </p>
              </div>

              {/* Page Selection Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'home', label: 'Home Page', icon: Home },
                  { id: 'works', label: 'Works Page', icon: Briefcase },
                  { id: 'about', label: 'About Page', icon: User },
                  { id: 'contact', label: 'Contact Page', icon: PhoneCall },
                  { id: 'global', label: 'Colors & Theme', icon: Palette },
                ].map((page) => {
                  const Icon = page.icon;
                  const isActive = selectedEditPage === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setSelectedEditPage(page.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                          : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{page.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* ================= PAGE: HOME ================= */}
              {selectedEditPage === 'home' && (
                <div className="space-y-6">
                  {/* Home Content & Role Texts */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                          <Home className="w-4 h-4 text-sky-400" />
                          <span>Home Page Text & Hero Content</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Configure the brand name, animated roles, and experience summaries.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingSettings ? 'Saving...' : 'Save Page'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Name / Brand Title (Navbar & Hero)
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.name}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Greeting Eyebrow / Tagline
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.tagline}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, tagline: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Role 1 Title (Animates after "I am a")
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.role1}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, role1: e.target.value })}
                          placeholder="e.g. Web Developer"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Role 2 Title (Animates after "I am a")
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.role2}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, role2: e.target.value })}
                          placeholder="e.g. Freelance Editor"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Web Developer Experience (Years)
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.webExperienceYears}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, webExperienceYears: e.target.value })}
                          placeholder="e.g. 3+ Years"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Freelance Editor Experience (Years)
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.editorExperienceYears}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, editorExperienceYears: e.target.value })}
                          placeholder="e.g. 4+ Years"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Web Experience Highlight Description
                        </label>
                        <textarea
                          rows={2}
                          value={formDataSettings.webExperienceDesc}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, webExperienceDesc: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Editor Experience Highlight Description
                        </label>
                        <textarea
                          rows={2}
                          value={formDataSettings.editorExperienceDesc}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, editorExperienceDesc: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Home Image & Media Customization */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                    <h3 className="text-base font-bold text-white font-heading mb-4 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>Home Page Center Avatar Image</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                      {/* Avatar preview frame */}
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-sky-400 to-purple-500 shadow-xl shrink-0">
                        <img
                          src={formDataSettings.avatarUrl || 'https://i.ibb.co/MyQn2Mnh/myimg.jpg'}
                          alt="Avatar preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://i.ibb.co/MyQn2Mnh/myimg.jpg';
                          }}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>

                      <div className="flex-1 w-full space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Image URL or CDN Link
                          </label>
                          <input
                            type="text"
                            value={formDataSettings.avatarUrl}
                            onChange={(e) => setFormDataSettings({ ...formDataSettings, avatarUrl: e.target.value })}
                            placeholder="Paste image URL (e.g. https://i.ibb.co/MyQn2Mnh/myimg.jpg)"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-sky-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <ImgbbUploader
                            compact
                            buttonText="Upload Avatar to ImgBB"
                            onUploadSuccess={(url) => {
                              setFormDataSettings((prev) => ({ ...prev, avatarUrl: url }));
                              showToast('Avatar uploaded to ImgBB CDN! Click "Save All Settings".');
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => avatarFileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Local Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenAvatarAdjust}
                            className="px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-xs font-semibold text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop & Adjust Avatar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormDataSettings({ ...formDataSettings, avatarUrl: 'https://i.ibb.co/MyQn2Mnh/myimg.jpg' })}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 transition-colors"
                          >
                            Reset to Default URL
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Clicking this avatar on the live home page takes visitors to your Instagram profile (@skedz.dev).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PAGE: WORKS ================= */}
              {selectedEditPage === 'works' && (
                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-sky-400" />
                          <span>Works Page Content & Showcase Cards</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Currently showing {projects.length} portfolio project cards in database.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload New Project Card</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                        <span className="text-xs text-slate-400">Total Projects</span>
                        <div className="text-2xl font-black text-white font-heading mt-1">{projects.length}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                        <span className="text-xs text-sky-400">Web Development Cards</span>
                        <div className="text-2xl font-black text-sky-400 font-heading mt-1">
                          {projects.filter((p) => p.category === 'web').length}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                        <span className="text-xs text-purple-400">Video Editing Cards</span>
                        <div className="text-2xl font-black text-purple-400 font-heading mt-1">
                          {projects.filter((p) => p.category === 'edit').length}
                        </div>
                      </div>
                    </div>

                    {/* Quick project image adjust shortcuts */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Project Cards Quick Image Adjust
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projects.slice(0, 6).map((proj) => (
                          <div
                            key={proj.id}
                            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                              {proj.images?.[0] ? (
                                <img
                                  src={proj.images[0]}
                                  alt={proj.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">{proj.title}</h5>
                              <span className="text-[10px] text-slate-400 capitalize">{proj.category} Development</span>
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (proj.images?.[0]) {
                                      setAdjustModalState({
                                        isOpen: true,
                                        imageUrl: proj.images[0],
                                        title: `Adjust: ${proj.title}`,
                                        defaultAspectRatio: '16:9',
                                        onSave: async (adjusted) => {
                                          const newImages = [...(proj.images || [])];
                                          newImages[0] = adjusted;
                                          await updateProject(proj.id, { images: newImages });
                                          showToast(`Updated image for ${proj.title}`);
                                        }
                                      });
                                    }
                                  }}
                                  className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <Crop className="w-3 h-3" />
                                  <span>Adjust Image</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Want to edit descriptions, tags or links?</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manage')}
                          className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <span>Go to Manage Cards Tab</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PAGE: ABOUT ================= */}
              {selectedEditPage === 'about' && (
                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                          <User className="w-4 h-4 text-sky-400" />
                          <span>About Page Texts & Philosophy</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Edit your bio story, development philosophies, and skill tags.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingSettings ? 'Saving...' : 'Save Page'}</span>
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Full Biography Story
                        </label>
                        <textarea
                          rows={4}
                          value={formDataSettings.aboutBio}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, aboutBio: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Web Development Philosophy
                          </label>
                          <textarea
                            rows={3}
                            value={formDataSettings.aboutPhilosophyWeb}
                            onChange={(e) => setFormDataSettings({ ...formDataSettings, aboutPhilosophyWeb: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Video Editing Philosophy
                          </label>
                          <textarea
                            rows={3}
                            value={formDataSettings.aboutPhilosophyEdit}
                            onChange={(e) => setFormDataSettings({ ...formDataSettings, aboutPhilosophyEdit: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* About Avatar Image Control */}
                      <div className="pt-4 border-t border-slate-800/80">
                        <label className="block text-xs font-semibold text-slate-300 mb-3">
                          About Page Avatar Picture
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                            <img
                              src={formDataSettings.avatarUrl || 'https://i.ibb.co/MyQn2Mnh/myimg.jpg'}
                              alt="About preview"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://i.ibb.co/MyQn2Mnh/myimg.jpg';
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 w-full space-y-2">
                            <input
                              type="text"
                              value={formDataSettings.avatarUrl}
                              onChange={(e) => setFormDataSettings({ ...formDataSettings, avatarUrl: e.target.value })}
                              placeholder="Image URL"
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-sky-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleOpenAvatarAdjust}
                                className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs text-sky-400 hover:bg-sky-500/20 transition-colors"
                              >
                                Crop / Adjust Avatar
                              </button>
                              <span className="text-[11px] text-slate-500">
                                Clicking avatar in About page links to Instagram @skedz.dev
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PAGE: CONTACT ================= */}
              {selectedEditPage === 'contact' && (
                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-sky-400" />
                          <span>Contact Channels & Details</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Set your direct contact info used by email, call, and WhatsApp action modals.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingSettings ? 'Saving...' : 'Save Page'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Direct Contact Email
                        </label>
                        <input
                          type="email"
                          value={formDataSettings.email}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Phone Number (Phone Calls & WhatsApp)
                        </label>
                        <input
                          type="text"
                          value={formDataSettings.phone}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, phone: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Default WhatsApp Greeting Template
                        </label>
                        <textarea
                          rows={2}
                          value={formDataSettings.whatsappMessage}
                          onChange={(e) => setFormDataSettings({ ...formDataSettings, whatsappMessage: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                            <ExternalLink className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">Instagram Profile Link</span>
                            <p className="text-[11px] text-slate-400">https://instagram.com/skedz.dev</p>
                          </div>
                        </div>
                        <a
                          href="https://instagram.com/skedz.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 text-xs font-bold transition-colors"
                        >
                          Visit Instagram ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PAGE: GLOBAL & COLORS ================= */}
              {selectedEditPage === 'global' && (
                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                          <Palette className="w-4 h-4 text-purple-400" />
                          <span>Global Color Palette & Aesthetic Theme</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Change color accents, background atmosphere, and text alignment globally.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingSettings ? 'Saving...' : 'Save Theme'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Primary Accent Preset */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Primary Accent Color
                        </label>
                        <div className="flex items-center gap-2 mb-3">
                          {[
                            { name: 'Sky Cyan', hex: '#38bdf8' },
                            { name: 'Violet', hex: '#c084fc' },
                            { name: 'Emerald', hex: '#10b981' },
                            { name: 'Sunset', hex: '#f97316' },
                            { name: 'Rose', hex: '#f43f5e' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setFormDataSettings({ ...formDataSettings, accentColor: c.hex })}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                formDataSettings.accentColor === c.hex
                                  ? 'ring-2 ring-white scale-110'
                                  : 'opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            >
                              {formDataSettings.accentColor === c.hex && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Custom Hex:</span>
                          <input
                            type="color"
                            value={formDataSettings.accentColor || '#38bdf8'}
                            onChange={(e) => setFormDataSettings({ ...formDataSettings, accentColor: e.target.value })}
                            className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="text-xs font-mono text-slate-300">{formDataSettings.accentColor}</span>
                        </div>
                      </div>

                      {/* Secondary Accent Preset */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Secondary Role Accent Color
                        </label>
                        <div className="flex items-center gap-2 mb-3">
                          {[
                            { name: 'Violet', hex: '#c084fc' },
                            { name: 'Sky Cyan', hex: '#38bdf8' },
                            { name: 'Rose Pink', hex: '#f43f5e' },
                            { name: 'Amber', hex: '#f59e0b' },
                            { name: 'Teal', hex: '#14b8a6' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setFormDataSettings({ ...formDataSettings, secondaryAccent: c.hex })}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                formDataSettings.secondaryAccent === c.hex
                                  ? 'ring-2 ring-white scale-110'
                                  : 'opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            >
                              {formDataSettings.secondaryAccent === c.hex && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Custom Hex:</span>
                          <input
                            type="color"
                            value={formDataSettings.secondaryAccent || '#c084fc'}
                            onChange={(e) => setFormDataSettings({ ...formDataSettings, secondaryAccent: e.target.value })}
                            className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="text-xs font-mono text-slate-300">{formDataSettings.secondaryAccent}</span>
                        </div>
                      </div>

                      {/* Text Alignment */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Hero Heading Alignment
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormDataSettings({ ...formDataSettings, textAlign: 'center' })}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              formDataSettings.textAlign === 'center'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <AlignCenter className="w-4 h-4" />
                            <span>Centered</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormDataSettings({ ...formDataSettings, textAlign: 'left' })}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              formDataSettings.textAlign === 'left'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <AlignLeft className="w-4 h-4" />
                            <span>Left Aligned</span>
                          </button>
                        </div>
                      </div>

                      {/* Background Theme */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Background Atmosphere
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'dark-slate', label: 'Dark Slate' },
                            { id: 'midnight', label: 'Midnight Ink' },
                            { id: 'cyber-noir', label: 'Cyber Noir' },
                            { id: 'deep-emerald', label: 'Deep Emerald' },
                          ].map((thm) => (
                            <button
                              key={thm.id}
                              type="button"
                              onClick={() => setFormDataSettings({ ...formDataSettings, backgroundTheme: thm.id as any })}
                              className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                                formDataSettings.backgroundTheme === thm.id
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {thm.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sticky Real-Time Database Save Bar */}
              <div className="sticky bottom-4 z-20 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/95 backdrop-blur-md border border-sky-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">
                        Connected to Firebase Realtime Database
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Changes saved here update instantly for all visitors worldwide in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving Changes to Firebase...' : 'Save All Changes to Database'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* ================= SECTION 2: UPLOAD (PROJECT CARD CREATION) ================= */}
        {activeTab === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800"
          >
            <div className="mb-6 pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-sky-400" />
                <span>Upload New Project Card</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload cards with multiple images, categorization (Web vs Edit), and a clickable external link.
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              {/* Category selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Project Category
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setUploadCategory('web')}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                      uploadCategory === 'web'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md shadow-sky-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Web Development</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadCategory('edit')}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                      uploadCategory === 'edit'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video Editing</span>
                  </button>
                </div>
              </div>

              {/* Title & Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NextGen SaaS Dashboard or Cinematic Brand Reel"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Action Link * (Opens on click)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com or https://youtube.com/watch?v=..."
                    value={uploadLink}
                    onChange={(e) => setUploadLink(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key features, creative direction, editing techniques, or tech architecture..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Technologies / Tools (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Tailwind OR Premiere Pro, Color Grading, 4K"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Multiple Images Upload Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Project Images (Multiple images supported)
                </label>

                {/* ImgBB Direct Cloud Upload */}
                <div className="mb-4">
                  <ImgbbUploader
                    label="Upload Project Images to ImgBB (Direct Cloud CDN)"
                    buttonText="Upload Images to ImgBB"
                    multiple={true}
                    onUploadSuccess={(url) => {
                      setUploadImages((prev) => [...prev, url]);
                      showToast('Image uploaded to ImgBB and added to card!');
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustUploadFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Upload & Adjust</span>
                  </button>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={adjustUploadFileInputRef}
                    onChange={handleUploadAndAdjustFile}
                    className="hidden"
                  />
                </div>

                {/* Image Previews */}
                {uploadImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {uploadImages.map((img, i) => (
                      <div
                        key={i}
                        className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800"
                      >
                        <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleAdjustExistingUploadImage(i)}
                            title="Crop & Adjust image"
                            className="p-1 rounded-full bg-slate-900/90 hover:bg-sky-600 text-white transition-colors"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUploadImage(i)}
                            title="Delete image"
                            className="p-1 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No images added yet. Add image URLs or upload local images to showcase in the card's carousel.
                  </div>
                )}
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={uploadFeatured}
                  onChange={(e) => setUploadFeatured(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="featured-checkbox" className="text-xs text-slate-300 cursor-pointer">
                  Mark as Featured Project
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploading ? 'Publishing to Firebase...' : 'Publish Project Card'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ================= SECTION 3: MANAGE CARDS ================= */}
        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <span>Manage Active Cards ({projects.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Edit descriptions, links, and remove cards directly from Firebase.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManageFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    manageFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({projects.length})
                </button>
                <button
                  onClick={() => setManageFilter('web')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    manageFilter === 'web'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Web ({projects.filter((p) => p.category === 'web').length})
                </button>
                <button
                  onClick={() => setManageFilter('edit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    manageFilter === 'edit'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Edit ({projects.filter((p) => p.category === 'edit').length})
                </button>
              </div>
            </div>

            {/* List of projects */}
            {projects.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  No Project Cards in Firebase
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Upload your first card using the "Section 2: Upload Card" tab above.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold"
                >
                  Go to Upload
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects
                  .filter((p) => manageFilter === 'all' || p.category === manageFilter)
                  .map((project) => (
                    <div
                      key={project.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-full sm:w-24 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
                        {project.images && project.images.length > 0 ? (
                          <img
                            src={project.images[0]}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                            {project.category === 'web' ? <Code2 className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                          </div>
                        )}
                        <span
                          className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            project.category === 'web'
                              ? 'bg-sky-500 text-slate-950'
                              : 'bg-purple-500 text-slate-950'
                          }`}
                        >
                          {project.category}
                        </span>
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {project.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {project.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                          <span>{project.images?.length || 0} images</span>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:underline flex items-center gap-1"
                            >
                              <span>Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            const url = getCardShareUrl(project.id);
                            navigator.clipboard.writeText(url);
                            showToast(`Share link copied for "${project.title}"! Anyone with this link opens this card.`);
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition-colors"
                          title="Copy Direct Card Share Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProject(project)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Card"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(project.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ================= SECTION 4: INQUIRIES ================= */}
        {activeTab === 'inquiries' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header / Summary Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-sky-400" />
                    <span>Quick Inquiries & Client Leads</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Messages dispatched from your portfolio's "Send a Quick Inquiry" form in real time.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Total: {inquiries.length}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>New: {inquiries.filter((i) => !i.read).length}</span>
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by client name, subject, or message text..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  {inquirySearch && (
                    <button
                      onClick={() => setInquirySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
                  {(['all', 'unread', 'read'] as const).map((filterVal) => {
                    const count =
                      filterVal === 'all'
                        ? inquiries.length
                        : filterVal === 'unread'
                        ? inquiries.filter((i) => !i.read).length
                        : inquiries.filter((i) => i.read).length;

                    return (
                      <button
                        key={filterVal}
                        onClick={() => setInquiryFilter(filterVal)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          inquiryFilter === filterVal
                            ? 'bg-sky-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {filterVal} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inquiries List */}
            {inquiries.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No Inquiries Received Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When visitors submit inquiries via the "Send a Quick Inquiry" section on your Contact page, their message, name, and channel preference will arrive here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries
                  .filter((item) => {
                    const q = inquirySearch.toLowerCase();
                    const matchesSearch =
                      item.name.toLowerCase().includes(q) ||
                      item.subject.toLowerCase().includes(q) ||
                      item.message.toLowerCase().includes(q);
                    if (!matchesSearch) return false;
                    if (inquiryFilter === 'unread') return !item.read;
                    if (inquiryFilter === 'read') return item.read;
                    return true;
                  })
                  .map((item) => {
                    const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const replyEmailUrl = `mailto:${encodeURIComponent(settings.email || 'sarathik354@gmail.com')}?subject=${encodeURIComponent(
                      'Re: ' + item.subject
                    )}&body=${encodeURIComponent(
                      `Hi ${item.name},\n\nThank you for reaching out through my portfolio!\n\nRegarding your inquiry:\n"${item.message}"\n\n`
                    )}`;

                    const rawWaDigits = (settings.phone || '9345306572').replace(/\D/g, '');
                    const waNum = rawWaDigits.length === 10 ? `91${rawWaDigits}` : rawWaDigits;
                    const replyWaUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(
                      `Hi ${item.name}, thank you for reaching out regarding "${item.subject}". Let's discuss!`
                    )}`;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                          !item.read
                            ? 'bg-slate-900 border-sky-500/40 shadow-lg shadow-sky-500/5'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase shadow-xs">
                              {item.name ? item.name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">
                                  {item.name || 'Anonymous Visitor'}
                                </h3>
                                {!item.read && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 font-extrabold text-[10px] animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                                item.method === 'whatsapp'
                                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                  : 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                              }`}
                            >
                              {item.method === 'whatsapp' ? (
                                <>
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3 h-3" />
                                  <span>Email</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="mb-2.5">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                            Subject
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100">
                            {item.subject || 'Project Inquiry'}
                          </h4>
                        </div>

                        {/* Message body */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans mb-4 whitespace-pre-wrap">
                          {item.message || '(No detailed message provided)'}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                          <div className="flex items-center gap-2">
                            {item.method === 'whatsapp' ? (
                              <a
                                href={replyWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Reply on WhatsApp</span>
                              </a>
                            ) : (
                              <a
                                href={replyEmailUrl}
                                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Reply via Mail</span>
                              </a>
                            )}

                            <button
                              onClick={() => handleToggleInquiryRead(item.id, item.read)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{item.read ? 'Mark Unread' : 'Mark as Read'}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteInquiry(item.id)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Edit Project Card Modal */}
      <AnimatePresence>
        {editingProject && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setEditingProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-lg font-bold font-heading">
                  Edit Project Card
                </h3>
                <button
                  onClick={() => setEditingProject(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingProject.category}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        category: e.target.value as ProjectCategory,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  >
                    <option value="web">Web Development</option>
                    <option value="edit">Video Editing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Link
                  </label>
                  <input
                    type="url"
                    value={editingProject.link}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, link: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingProject.tags.join(', ')}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                {/* Card Images Management with ImgBB */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Card Images ({editingProject.images?.length || 0})
                    </label>
                    <ImgbbUploader
                      compact
                      buttonText="Upload to ImgBB"
                      multiple={true}
                      onUploadSuccess={(url) => {
                        setEditingProject({
                          ...editingProject,
                          images: [...(editingProject.images || []), url],
                        });
                        showToast('New image added via ImgBB!');
                      }}
                    />
                  </div>

                  {editingProject.images && editingProject.images.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {editingProject.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800"
                        >
                          <img src={img} alt={`card-img-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProject({
                                ...editingProject,
                                images: editingProject.images.filter((_, i) => i !== idx),
                              });
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
                      No images for this project. Use the "Upload to ImgBB" button above to add media.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCard}
                    className="px-5 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold"
                  >
                    {isUpdatingCard ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center text-white"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold mb-2">Delete this project card?</h3>
              <p className="text-xs text-slate-400 mb-6">
                This action will immediately remove the project card from Firebase and the live site.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(deleteConfirmId)}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
                >
                  Delete Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Image Adjuster & Cropper Modal */}
      {adjustModalState.isOpen && (
        <ImageAdjustModal
          isOpen={adjustModalState.isOpen}
          imageUrl={adjustModalState.imageUrl}
          title={adjustModalState.title}
          defaultAspectRatio={adjustModalState.defaultAspectRatio}
          onClose={() => setAdjustModalState((prev) => ({ ...prev, isOpen: false }))}
          onSave={(adjustedUrl) => {
            adjustModalState.onSave(adjustedUrl);
            setAdjustModalState((prev) => ({ ...prev, isOpen: false }));
          }}
        />
      )}
    </div>
  );
}
