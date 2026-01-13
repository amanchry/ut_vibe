import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET - Fetch all bookmarked posts by the authenticated user
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const now = new Date();
    
    const posts = await prisma.post.findMany({
      where: {
        bookmarkedBy: {
          has: session.user.id, // Posts where bookmarkedBy array contains user ID
        },
        expiresAt: {
          gt: now, // Only get posts that haven't expired
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        location: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, posts });
  } catch (err) {
    console.error("Error fetching bookmarked posts:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching bookmarked posts" },
      { status: 500 }
    );
  }
}
