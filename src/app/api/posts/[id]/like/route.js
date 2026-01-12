import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// POST - Like or unlike a post
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
        likes: true,
        likedBy: true,
        dislikes: true,
        dislikedBy: true,
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

    // Check if user already liked the post
    const hasLiked = post.likedBy.includes(userId);
    const hasDisliked = post.dislikedBy?.includes(userId) || false;

    let updatedPost;
    if (hasLiked) {
      // Unlike: remove user from likedBy and decrement likes
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          likes: {
            decrement: 1,
          },
          likedBy: {
            set: post.likedBy.filter((id) => id !== userId),
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
      // Like: add user to likedBy and increment likes
      // If user had disliked it, remove from dislikedBy and decrement dislikes
      const updateData = {
        likes: {
          increment: 1,
        },
        likedBy: {
          push: userId,
        },
      };

      if (hasDisliked) {
        updateData.dislikes = {
          decrement: 1,
        };
        updateData.dislikedBy = {
          set: post.dislikedBy.filter((id) => id !== userId),
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
      message: hasLiked ? "Post unliked" : "Post liked",
      post: updatedPost,
      hasLiked: !hasLiked, // Return the new state
    });
  } catch (err) {
    console.error("Error toggling like:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update like. Please try again." },
      { status: 500 }
    );
  }
}
