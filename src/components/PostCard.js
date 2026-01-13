"use client";

import { useEffect, useState } from "react";
import { Badge, DropdownMenu } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Heart,
  MapPin,
  Clock,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash,
  ThumbsDown,
  Navigation,
  Bookmark,
  X,
} from "lucide-react";

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

export default function PostCard({ post, session, onLike, onDislike, onEdit, onDelete, onBookmark }) {
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
  const [isBookmarked, setIsBookmarked] = useState(
    session?.user?.id ? post.bookmarkedBy?.includes(session.user.id) : false
  );
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Reset image index and bookmark state when post changes
  useEffect(() => {
    setCurrentImageIndex(0);
    if (session?.user?.id) {
      setIsBookmarked(post.bookmarkedBy?.includes(session.user.id) || false);
    }
  }, [post.id, post.bookmarkedBy, session?.user?.id]);

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

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) {
      return;
    }

    if (isBookmarking) return;

    // Optimistic update
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);
    setIsBookmarking(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update with server response
        setIsBookmarked(data.post.bookmarkedBy?.includes(session.user.id) || false);
        // Notify parent component
        if (onBookmark) {
          onBookmark(post.id, data.post);
        }
      } else {
        // Revert on error
        setIsBookmarked(!newBookmarkedState);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      // Revert on error
      setIsBookmarked(!newBookmarkedState);
    } finally {
      setIsBookmarking(false);
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

  const openImageViewer = (index) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const showPrevViewerImage = (e) => {
    e?.stopPropagation();
    setImageViewerIndex((prev) =>
      post.images && post.images.length > 0
        ? (prev - 1 + post.images.length) % post.images.length
        : prev
    );
  };

  const showNextViewerImage = (e) => {
    e?.stopPropagation();
    setImageViewerIndex((prev) =>
      post.images && post.images.length > 0
        ? (prev + 1) % post.images.length
        : prev
    );
  };

  const isAuthor = session?.user?.id === post.authorId || session?.user?.admin;

  const handleGetDirections = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (post.location && post.location.latitude && post.location.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${post.location.latitude},${post.location.longitude}`;
      window.open(url, '_blank');
    }
  };

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

          {/* Full view button */}
          <div className="absolute bottom-3 right-3 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openImageViewer(currentImageIndex);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium tracking-tight text-gray-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <ImageIcon className="h-3.5 w-3.5 text-gray-600" />
              <span>View full image</span>
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-2">
          <Badge color={getCategoryColor(post.category)} size="1">
            {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
          </Badge>
          {post.location && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>On campus</span>
              </div>
              <button
                onClick={handleGetDirections}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all"
                title="Get directions on Google Maps"
              >
                <Navigation className="h-3 w-3" />
                <span>Directions</span>
              </button>
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

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              disabled={!session?.user?.id || isBookmarking}
              className={`flex items-center gap-1 transition-all ${session?.user?.id
                ? "hover:scale-110 cursor-pointer"
                : "cursor-default opacity-60"
                } ${isBookmarked ? "text-yellow-500" : "text-gray-500"}`}
              title={session?.user?.id ? (isBookmarked ? "Remove bookmark" : "Bookmark") : "Sign in to bookmark"}
            >
              <Bookmark
                className={`h-4 w-4 transition-all ${isBookmarked ? "fill-yellow-500" : ""
                  }`}
              />
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
      <Dialog.Root open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full bg-white/90 p-2 text-gray-700 shadow-lg transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Close image viewer"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {post.images?.[imageViewerIndex] && (
              <div className="relative flex w-full max-w-4xl max-h-[90vh] items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-2 shadow-2xl">
                <img
                  src={post.images[imageViewerIndex]}
                  alt={`${post.title} - Full image ${imageViewerIndex + 1}`}
                  className="max-h-[90vh] max-w-full rounded-xl object-contain"
                />

                {post.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevViewerImage}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextViewerImage}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {post.images && post.images.length > 0 && (
              <span className="mt-3 text-sm text-white/80">
                {imageViewerIndex + 1} / {post.images.length}
              </span>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
