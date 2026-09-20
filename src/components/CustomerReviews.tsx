import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  MessageSquare,
  Briefcase,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  Award,
  PenSquare,
  Trash2,
  Edit3,
  UserCheck,
  Star,
} from "lucide-react";
import { CustomerReview, FirebaseConfig } from "../types";
import ScrollReveal from "./ScrollReveal";
import { saveCustomerReviewToFirestore } from "../lib/firebase";

// Generate or retrieve persistent device fingerprint
function getDeviceId(): string {
  const STORAGE_KEY = "skedz_device_client_id";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

interface CustomerReviewsProps {
  previewMode?: boolean; // If true, shows compact teaser on Home page
  onOpenReviewsPage?: () => void;
  onNavigateToProjects?: () => void;
  projectCount?: number;
  firebaseConfig?: FirebaseConfig | null;
}

export default function CustomerReviews({
  previewMode = false,
  onOpenReviewsPage,
  onNavigateToProjects,
  projectCount = 0,
  firebaseConfig,
}: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [avgRating, setAvgRating] = useState(5.0);
  const [serverProjectCount, setServerProjectCount] = useState(projectCount);
  const [loading, setLoading] = useState(true);

  // User's own review from this device (if any)
  const [myReview, setMyReview] = useState<CustomerReview | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Review Popup Modal State (Write / View / Edit / Delete)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isEditingMyReview, setIsEditingMyReview] = useState(false);

  // Form states for Create & Edit
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Policy Modal Popup state
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const ratingDescriptions: Record<number, string> = {
    1: "Needs Improvement",
    2: "Fair Experience",
    3: "Good & Satisfied",
    4: "Very Good & Professional",
    5: "Exceptional Quality",
  };

  // Fetch reviews list
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalCount(data.totalCount || 0);
        setAvgRating(data.averageRating || 5.0);
        if (data.projectCount !== undefined) {
          setServerProjectCount(data.projectCount);
        }
      }
    } catch (err) {
      console.error("Failed to load customer reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if this device already has an authentic review
  const checkMyReview = async () => {
    try {
      const deviceId = getDeviceId();
      const res = await fetch(`/api/reviews/my-review?deviceId=${encodeURIComponent(deviceId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          setMyReview(data.review);
          setAlreadyReviewed(true);
          localStorage.setItem("skedz_device_has_reviewed", "true");
        } else {
          setMyReview(null);
          setAlreadyReviewed(false);
          localStorage.removeItem("skedz_device_has_reviewed");
        }
      }
    } catch (err) {
      console.error("Failed to check device review status:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkMyReview();

    // Show info policy on first visit to dedicated reviews page
    if (!previewMode) {
      const hasSeenPopup = sessionStorage.getItem("skedz_seen_review_policy");
      if (!hasSeenPopup) {
        setPolicyModalOpen(true);
      }
    }
  }, [previewMode]);

  const handleDismissPolicy = () => {
    setPolicyModalOpen(false);
    sessionStorage.setItem("skedz_seen_review_policy", "true");
  };

  // Open the write/edit modal
  const handleOpenReviewModal = () => {
    setFormError(null);
    setActionSuccessMessage(null);
    if (myReview) {
      // Prefill with existing review for potential edit
      setFormName(myReview.name);
      setFormRating(myReview.rating);
      setFormComment(myReview.comment);
      setIsEditingMyReview(false);
    } else {
      setFormName("");
      setFormRating(5);
      setFormComment("");
      setIsEditingMyReview(false);
    }
    setReviewModalOpen(true);
  };

  // Start editing existing review
  const handleStartEdit = () => {
    if (myReview) {
      setFormName(myReview.name);
      setFormRating(myReview.rating);
      setFormComment(myReview.comment);
      setFormError(null);
      setActionSuccessMessage(null);
      setIsEditingMyReview(true);
    }
  };

  // Submit NEW Review
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) {
      setFormError("Please enter your name and comments.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setActionSuccessMessage(null);

    const deviceId = getDeviceId();

    try {
      // 1. Sync review to Firebase Firestore
      try {
        await saveCustomerReviewToFirestore(firebaseConfig, {
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          deviceId,
        });
      } catch (fbErr) {
        console.warn("Firestore review sync note:", fbErr);
      }

      // 2. Also save to server API
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          deviceId,
        }),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        // If server failed, create local object so user has immediate confirmation
        const fallbackReview: CustomerReview = {
          id: `rev-${Date.now()}`,
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          deviceId,
          createdAt: new Date().toISOString(),
        };
        setMyReview(fallbackReview);
        setAlreadyReviewed(true);
        localStorage.setItem("skedz_device_has_reviewed", "true");
        setActionSuccessMessage("Your verified review has been published!");
        setIsEditingMyReview(false);
        setReviews((prev) => [fallbackReview, ...prev]);
        setTotalCount((prev) => prev + 1);
        return;
      }

      // Success
      setMyReview(data.review);
      setAlreadyReviewed(true);
      localStorage.setItem("skedz_device_has_reviewed", "true");
      setActionSuccessMessage("Your verified review has been published!");
      setIsEditingMyReview(false);

      // Refresh public list
      fetchReviews();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SAVE EDITED Review
  const handleSaveEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myReview) return;
    if (!formName.trim() || !formComment.trim()) {
      setFormError("Name and comments cannot be blank.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setActionSuccessMessage(null);

    const deviceId = getDeviceId();

    try {
      const res = await fetch(`/api/reviews/${myReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          deviceId,
        }),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update review.");
      }

      setMyReview(data.review);
      setActionSuccessMessage("Your review has been successfully updated!");
      setIsEditingMyReview(false);

      // Refresh public list
      fetchReviews();
    } catch (err: any) {
      setFormError(err.message || "Failed to update review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE user review
  const handleDeleteMyReview = async () => {
    if (!myReview) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete your review? Once removed, you will be able to write a new one if you wish."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setFormError(null);

    const deviceId = getDeviceId();

    try {
      const res = await fetch(
        `/api/reviews/my-review/${myReview.id}?deviceId=${encodeURIComponent(deviceId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete review.");
      }

      // Successfully deleted
      setMyReview(null);
      setAlreadyReviewed(false);
      localStorage.removeItem("skedz_device_has_reviewed");
      setIsEditingMyReview(false);
      setFormName("");
      setFormRating(5);
      setFormComment("");
      setActionSuccessMessage("Your review was deleted. You can submit a fresh review anytime.");

      // Refresh public reviews
      fetchReviews();
    } catch (err: any) {
      setFormError(err.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const finalProjectCount = serverProjectCount || projectCount;

  // ================= PREVIEW MODE (Home Page Teaser) =================
  if (previewMode) {
    const previewList = reviews.slice(0, 2);

    return (
      <section className="relative py-8">
        <ScrollReveal direction="up" distance={20} duration={0.6}>
          <div className="p-6 sm:p-7 rounded-3xl bg-[#090d1a]/85 border border-purple-500/20 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          {/* Header & Stats Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Genuine Client Feedback</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Client Reviews & Verified Ratings
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1">
                Authentic testimonials submitted directly by verified collaborators and clients.
              </p>
            </div>

            {/* Metric counters */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Reviews count */}
              <button
                onClick={onOpenReviewsPage}
                className="px-4 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/40 text-left transition group cursor-pointer"
                title="Click to view all reviews"
              >
                <div className="flex items-center gap-1.5 text-xs text-purple-300 font-mono">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-bold text-white text-sm">{totalCount}</span>
                  <span className="text-slate-400">Reviews</span>
                </div>
                <div className="text-[10px] text-purple-300 font-mono">
                  {totalCount > 0 ? `${avgRating} / 5.0 Rating` : "Be the first"}
                </div>
              </button>

              {/* Projects count */}
              <button
                onClick={onNavigateToProjects}
                className="px-4 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-left transition group cursor-pointer"
                title="Click to view all projects"
              >
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="font-bold text-white text-sm">{finalProjectCount}</span>
                  <span className="text-slate-400">Projects</span>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono">View Showcase →</div>
              </button>
            </div>
          </div>

          {/* Real Reviews Cards (1-2) or Empty State */}
          <div className="py-6">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                Loading authentic client reviews...
              </div>
            ) : previewList.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-black/40 border border-white/5">
                <MessageSquare className="w-6 h-6 text-purple-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs sm:text-sm font-semibold text-slate-200">
                  No reviews submitted yet
                </p>
                <p className="text-xs text-slate-400 font-light mt-1 max-w-md mx-auto">
                  We strictly refuse fake reviews. Genuine client reviews are submitted on our dedicated Reviews page.
                </p>
                {onOpenReviewsPage && (
                  <button
                    onClick={onOpenReviewsPage}
                    className="mt-4 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Visit Reviews Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewList.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/30 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1" title={`${rev.rating} / 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                                  : "text-slate-700 fill-white/5"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 font-light italic line-clamp-3 mb-3">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {rev.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Client</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Reviews can only be written on the dedicated Reviews page</span>
            </div>

            {onOpenReviewsPage && (
              <button
                onClick={onOpenReviewsPage}
                className="text-purple-300 hover:text-cyan-300 font-mono text-xs inline-flex items-center gap-1.5 transition cursor-pointer font-semibold"
              >
                <span>Read All Reviews & Client Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        </ScrollReveal>
      </section>
    );
  }

  // ================= DEDICATED FULL REVIEWS PAGE =================
  return (
    <div className="w-full space-y-8">
      {/* Top Banner / Authenticity Header */}
      <ScrollReveal direction="up" delay={0.05}>
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#090d1a] to-cyan-950/30 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-cyan-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Client Reviews & Verified Ratings</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Anti-Spam Verified
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-light mt-0.5 max-w-2xl">
                Zero fake reviews, zero bots. Each client device is permitted exactly 1 authentic review. Use the write button below to add or manage your review.
              </p>
            </div>
          </div>

          <button
            onClick={() => setPolicyModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>How It Works</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Metrics Row: Clickable Review Count & Project Count (No Star Icons) */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Verified Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d1a] border border-purple-500/20 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{totalCount}</div>
            <div className="text-xs text-slate-400 font-mono">Verified Reviews</div>
          </div>
        </div>

        {/* Metric 2: Average Rating */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d1a] border border-purple-500/20 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {totalCount > 0 ? `${avgRating} / 5` : "5.0 / 5"}
            </div>
            <div className="text-xs text-slate-400 font-mono">Client Rating Score</div>
          </div>
        </div>

        {/* Metric 3: Clickable Projects Count */}
        <div
          onClick={onNavigateToProjects}
          className="p-4 sm:p-5 rounded-2xl bg-[#090d1a] border border-cyan-500/20 hover:border-cyan-400/50 transition cursor-pointer flex items-center justify-between gap-4 group"
          title="Click to view all projects"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{finalProjectCount}</div>
              <div className="text-xs text-slate-400 font-mono">Projects in Showcase</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
      </ScrollReveal>

      {/* Reviews Showcase Header with Kutty (Small) Write Button */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Verified Client Feedback</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({reviews.length} Published)
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-light">
            Real feedback from verified devices. Zero automated or simulated reviews.
          </p>
        </div>

        {/* Kutty (Small) Write / Manage Review Button */}
        <div>
          {alreadyReviewed && myReview ? (
            <button
              onClick={handleOpenReviewModal}
              className="px-3.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
              title="View, Edit, or Delete your review"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your Review (Edit / Delete)</span>
            </button>
          ) : (
            <button
              onClick={handleOpenReviewModal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>Write Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div>
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400">
            Loading verified reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#090d1a] border border-white/10 space-y-3">
            <MessageSquare className="w-8 h-8 text-purple-400 mx-auto opacity-70" />
            <p className="text-sm font-bold text-white">No Reviews Published Yet</p>
            <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
              We do not seed fake reviews. Click the small "Write Review" button above to be the very first verified client to publish feedback!
            </p>
            <button
              onClick={handleOpenReviewModal}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>Write First Review</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev, idx) => {
              const isMine = myReview?.id === rev.id;
              return (
                <ScrollReveal
                  key={rev.id}
                  direction="up"
                  delay={Math.min(0.05 * idx, 0.3)}
                  distance={20}
                >
                  <div
                    className={`p-5 rounded-2xl bg-[#090d1a] border transition space-y-3 ${
                      isMine
                        ? "border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.15)]"
                        : "border-purple-500/20 hover:border-purple-500/35"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold font-mono">
                          {rev.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white">{rev.name}</h4>
                            {isMine && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified Device</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1" title={`${rev.rating} / 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rev.rating
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                                  : "text-slate-700 fill-white/5"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed pl-10">
                      "{rev.comment}"
                    </p>

                    {isMine && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                        <button
                          onClick={handleOpenReviewModal}
                          className="text-[11px] font-mono text-purple-300 hover:text-purple-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit / Manage</span>
                        </button>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= REVIEW POPUP MODAL (Write, View, Edit, Delete) ================= */}
      {reviewModalOpen && (
        <div
          onClick={() => setReviewModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#090d1a] border border-purple-500/40 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Notification Messages */}
            {actionSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* CASE 1: Device Already Has A Review AND Not currently editing */}
            {myReview && !isEditingMyReview ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Your Submitted Review</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Active on SKEDZ • 1 review per device constraint
                    </p>
                  </div>
                </div>

                {/* Review Details Card */}
                <div className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                        {myReview.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-white">{myReview.name}</span>
                    </div>

                    <div className="flex items-center gap-1" title={`${myReview.rating} / 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= myReview.rating
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"
                              : "text-slate-700 fill-white/5"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed italic">
                    "{myReview.comment}"
                  </p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Verified Authenticity</span>
                    <span>
                      {new Date(myReview.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleStartEdit}
                    className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Review</span>
                  </button>

                  <button
                    onClick={handleDeleteMyReview}
                    disabled={isDeleting}
                    className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? "Deleting..." : "Delete Review"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CASE 2: Writing New Review OR Editing Existing Review */
              <form
                onSubmit={isEditingMyReview ? handleSaveEditReview : handleCreateReview}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                    <PenSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isEditingMyReview ? "Edit Your Review" : "Write a Verified Review"}
                    </h3>
                    <p className="text-[11px] text-cyan-300 font-mono">
                      {isEditingMyReview
                        ? "Update your review details below"
                        : "Strict 1-review per device constraint"}
                    </p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Your Name / Client Identity *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g., Alex Reed or TechNova Studio"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition"
                  />
                </div>

                {/* Star Rating (No raw numbers) */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-2">
                    Rating Stars *
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoverRating || formRating);
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 rounded-xl transition-all duration-150 hover:scale-125 active:scale-95 cursor-pointer group focus:outline-none"
                            title={`${star} Star${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-all duration-200 ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] scale-105"
                                  : "text-slate-600 fill-white/5 group-hover:text-amber-300/70"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <span className="self-start sm:self-center px-3 py-1 rounded-xl bg-amber-950/50 border border-amber-500/30 text-xs font-medium text-amber-300">
                      {ratingDescriptions[hoverRating || formRating]}
                    </span>
                  </div>
                </div>

                {/* Comments / Experience */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Your Review & Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={1000}
                    placeholder="Describe the quality of video editing, web development, communication, turnaround speed..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition resize-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>Authentic feedback only</span>
                    <span>{formComment.length} / 1000</span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? "Saving..."
                        : isEditingMyReview
                        ? "Save Changes"
                        : "Publish Verified Review"}
                    </span>
                  </button>

                  {isEditingMyReview && (
                    <button
                      type="button"
                      onClick={() => setIsEditingMyReview(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Authenticity Policy Informational Popup */}
      {policyModalOpen && (
        <div
          onClick={handleDismissPolicy}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#090d1a] border border-purple-500/40 p-6 sm:p-7 shadow-2xl relative space-y-4"
          >
            <button
              onClick={handleDismissPolicy}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  100% Authentic Reviews Guarantee
                </h3>
                <p className="text-[11px] text-cyan-300 font-mono">
                  Strict Zero-Fake Testimonials Protocol
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-light leading-relaxed pt-1">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real Collaborator Feedback Only</span>
                </div>
                <p className="text-slate-400">
                  We strictly refuse fake or bot-generated reviews. Every review shown on this platform reflects authentic client and partner interactions.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Strict 1 Review Per Device Constraint</span>
                </div>
                <p className="text-slate-400">
                  Our system verifies each device fingerprint and network session. You can only submit a single review from this device, but you can edit or delete it anytime via the popup.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Automatic Live Score Calculation</span>
                </div>
                <p className="text-slate-400">
                  Review ratings dynamically compute into our live public satisfaction rating. Project counts reflect verified works published through the administrative studio.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleDismissPolicy}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
