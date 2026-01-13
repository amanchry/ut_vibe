import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET - Fetch all posts (excluding expired ones)
export async function GET() {
  try {
    const now = new Date();
    
    const posts = await prisma.post.findMany({
      where: {
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
    console.error("Error fetching posts:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching posts" },
      { status: 500 }
    );
  }
}

// Helper function to upload images to Cloudinary
async function uploadToCloudinary(file, folder = "ut-vibe/posts") {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
}

// POST - Create a new post
export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const form = await req.formData();

    // Get form data
    const title = form.get("title")?.toString()?.trim();
    const description = form.get("description")?.toString()?.trim() || "";
    const category = form.get("category")?.toString() || "other";
    const tags = form.get("tags")?.toString() || "";
    const isAnonymous = form.get("isAnonymous") === "true";
    
    // Location data (optional for now, will be used with map later)
    const latitude = form.get("latitude")?.toString();
    const longitude = form.get("longitude")?.toString();

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    // Handle image uploads (multiple images)
    const imageFiles = form.getAll("images");
    const uploadedImages = [];
    const uploadedImageIds = [];

    for (const file of imageFiles) {
      if (file && typeof file === "object" && file.size > 0) {
        try {
          const uploaded = await uploadToCloudinary(file);
          uploadedImages.push(uploaded.secure_url);
          uploadedImageIds.push(uploaded.public_id);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    // Parse tags (comma-separated string to array)
    const tagsArray = tags
      ? tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    // Set expiration date (1 week from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create post with location if provided
    const postData = {
      title,
      description,
      category,
      images: uploadedImages,
      imageIds: uploadedImageIds,
      tags: tagsArray,
      isAnonymous,
      expiresAt,
      authorId: session.user.id,
      likes: 0,
      likedBy: [],
      dislikes: 0,
      dislikedBy: [],
      bookmarkedBy: [],
    };

    // If location is provided, create location relation
    if (latitude && longitude) {
      postData.location = {
        create: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      };
    }

    const post = await prisma.post.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        location: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Post created successfully!",
      post 
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create post. Please try again." },
      { status: 500 }
    );
  }
}
