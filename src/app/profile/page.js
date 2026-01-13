"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { Box, Flex, Text } from "@radix-ui/themes";
import { Bookmark, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/provider/ToastContext";
import PostCard from "@/components/PostCard";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("posts"); // "posts" or "bookmarked"
  const [posts, setPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookmarked, setLoadingBookmarked] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const fetchUserPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/posts/user", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setPosts(data.posts || []);
      } else {
        showToast("Failed to fetch your posts.");
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
      showToast("Failed to fetch your posts.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchBookmarkedPosts = useCallback(async () => {
    try {
      setLoadingBookmarked(true);
      const res = await fetch("/api/posts/bookmarked", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setBookmarkedPosts(data.posts || []);
      } else {
        showToast("Failed to fetch bookmarked posts.");
      }
    } catch (err) {
      console.error("Error fetching bookmarked posts:", err);
      showToast("Failed to fetch bookmarked posts.");
    } finally {
      setLoadingBookmarked(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserPosts();
    }
  }, [status, fetchUserPosts]);

  useEffect(() => {
    if (activeTab === "bookmarked" && status === "authenticated") {
      fetchBookmarkedPosts();
    }
  }, [activeTab, status, fetchBookmarkedPosts]);

  const handlePostLike = (postId, updatedPost) => {
    if (activeTab === "posts") {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: updatedPost.likes,
                likedBy: updatedPost.likedBy,
                dislikes: updatedPost.dislikes || 0,
                dislikedBy: updatedPost.dislikedBy || [],
              }
            : p
        )
      );
    } else {
      setBookmarkedPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: updatedPost.likes,
                likedBy: updatedPost.likedBy,
                dislikes: updatedPost.dislikes || 0,
                dislikedBy: updatedPost.dislikedBy || [],
              }
            : p
        )
      );
    }
  };

  const handlePostDislike = (postId, updatedPost) => {
    if (activeTab === "posts") {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                dislikes: updatedPost.dislikes || 0,
                dislikedBy: updatedPost.dislikedBy || [],
                likes: updatedPost.likes,
                likedBy: updatedPost.likedBy,
              }
            : p
        )
      );
    } else {
      setBookmarkedPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                dislikes: updatedPost.dislikes || 0,
                dislikedBy: updatedPost.dislikedBy || [],
                likes: updatedPost.likes,
                likedBy: updatedPost.likedBy,
              }
            : p
        )
      );
    }
  };

  const handlePostEdit = (post) => {
    // Refresh posts after edit
    fetchUserPosts();
  };

  const handlePostDelete = (post) => {
    // Remove post from state
    if (activeTab === "posts") {
      setPosts((prevPosts) => prevPosts.filter((p) => p.id !== post.id));
    } else {
      setBookmarkedPosts((prevPosts) => prevPosts.filter((p) => p.id !== post.id));
    }
  };

  const handlePostBookmark = (postId, updatedPost) => {
    // If unbookmarked, remove from bookmarked list
    const isBookmarked = updatedPost.bookmarkedBy?.includes(session?.user?.id) || false;
    if (!isBookmarked && activeTab === "bookmarked") {
      setBookmarkedPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
    } else if (activeTab === "bookmarked") {
      // Update bookmark state
      setBookmarkedPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                bookmarkedBy: updatedPost.bookmarkedBy || [],
              }
            : p
        )
      );
    }
  };

  const handleRefresh = () => {
    if (activeTab === "posts") {
      fetchUserPosts();
    } else {
      fetchBookmarkedPosts();
    }
  };

  if (status === "loading") {
    return (
      <>
        <AppHeader />
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const currentPosts = activeTab === "posts" ? posts : bookmarkedPosts;
  const isLoading = activeTab === "posts" ? loading : loadingBookmarked;

  return (
    <>
      <AppHeader />
      <div className="h-1 shadow-[0_1px_0_rgba(0,0,0,0.06)]" />

      <Flex height="100vh" pt="49px" align="stretch" direction="column">
        {/* Header */}
        <div className="sticky top-[56px] z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mb-3 sm:mb-4">
              My Profile
            </h1>

            {/* User Info */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg sm:text-xl font-semibold flex-shrink-0">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {session?.user?.name || "User"}
                </div>
                {session?.user?.email && (
                  <div className="text-xs sm:text-sm text-gray-500 truncate">
                    {session.user.email}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 border-b border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "posts"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">My Posts</span>
                  <span className="sm:hidden">Posts</span>
                  {posts.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                      {posts.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab("bookmarked")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "bookmarked"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                  <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Saved Posts</span>
                  <span className="sm:hidden">Saved</span>
                  {bookmarkedPosts.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                      {bookmarkedPosts.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <Box className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
            </div>
          ) : currentPosts.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 max-w-7xl mx-auto">
              {currentPosts.map((post) => (
                <div key={post.id} id={`post-${post.id}`} className="w-full">
                  <PostCard
                    post={post}
                    session={session}
                    onLike={handlePostLike}
                    onDislike={handlePostDislike}
                    onEdit={handlePostEdit}
                    onDelete={handlePostDelete}
                    onBookmark={handlePostBookmark}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
              {activeTab === "posts" ? (
                <>
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                  <Text className="text-sm sm:text-base text-gray-500 mb-1 sm:mb-2 font-medium">
                    No posts yet
                  </Text>
                  <Text className="text-xs sm:text-sm text-gray-400 max-w-sm">
                    Create your first post to get started!
                  </Text>
                </>
              ) : (
                <>
                  <Bookmark className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                  <Text className="text-sm sm:text-base text-gray-500 mb-1 sm:mb-2 font-medium">
                    No saved posts
                  </Text>
                  <Text className="text-xs sm:text-sm text-gray-400 max-w-sm">
                    Bookmark posts to save them for later
                  </Text>
                </>
              )}
            </div>
          )}
        </Box>
      </Flex>
    </>
  );
}
