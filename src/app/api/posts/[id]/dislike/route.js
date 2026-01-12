import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// POST - Dislike or undislike a post
export async function POST(req, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Handle params (Next.js 15+ uses Promise, earlier versions use object)
    const resolvedParams = params instanceof Promise ? await params : params;
    const postId = resolvedParams.id;
    const userId = session.user.id;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        dislikes: true,
        dislikedBy: true,
        likes: true,
        likedBy: true,
        expiresAt: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if post has expired
    if (new Date(post.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, message: "This post has expired" },
        { status: 400 }
      );
    }

    // Check if user already disliked the post
    const hasDisliked = post.dislikedBy.includes(userId);
    const hasLiked = post.likedBy.includes(userId);

    let updatedPost;
    if (hasDisliked) {
      // Undislike: remove user from dislikedBy and decrement dislikes
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          dislikes: {
            decrement: 1,
          },
          dislikedBy: {
            set: post.dislikedBy.filter((id) => id !== userId),
          },
        },
        select: {
          id: true,
          likes: true,
          likedBy: true,
          dislikes: true,
          dislikedBy: true,
        },
      });
    } else {
      // Dislike: add user to dislikedBy and increment dislikes
      // If user had liked it, remove from likedBy and decrement likes
      const updateData = {
        dislikes: {
          increment: 1,
        },
        dislikedBy: {
          push: userId,
        },
      };

      if (hasLiked) {
        updateData.likes = {
          decrement: 1,
        };
        updateData.likedBy = {
          set: post.likedBy.filter((id) => id !== userId),
        };
      }

      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: updateData,
        select: {
          id: true,
          likes: true,
          likedBy: true,
          dislikes: true,
          dislikedBy: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: hasDisliked ? "Post undisliked" : "Post disliked",
      post: updatedPost,
      hasDisliked: !hasDisliked, // Return the new state
    });
  } catch (err) {
    console.error("Error toggling dislike:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update dislike. Please try again." },
      { status: 500 }
    );
  }
}
