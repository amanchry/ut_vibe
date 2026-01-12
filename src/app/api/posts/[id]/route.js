import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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

// DELETE - Delete a post
export async function DELETE(req, { params }) {
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

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        imageIds: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user is the author or admin
    if (post.authorId !== session.user.id && !session.user.admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only delete your own posts." },
        { status: 403 }
      );
    }

    // Delete images from Cloudinary
    if (post.imageIds && post.imageIds.length > 0) {
      try {
        await Promise.all(
          post.imageIds.map((publicId) =>
            cloudinary.uploader.destroy(publicId).catch((err) => {
              console.error(`Error deleting image ${publicId}:`, err);
            })
          )
        );
      } catch (err) {
        console.error("Error deleting images from Cloudinary:", err);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete the post (cascade will delete location)
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete post. Please try again." },
      { status: 500 }
    );
  }
}

// PUT - Update a post
export async function PUT(req, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Handle params
    const resolvedParams = params instanceof Promise ? await params : params;
    const postId = resolvedParams.id;

    // Get the post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        images: true,
        imageIds: true,
        expiresAt: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if post has expired
    if (new Date(existingPost.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Cannot edit expired post" },
        { status: 400 }
      );
    }

    // Check if user is the author or admin
    if (existingPost.authorId !== session.user.id && !session.user.admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only edit your own posts." },
        { status: 403 }
      );
    }

    const form = await req.formData();

    // Get form data
    const title = form.get("title")?.toString()?.trim();
    const description = form.get("description")?.toString()?.trim() || "";
    const category = form.get("category")?.toString() || "other";
    const tags = form.get("tags")?.toString() || "";
    const isAnonymous = form.get("isAnonymous") === "true";
    const deleteImageIds = form.get("deleteImageIds")?.toString() || "";
    
    // Location data (optional)
    const latitude = form.get("latitude")?.toString();
    const longitude = form.get("longitude")?.toString();

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    // Handle image deletions
    const imageIdsToDelete = deleteImageIds
      ? deleteImageIds.split(",").filter((id) => id.trim().length > 0)
      : [];

    // Delete images from Cloudinary
    if (imageIdsToDelete.length > 0) {
      try {
        await Promise.all(
          imageIdsToDelete.map((publicId) =>
            cloudinary.uploader.destroy(publicId.trim()).catch((err) => {
              console.error(`Error deleting image ${publicId}:`, err);
            })
          )
        );
      } catch (err) {
        console.error("Error deleting images from Cloudinary:", err);
      }
    }

    // Handle new image uploads
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
        }
      }
    }

    // Parse tags
    const tagsArray = tags
      ? tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    // Get current images and filter out deleted ones
    const currentImages = existingPost.images || [];
    const currentImageIds = existingPost.imageIds || [];
    
    // Filter out deleted images by matching indices
    const updatedImages = [];
    const updatedImageIds = [];
    
    currentImageIds.forEach((id, index) => {
      if (!imageIdsToDelete.includes(id)) {
        updatedImages.push(currentImages[index]);
        updatedImageIds.push(id);
      }
    });

    // Add new images
    const finalImages = [...updatedImages, ...uploadedImages];
    const finalImageIds = [...updatedImageIds, ...uploadedImageIds];

    // Prepare update data
    const updateData = {
      title,
      description,
      category,
      tags: tagsArray,
      images: finalImages,
      imageIds: finalImageIds,
      isAnonymous,
    };

    // Handle location update
    if (latitude && longitude) {
      // Check if location exists
      const existingLocation = await prisma.location.findUnique({
        where: { postId },
      });

      if (existingLocation) {
        // Update existing location
        updateData.location = {
          update: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
        };
      } else {
        // Create new location
        updateData.location = {
          create: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
        };
      }
    } else {
      // Remove location if it exists and no new location provided
      const existingLocation = await prisma.location.findUnique({
        where: { postId },
      });
      if (existingLocation) {
        updateData.location = {
          delete: true,
        };
      }
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
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
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (err) {
    console.error("Error updating post:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update post. Please try again." },
      { status: 500 }
    );
  }
}
