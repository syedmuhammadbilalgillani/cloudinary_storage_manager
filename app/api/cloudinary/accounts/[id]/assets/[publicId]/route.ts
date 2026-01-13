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

// Helper to determine resource type
async function getResourceType(
  cloudinary: any,
  publicId: string
): Promise<"image" | "video" | "raw"> {
  // Try to get resource info to determine type
  const resourceTypes: ("image" | "video" | "raw")[] = ["image", "video", "raw"];

  for (const type of resourceTypes) {
    try {
      await cloudinary.api.resource(publicId, { resource_type: type });
      return type;
    } catch (error: any) {
      // Continue to next type if not found
      if (error.http_code !== 404) {
        throw error;
      }
    }
  }

  // Default to image if we can't determine
  return "image";
}

// DELETE - Delete asset from Cloudinary
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; publicId: string }> }
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
    const { id, publicId: encodedPublicId } = await params;
    const publicId = decodeURIComponent(encodedPublicId);

    // Verify ownership
    const { exists, authorized } = await verifyOwnership(id, userId);

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
      where: { id: id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Get Cloudinary instance
    const cloudinary = getCloudinary(account);

    // Determine resource type
    const resourceType = await getResourceType(cloudinary, publicId);

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "not found") {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Asset deleted successfully",
      result: result.result,
    });
  } catch (error: any) {
    console.error("Error deleting Cloudinary asset:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}