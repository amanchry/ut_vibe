import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// POST - Bookmark or unbookmark a post
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
        bookmarkedBy: true,
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

    // Check if user already bookmarked the post
    const bookmarkedBy = post.bookmarkedBy || [];
    const hasBookmarked = bookmarkedBy.includes(userId);

    let updatedPost;
    if (hasBookmarked) {
      // Unbookmark: remove user from bookmarkedBy
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          bookmarkedBy: {
            set: bookmarkedBy.filter((id) => id !== userId),
          },
        },
        select: {
          id: true,
          bookmarkedBy: true,
        },
      });
    } else {
      // Bookmark: add user to bookmarkedBy
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          bookmarkedBy: {
            push: userId,
          },
        },
        select: {
          id: true,
          bookmarkedBy: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: hasBookmarked ? "Post unbookmarked" : "Post bookmarked",
      post: updatedPost,
      hasBookmarked: !hasBookmarked, // Return the new state
    });
  } catch (err) {
    console.error("Error toggling bookmark:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update bookmark. Please try again." },
      { status: 500 }
    );
  }
}
