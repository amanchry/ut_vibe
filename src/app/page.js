"use client";

import { useEffect, useState, useCallback, useMemo, useDeferredValue } from "react";
import Image from "next/image";
import { Box, Flex, Separator, TextField, Badge, Switch, Text, DropdownMenu } from "@radix-ui/themes";
import { useSession } from "next-auth/react";

import AppHeader from "@/components/AppHeader";
import dynamic from "next/dynamic";
import ResizableSplitView from "@/components/ResizableSplitView";
import LocationPicker from "@/components/LocationPicker";
import * as Dialog from "@radix-ui/react-dialog";
import { PlusCircle, X, Search, Heart, MapPin, Clock, ImageIcon, Trash2, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash, ThumbsDown, Map, List, Eye, EyeOff, RotateCw } from "lucide-react";

const CampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-gray-200" aria-busy="true" />
  ),
});
import { useToast } from "@/provider/ToastContext";
import { useAlert } from "@/provider/AlertContext";
import { useRouter } from "next/navigation";


// Category options
const CATEGORIES = [
  { value: "event", label: "Event" },
  { value: "gathering", label: "Gathering" },
  { value: "lost-found", label: "Lost & Found" },
  { value: "food", label: "Free Food" },
  { value: "sports", label: "Sports" },
  { value: "music", label: "Music" },
  { value: "study", label: "Study Group" },
  { value: "celebration", label: "Celebration" },
  { value: "club", label: "Club Activity" },
  { value: "other", label: "Other" },
];

function PostCard({ post, session, onLike, onDislike, onEdit, onDelete }) {
  const [isLiked, setIsLiked] = useState(
    session?.user?.id ? post.likedBy?.includes(session.user.id) : false
  );
  const [isDisliked, setIsDisliked] = useState(
    session?.user?.id ? post.dislikedBy?.includes(session.user.id) : false
  );
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(post.dislikes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Reset image index when post changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [post.id]);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && post.images && post.images.length > 0) {
      nextImage();
    }
    if (isRightSwipe && post.images && post.images.length > 0) {
      prevImage();
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      event: "blue",
      gathering: "purple",
      "lost-found": "orange",
      food: "green",
      sports: "red",
      music: "pink",
      study: "indigo",
      celebration: "yellow",
      club: "cyan",
      other: "gray",
    };
    return colors[category] || "gray";
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) {
      return;
    }

    if (isLiking || isDisliking) return;

    // Optimistic update
    const newLikedState = !isLiked;
    const wasDisliked = isDisliked;
    let newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;
    let newDislikeCount = dislikeCount;

    // If user was disliking, remove dislike when liking
    if (wasDisliked && newLikedState) {
      newDislikeCount = Math.max(0, dislikeCount - 1);
      setIsDisliked(false);
      setDislikeCount(newDislikeCount);
    }

    setIsLiked(newLikedState);
    setLikeCount(newLikeCount);
    setIsLiking(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update with server response
        setIsLiked(data.post.likedBy.includes(session.user.id));
        setIsDisliked(data.post.dislikedBy?.includes(session.user.id) || false);
        setLikeCount(data.post.likes);
        setDislikeCount(data.post.dislikes || 0);
        if (onLike) {
          onLike(post.id, data.post);
        }
      } else {
        // Revert on error
        setIsLiked(!newLikedState);
        setLikeCount(likeCount);
        if (wasDisliked) {
          setIsDisliked(true);
          setDislikeCount(dislikeCount);
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert on error
      setIsLiked(!newLikedState);
      setLikeCount(likeCount);
      if (wasDisliked) {
        setIsDisliked(true);
        setDislikeCount(dislikeCount);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) {
      return;
    }

    if (isDisliking || isLiking) return;

    // Optimistic update
    const newDislikedState = !isDisliked;
    const wasLiked = isLiked;
    let newDislikeCount = newDislikedState ? dislikeCount + 1 : dislikeCount - 1;
    let newLikeCount = likeCount;

    // If user was liking, remove like when disliking
    if (wasLiked && newDislikedState) {
      newLikeCount = Math.max(0, likeCount - 1);
      setIsLiked(false);
      setLikeCount(newLikeCount);
    }

    setIsDisliked(newDislikedState);
    setDislikeCount(newDislikeCount);
    setIsDisliking(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/dislike`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update with server response
        setIsDisliked(data.post.dislikedBy?.includes(session.user.id) || false);
        setIsLiked(data.post.likedBy.includes(session.user.id));
        setDislikeCount(data.post.dislikes || 0);
        setLikeCount(data.post.likes);
        if (onDislike) {
          onDislike(post.id, data.post);
        }
      } else {
        // Revert on error
        setIsDisliked(!newDislikedState);
        setDislikeCount(dislikeCount);
        if (wasLiked) {
          setIsLiked(true);
          setLikeCount(likeCount);
        }
      }
    } catch (err) {
      console.error("Error toggling dislike:", err);
      // Revert on error
      setIsDisliked(!newDislikedState);
      setDislikeCount(dislikeCount);
      if (wasLiked) {
        setIsLiked(true);
        setLikeCount(likeCount);
      }
    } finally {
      setIsDisliking(false);
    }
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    if (post.images && post.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
    }
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    if (post.images && post.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
    }
  };

  const goToImage = (index, e) => {
    e?.stopPropagation();
    setCurrentImageIndex(index);
  };

  const isAuthor = session?.user?.id === post.authorId || session?.user?.admin;

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all">
      {/* Three-dot Menu - Top Right */}
      {isAuthor && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button
                className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label="Post options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="min-w-[150px]">
              <DropdownMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(post);
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Post</span>
                </div>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(post);
                }}
                color="red"
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trash className="h-4 w-4" />
                  <span>Delete Post</span>
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      )}

      {/* Image Carousel */}
      {post.images && post.images.length > 0 && (
        <div
          className="relative w-full h-48 bg-gray-100 overflow-hidden group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Images Container */}
          <div
            className="flex transition-transform duration-300 ease-in-out h-full"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {post.images.map((image, index) => (
              <div key={index} className="min-w-full h-full flex-shrink-0">
                <img
                  src={image}
                  alt={`${post.title} - Image ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>

          {/* Image Counter */}
          {post.images.length > 1 && (
            <div className={`absolute top-2 ${isAuthor ? 'right-12' : 'right-2'} bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm`}>
              {currentImageIndex + 1} / {post.images.length}
            </div>
          )}

          {/* Navigation Arrows */}
          {post.images.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Next Button */}
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {post.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(index, e)}
                  className={`transition-all rounded-full ${index === currentImageIndex
                    ? "w-2 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/75"
                    }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-2">
          <Badge color={getCategoryColor(post.category)} size="1">
            {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
          </Badge>
          {post.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>On campus</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
          {post.title}
        </h3>

        {/* Description */}
        {post.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!session?.user?.id || isLiking || isDisliking}
              className={`flex items-center gap-1 transition-all ${session?.user?.id
                ? "hover:scale-110 cursor-pointer"
                : "cursor-default opacity-60"
                } ${isLiked ? "text-red-500" : "text-gray-500"}`}
              title={session?.user?.id ? (isLiked ? "Unlike" : "Like") : "Sign in to like"}
            >
              <Heart
                className={`h-4 w-4 transition-all ${isLiked ? "fill-red-500" : ""
                  }`}
              />
              <span className={isLiked ? "text-red-500 font-medium" : ""}>
                {likeCount}
              </span>
            </button>

            {/* Dislike Button */}
            <button
              onClick={handleDislike}
              disabled={!session?.user?.id || isDisliking || isLiking}
              className={`flex items-center gap-1 transition-all ${session?.user?.id
                ? "hover:scale-110 cursor-pointer"
                : "cursor-default opacity-60"
                } ${isDisliked ? "text-blue-500" : "text-gray-500"}`}
              title={session?.user?.id ? (isDisliked ? "Remove dislike" : "Dislike") : "Sign in to dislike"}
            >
              <ThumbsDown
                className={`h-4 w-4 transition-all ${isDisliked ? "fill-blue-500" : ""
                  }`}
              />
              <span className={isDisliked ? "text-blue-500 font-medium" : ""}>
                {dislikeCount}
              </span>
            </button>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
          {post.isAnonymous && (
            <span className="text-xs text-gray-400">Anonymous</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { confirmAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [open, setOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    tags: "",
    isAnonymous: true,
    images: [],
    existingImages: [],
    deleteImageIds: [],
    location: null, // { latitude, longitude }
  });

  useEffect(() => {
    if (open) {
      setCreateStep(0);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      showToast("Please enter a title for your post.");
      return;
    }

    if (!session?.user?.id) {
      showToast("Please sign in to create a post.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description || "");
      formData.append("category", form.category);
      formData.append("tags", form.tags || "");
      formData.append("isAnonymous", form.isAnonymous.toString());

      // Append all images
      form.images.forEach((image) => {
        formData.append("images", image);
      });

      // Append location if provided
      if (form.location) {
        formData.append("latitude", form.location.latitude.toString());
        formData.append("longitude", form.location.longitude.toString());
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Post created! It'll be live for 1 week");
        fetchPosts();
        setForm({
          title: "",
          description: "",
          category: "other",
          tags: "",
          isAnonymous: true,
          images: [],
          location: null,
        });
        setOpen(false);
      } else {
        showToast(data.message || "Failed to create post.");
      }
    } catch (err) {
      console.error("Error creating post:", err);
      showToast("Error creating post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/posts", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setPosts(data.posts || []);
      } else {
        showToast("Failed to fetch posts.");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      showToast("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handlePostLike = (postId, updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
            ...p,
            likes: updatedPost.likes,
            likedBy: updatedPost.likedBy,
            dislikes: updatedPost.dislikes || 0,
            dislikedBy: updatedPost.dislikedBy || []
          }
          : p
      )
    );
  };

  const handlePostDislike = (postId, updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
            ...p,
            dislikes: updatedPost.dislikes || 0,
            dislikedBy: updatedPost.dislikedBy || [],
            likes: updatedPost.likes,
            likedBy: updatedPost.likedBy
          }
          : p
      )
    );
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      showToast("Maximum 5 images allowed.");
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (index, imageId) => {
    setForm((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
      deleteImageIds: [...prev.deleteImageIds, imageId],
    }));
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setForm({
      title: post.title || "",
      description: post.description || "",
      category: post.category || "other",
      tags: post.tags ? post.tags.join(", ") : "",
      isAnonymous: post.isAnonymous ?? true,
      images: [],
      existingImages: post.images || [],
      deleteImageIds: [],
      location: post.location
        ? { latitude: post.location.latitude, longitude: post.location.longitude }
        : null,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!form.title.trim()) {
      showToast("Please enter a title for your post.");
      return;
    }

    if (!editingPost) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description || "");
      formData.append("category", form.category);
      formData.append("tags", form.tags || "");
      formData.append("isAnonymous", form.isAnonymous.toString());
      formData.append("deleteImageIds", form.deleteImageIds.join(","));

      // Append new images
      form.images.forEach((image) => {
        formData.append("images", image);
      });

      // Append location if provided
      if (form.location) {
        formData.append("latitude", form.location.latitude.toString());
        formData.append("longitude", form.location.longitude.toString());
      }

      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Post updated successfully! ✨");
        fetchPosts();
        setEditOpen(false);
        setEditingPost(null);
        setForm({
          title: "",
          description: "",
          category: "other",
          tags: "",
          isAnonymous: true,
          images: [],
          existingImages: [],
          deleteImageIds: [],
          location: null,
        });
      } else {
        showToast(data.message || "Failed to update post.");
      }
    } catch (err) {
      console.error("Error updating post:", err);
      showToast("Error updating post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (post) => {
    confirmAlert(
      `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`/api/posts/${post.id}`, {
            method: "DELETE",
          });

          const data = await res.json();
          if (res.ok && data.success) {
            showToast("Post deleted successfully");
            fetchPosts();
          } else {
            showToast(data.message || "Failed to delete post.");
          }
        } catch (err) {
          console.error("Error deleting post:", err);
          showToast("Error deleting post. Please try again.");
        }
      }
    );
  };





  // Loading/unauthenticated state
  if (status === "loading") return <p>Loading session...</p>;

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredPosts = useMemo(() => {
    const search = deferredSearchTerm.toLowerCase();
    return posts.filter((p) => {
      return (
        p.title?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(search)) ||
        p.category?.toLowerCase().includes(search)
      );
    });
  }, [posts, deferredSearchTerm]);


  const handlePostClick = useCallback((postId) => {
    setSelectedPostId(postId === selectedPostId ? null : postId);
  }, [selectedPostId]);

  const handleMarkerClick = useCallback((postId) => {
    setSelectedPostId(postId);
    // Scroll to post in list
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedPostId(null);
  }, []);

  // Memoize filtered posts to prevent unnecessary recalculations
  const postsWithLocation = useMemo(
    () => filteredPosts.filter((p) => p.location),
    [filteredPosts]
  );
  const postsWithoutLocation = useMemo(
    () => filteredPosts.filter((p) => !p.location),
    [filteredPosts]
  );

  return (
    <>
      <AppHeader />
      <div className="h-1 shadow-[0_1px_0_rgba(0,0,0,0.06)]" />



      <Flex height="100vh" pt="49px" align="stretch" direction="column">

        <div className="sticky top-[56px] z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="px-3 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="text-[17px] sm:text-2xl font-semibold tracking-tight text-gray-900">
                Campus Feed  {posts.length > 0 && `(${posts.length})`}
              </h1>
              <button
                onClick={fetchPosts}
                disabled={loading}
                className={[
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                  "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
                aria-label="Refresh campus feed"
                title="Refresh campus feed"
              >
                <RotateCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>

            </div>

            <button
              onClick={() => setShowMap((v) => !v)}
              className={[
                "hidden lg:inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium",
                "border transition-all",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                showMap
                  ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
              aria-label={showMap ? "Hide map" : "Show map"}
              title={showMap ? "Hide map" : "Show map"}
            >
              {showMap ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span><Map /></span>


                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span><Map /></span>
                </>
              )}
            </button>
          </div>
        </div>


        {/* Resizable Split View */}
        {showMap ? (
          <div className="flex-1 overflow-hidden">
            <ResizableSplitView
              defaultLeftWidth={50}
              left={
                <Box className="h-full overflow-y-auto p-3 sm:p-6 bg-gray-50">
                  {/* Search and Create */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-80">
                      <TextField.Root
                        size="3"
                        radius="full"
                        placeholder="Search campus moments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white"
                      >
                        <TextField.Slot side="left">
                          <Search className="h-4 w-4 text-gray-500" />
                        </TextField.Slot>
                      </TextField.Root>
                    </div>

                    {session?.user && (
                      <Dialog.Root open={open} onOpenChange={setOpen}>
                        <Dialog.Trigger asChild>
                          <button
                            className={[
                              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium",
                              "border shadow-sm transition-all whitespace-nowrap",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                              "bg-gray-900 text-white border-gray-900",
                              "hover:bg-gray-800 hover:shadow-md",
                              "active:scale-[0.98]",
                            ].join(" ")}
                          >
                            <PlusCircle className="h-4.5 w-4.5" />
                            <span>Create Post</span>
                          </button>
                        </Dialog.Trigger>
                      </Dialog.Root>


                    )}
                  </div>

                  {/* Posts List */}
                  {loading ? (
                    <p className="text-gray-500">Loading what's happening…</p>
                  ) : filteredPosts.length > 0 ? (
                    <div className="space-y-4">
                      {/* Posts with location */}
                      {postsWithLocation.length > 0 && (
                        <div>
                          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            On Map ({postsWithLocation.length})
                          </h2>
                          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                            {postsWithLocation.map((post) => (
                              <div
                                key={post.id}
                                id={`post-${post.id}`}
                                onClick={() => handlePostClick(post.id)}
                                className={`cursor-pointer transition-all ${selectedPostId === post.id
                                  ? "ring-2 ring-blue-500 rounded-xl"
                                  : ""
                                  }`}
                              >
                                <PostCard
                                  post={post}
                                  session={session}
                                  onLike={handlePostLike}
                                  onDislike={handlePostDislike}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posts without location */}
                      {postsWithoutLocation.length > 0 && (
                        <div className="mt-6">
                          <h2 className="text-sm font-semibold text-gray-600 mb-3">
                            All Posts ({postsWithoutLocation.length})
                          </h2>
                          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                            {postsWithoutLocation.map((post) => (
                              <div
                                key={post.id}
                                id={`post-${post.id}`}
                                onClick={() => handlePostClick(post.id)}
                                className={`cursor-pointer transition-all ${selectedPostId === post.id
                                  ? "ring-2 ring-blue-500 rounded-xl"
                                  : ""
                                  }`}
                              >
                                <PostCard
                                  post={post}
                                  session={session}
                                  onLike={handlePostLike}
                                  onDislike={handlePostDislike}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg mb-2">
                        No live posts yet. Be the first to drop a campus moment! 🎉
                      </p>
                      {session?.user && (
                        <button
                          onClick={() => setOpen(true)}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
                        >
                          <PlusCircle className="h-5 w-5" /> Create First Post
                        </button>
                      )}
                    </div>
                  )}
                </Box>
              }
              right={
                <Box className="h-full w-full bg-gray-100 relative" style={{ minHeight: "100%" }}>
                  <CampusMap
                    posts={postsWithLocation}
                    selectedPostId={selectedPostId}
                    onMarkerClick={handleMarkerClick}
                    onMapClick={handleMapClick}
                  />
                  {/* Mobile: Show selected post card overlay */}
                  {selectedPostId && (
                    <div className="lg:hidden absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl max-h-[60vh] overflow-y-auto animate-slide-up z-50">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800">Post Details</h3>
                        <button
                          onClick={handleMapClick}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="Close post details"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      {(() => {
                        const selectedPost = posts.find((p) => p.id === selectedPostId);
                        return selectedPost ? (
                          <div className="relative z-50">
                            <PostCard
                              post={selectedPost}
                              session={session}
                              onLike={handlePostLike}
                              onDislike={handlePostDislike}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </Box>
              }
            />
          </div>
        ) : (
          <Box className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">



            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">
                {/* Campus Feed {posts.length > 0 && `(${posts.length})`} */}
              </h1>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* 🔍 Search Bar */}
                <div className="flex items-center gap-2 w-full sm:w-80">
                  <TextField.Root
                    size="3"
                    radius="full"
                    placeholder="Search campus moments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white"
                  >
                    <TextField.Slot side="left">
                      <Search className="h-4 w-4 text-gray-500" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>

                {/* Create Post Button */}
                {session?.user && (
                  <Dialog.Root open={open} onOpenChange={setOpen}>
                    <Dialog.Trigger asChild>
    <button
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium",
        "border shadow-sm transition-all whitespace-nowrap",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
        "bg-gray-900 text-white border-gray-900",
        "hover:bg-gray-800 hover:shadow-md",
        "active:scale-[0.98]",
      ].join(" ")}
    >
      <PlusCircle className="h-4.5 w-4.5" />
      <span>Create Post</span>
    </button>
                    </Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                      <Dialog.Content className="fixed top-0 left-0 right-0 bottom-0 sm:top-1/2 sm:left-1/2 sm:w-[90vw] sm:max-w-2xl sm:max-h-[90vh] sm:rounded-xl sm:-translate-x-1/2 sm:-translate-y-1/2 overflow-y-auto bg-white p-4 sm:p-6 shadow-xl z-50">
                        <div className="flex items-center justify-between mb-4">
                          <Dialog.Title className="text-xl font-semibold">
                            Share What's Happening
                          </Dialog.Title>
                          <Dialog.Close asChild>
                            <button className="p-1 hover:bg-gray-100 rounded-full">
                              <X className="h-5 w-5 text-gray-500" />
                            </button>
                          </Dialog.Close>
                        </div>

                        {/* FORM FIELDS */}
                        <div className="sm:hidden mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              Step {createStep + 1} of 3
                            </span>
                            <div className="flex items-center gap-1">
                              {[0, 1, 2].map((step) => (
                                <span
                                  key={step}
                                  className={`h-1.5 w-6 rounded-full ${
                                    createStep >= step ? "bg-blue-600" : "bg-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-gray-800">
                            {createStep === 0
                              ? "Add photos"
                              : createStep === 1
                              ? "Post details"
                              : "Location & visibility"}
                          </p>
                        </div>

                        <div className="sm:hidden space-y-4">
                          {createStep === 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Images (max 5)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                              />
                              {form.images.length > 0 && (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  {form.images.map((image, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={URL.createObjectURL(image)}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border"
                                      />
                                      <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {createStep === 1 && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title *
                                </label>
                                <input
                                  type="text"
                                  value={form.title}
                                  onChange={(e) =>
                                    setForm((prev) => ({ ...prev, title: e.target.value }))
                                  }
                                  placeholder="What's happening?"
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                  maxLength={100}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={form.description}
                                  onChange={(e) =>
                                    setForm((prev) => ({ ...prev, description: e.target.value }))
                                  }
                                  rows="4"
                                  placeholder="Tell us more about it..."
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                                  maxLength={500}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Category
                                </label>
                                <select
                                  value={form.category}
                                  onChange={(e) =>
                                    setForm((prev) => ({ ...prev, category: e.target.value }))
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tags (comma-separated)
                                </label>
                                <input
                                  type="text"
                                  value={form.tags}
                                  onChange={(e) =>
                                    setForm((prev) => ({ ...prev, tags: e.target.value }))
                                  }
                                  placeholder="e.g. free food, library, study"
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                  Separate tags with commas
                                </p>
                              </div>
                            </>
                          )}

                          {createStep === 2 && (
                            <>
                              <LocationPicker
                                onLocationSelect={(location) =>
                                  setForm((prev) => ({ ...prev, location }))
                                }
                                initialLocation={form.location}
                              />

                              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                                <div className="mb-3">
                                  <label className="text-sm font-semibold text-gray-800 block mb-1">
                                    Post Visibility
                                  </label>
                                  <p className="text-xs text-gray-600">
                                    {form.isAnonymous
                                      ? "Your name will be hidden (Anonymous)"
                                      : "Your name will be visible (Public)"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({ ...prev, isAnonymous: false }))
                                    }
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                      !form.isAnonymous
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span>👤</span>
                                      <span>Public</span>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({ ...prev, isAnonymous: true }))
                                    }
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                      form.isAnonymous
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span>🔒</span>
                                      <span>Anonymous</span>
                                    </div>
                                  </button>
                                </div>

                                <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                                  {form.isAnonymous ? (
                                    <>
                                      <span>🔒</span>
                                      <span>Your identity stays private</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>👤</span>
                                      <span>Your name will be shown</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="hidden sm:block space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              value={form.title}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                              placeholder="What's happening?"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              maxLength={100}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={form.description}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, description: e.target.value }))
                              }
                              rows="4"
                              placeholder="Tell us more about it..."
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                              maxLength={500}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              value={form.category}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, category: e.target.value }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tags (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={form.tags}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, tags: e.target.value }))
                              }
                              placeholder="e.g. free food, library, study"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Separate tags with commas
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Images (max 5)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                              className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                            />
                            {form.images.length > 0 && (
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                {form.images.map((image, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border"
                                    />
                                    <button
                                      onClick={() => removeImage(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <LocationPicker
                            onLocationSelect={(location) =>
                              setForm((prev) => ({ ...prev, location }))
                            }
                            initialLocation={form.location}
                          />

                          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                            <div className="mb-3">
                              <label className="text-sm font-semibold text-gray-800 block mb-1">
                                Post Visibility
                              </label>
                              <p className="text-xs text-gray-600">
                                {form.isAnonymous
                                  ? "Your name will be hidden (Anonymous)"
                                  : "Your name will be visible (Public)"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, isAnonymous: false }))}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  !form.isAnonymous
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span>👤</span>
                                  <span>Public</span>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, isAnonymous: true }))}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  form.isAnonymous
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span>🔒</span>
                                  <span>Anonymous</span>
                                </div>
                              </button>
                            </div>

                            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                              {form.isAnonymous ? (
                                <>
                                  <span>🔒</span>
                                  <span>Your identity stays private</span>
                                </>
                              ) : (
                                <>
                                  <span>👤</span>
                                  <span>Your name will be shown</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:hidden mt-6 flex items-center justify-between gap-2">
                          {createStep === 0 ? (
                            <Dialog.Close asChild>
                              <button className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                                Cancel
                              </button>
                            </Dialog.Close>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCreateStep((step) => Math.max(0, step - 1))}
                              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                            >
                              Back
                            </button>
                          )}

                          {createStep < 2 ? (
                            <button
                              type="button"
                              onClick={() => setCreateStep((step) => Math.min(2, step + 1))}
                              disabled={createStep === 1 && !form.title.trim()}
                              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              onClick={handleCreate}
                              disabled={submitting || !form.title.trim()}
                              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submitting ? "Posting..." : "Post it! "}
                            </button>
                          )}
                        </div>

                        <div className="hidden sm:flex mt-6 justify-end gap-2">
                          <Dialog.Close asChild>
                            <button className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                              Cancel
                            </button>
                          </Dialog.Close>
                          <button
                            onClick={handleCreate}
                            disabled={submitting || !form.title.trim()}
                            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? "Posting..." : "Post it! "}
                          </button>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                )}
              </div>
            </div>

            {/* Edit Post Dialog */}
            {session?.user && editingPost && (
              <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title className="text-xl font-semibold">
                        Edit Post ✏️
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </Dialog.Close>
                    </div>

                    {/* FORM FIELDS */}
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="What's happening?"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          maxLength={100}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          rows="4"
                          placeholder="Tell us more about it..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                          maxLength={500}
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, category: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={form.tags}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, tags: e.target.value }))
                          }
                          placeholder="e.g. free food, library, study"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Separate tags with commas
                        </p>
                      </div>

                      {/* Existing Images */}
                      {form.existingImages.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Images
                          </label>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {form.existingImages.map((imageUrl, index) => {
                              const imageId = editingPost.imageIds?.[index];
                              return (
                                <div key={index} className="relative">
                                  <img
                                    src={imageUrl}
                                    alt={`Existing ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                  <button
                                    onClick={() => removeExistingImage(index, imageId)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* New Images */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Add More Images (max 5 total)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                        />
                        {form.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {form.images.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Anonymous Toggle */}
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <div className="mb-3">
                          <label className="text-sm font-semibold text-gray-800 block mb-1">
                            Post Visibility
                          </label>
                          <p className="text-xs text-gray-600">
                            {form.isAnonymous
                              ? "Your name will be hidden (Anonymous)"
                              : "Your name will be visible (Public)"}
                          </p>
                        </div>

                        {/* Toggle Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, isAnonymous: false }))}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!form.isAnonymous
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>👤</span>
                              <span>Public</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, isAnonymous: true }))}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${form.isAnonymous
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>🔒</span>
                              <span>Anonymous</span>
                            </div>
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                          {form.isAnonymous ? (
                            <>
                              <span>🔒</span>
                              <span>Your identity stays private</span>
                            </>
                          ) : (
                            <>
                              <span>👤</span>
                              <span>Your name will be shown</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="mt-6 flex justify-end gap-2">
                      <Dialog.Close asChild>
                        <button
                          onClick={() => {
                            setEditOpen(false);
                            setEditingPost(null);
                          }}
                          className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </Dialog.Close>
                      <button
                        onClick={handleUpdate}
                        disabled={submitting || !form.title.trim()}
                        className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Updating..." : "Update Post ✨"}
                      </button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            )}


            {loading ? (
              <p className="text-gray-500">Loading what's happening…</p>
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    session={session}
                    onLike={handlePostLike}
                    onDislike={handlePostDislike}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">
                  No live posts yet. Be the first to drop a campus moment! 🎉
                </p>
                {session?.user && (
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
                  >
                    <PlusCircle className="h-5 w-5" /> Create First Post
                  </button>
                )}
              </div>
            )}
          </Box>
        )}

        {/* Create Post Dialog - Shared between both views */}
        {session?.user && (
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div>
                    <Dialog.Title className="text-xl font-semibold">
                      Share What's Happening
                    </Dialog.Title>
                    <p className="text-sm text-gray-500">
                      Step {createStep + 1} of 3 &middot;{" "}
                      {createStep === 0
                        ? "Upload photos"
                        : createStep === 1
                        ? "Add details"
                        : "Location & privacy"}
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="flex gap-2 mb-4">
                  {[0, 1, 2].map((step) => {
                    const label =
                      step === 0 ? "Photos" : step === 1 ? "Details" : "Location";
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setCreateStep(step)}
                        className={`flex-1 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                          createStep === step
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  {createStep === 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Images (max 5)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      />
                      {form.images.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {form.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {createStep === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="What's happening?"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          rows="4"
                          placeholder="Tell us more about it..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                          maxLength={500}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, category: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={form.tags}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, tags: e.target.value }))
                          }
                          placeholder="e.g. free food, library, study"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Separate tags with commas
                        </p>
                      </div>
                    </>
                  )}

                  {createStep === 2 && (
                    <>
                      <LocationPicker
                        onLocationSelect={(location) =>
                          setForm((prev) => ({ ...prev, location }))
                        }
                        initialLocation={form.location}
                      />

                      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <div className="mb-3">
                          <label className="text-sm font-semibold text-gray-800 block mb-1">
                            Post Visibility
                          </label>
                          <p className="text-xs text-gray-600">
                            {form.isAnonymous
                              ? "Your name will be hidden (Anonymous)"
                              : "Your name will be visible (Public)"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, isAnonymous: false }))
                            }
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              !form.isAnonymous
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>👤</span>
                              <span>Public</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, isAnonymous: true }))
                            }
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              form.isAnonymous
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>🔒</span>
                              <span>Anonymous</span>
                            </div>
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                          {form.isAnonymous ? (
                            <>
                              <span>🔒</span>
                              <span>Your identity stays private</span>
                            </>
                          ) : (
                            <>
                              <span>👤</span>
                              <span>Your name will be shown</span>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-6">
                  {createStep === 0 ? (
                    <Dialog.Close asChild>
                      <button className="w-full sm:w-auto rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                        Cancel
                      </button>
                    </Dialog.Close>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCreateStep((step) => Math.max(0, step - 1))}
                      className="w-full sm:w-auto rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      Back
                    </button>
                  )}

                  {createStep < 2 ? (
                    <button
                      type="button"
                      onClick={() => setCreateStep((step) => Math.min(2, step + 1))}
                      disabled={createStep === 1 && !form.title.trim()}
                      className="w-full sm:w-auto rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={submitting || !form.title.trim()}
                      className="w-full sm:w-auto rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Posting..." : "Post it! "}
                    </button>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Edit Post Dialog */}
        {session?.user && editingPost && (
          <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Edit Post ✏️
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* FORM FIELDS */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="What's happening?"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      maxLength={100}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows="4"
                      placeholder="Tell us more about it..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                      maxLength={500}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, tags: e.target.value }))
                      }
                      placeholder="e.g. free food, library, study"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Separate tags with commas
                    </p>
                  </div>

                  {/* Existing Images */}
                  {form.existingImages.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Images
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {form.existingImages.map((imageUrl, index) => {
                          const imageId = editingPost.imageIds?.[index];
                          return (
                            <div key={index} className="relative">
                              <img
                                src={imageUrl}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <button
                                onClick={() => removeExistingImage(index, imageId)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* New Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add More Images (max 5 total)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                    />
                    {form.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {form.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location Picker */}
                  <LocationPicker
                    onLocationSelect={(location) =>
                      setForm((prev) => ({ ...prev, location }))
                    }
                    initialLocation={form.location}
                  />

                  {/* Anonymous Toggle */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <div className="mb-3">
                      <label className="text-sm font-semibold text-gray-800 block mb-1">
                        Post Visibility
                      </label>
                      <p className="text-xs text-gray-600">
                        {form.isAnonymous
                          ? "Your name will be hidden (Anonymous)"
                          : "Your name will be visible (Public)"}
                      </p>
                    </div>

                    {/* Toggle Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, isAnonymous: false }))}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!form.isAnonymous
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>👤</span>
                          <span>Public</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, isAnonymous: true }))}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${form.isAnonymous
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>🔒</span>
                          <span>Anonymous</span>
                        </div>
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                      {form.isAnonymous ? (
                        <>
                          <span>🔒</span>
                          <span>Your identity stays private</span>
                        </>
                      ) : (
                        <>
                          <span>👤</span>
                          <span>Your name will be shown</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="mt-6 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <button
                      onClick={() => {
                        setEditOpen(false);
                        setEditingPost(null);
                      }}
                      className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleUpdate}
                    disabled={submitting || !form.title.trim()}
                    className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Updating..." : "Update Post ✨"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </Flex>
    </>
  );
}
