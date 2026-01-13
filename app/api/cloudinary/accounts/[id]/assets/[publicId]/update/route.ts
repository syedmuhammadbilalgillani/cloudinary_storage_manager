import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinary } from "@/lib/cloudinary";

async function verifyOwnership(accountId: string, userId: string) {
  const account = await prisma.cloudinaryAccount.findUnique({
    where: { id: accountId },
    select: { ownerId: true },
  });

  if (!account) {
    return { exists: false, authorized: false };
  }

  return {
    exists: true,
    authorized: account.ownerId === userId,
  };
}

// PUT - Update asset (rename, add tags, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; publicId: string }>  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const accountId = (await params).id;
    const publicId = decodeURIComponent((await params).publicId);
    const body = await req.json();
    const { newPublicId, tags, context } = body;

    // Verify ownership
    const { exists, authorized } = await verifyOwnership(accountId, userId);

    if (!exists) {
      return NextResponse.json(
        { error: "Cloudinary account not found" },
        { status: 404 }
      );
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get account with credentials
    const account = await prisma.cloudinaryAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Get Cloudinary instance
    const cloudinary = getCloudinary(account);

    const updates: any = {};

    // Rename if new public_id provided
    if (newPublicId && newPublicId !== publicId) {
      const renameResult = await cloudinary.uploader.rename(
        publicId,
        newPublicId,
        { resource_type: "auto" }
      );
      updates.renamed = renameResult;
    }

    // Update tags
    if (tags !== undefined) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim());
      const tagResult = await cloudinary.uploader.add_tag(tagArray, [publicId], {
        resource_type: "auto",
      });
      updates.tags = tagResult;
    }

    // Update context/metadata
    if (context) {
      const contextResult = await cloudinary.uploader.add_context(context, [publicId], {
        resource_type: "auto",
      });
      updates.context = contextResult;
    }

    return NextResponse.json({
      message: "Asset updated successfully",
      updates,
    });
  } catch (error: any) {
    console.error("Error updating Cloudinary asset:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}