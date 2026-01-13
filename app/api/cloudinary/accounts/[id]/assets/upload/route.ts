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

// POST - Upload asset to Cloudinary
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>  }
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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const publicId = formData.get("public_id") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get Cloudinary instance
    const cloudinary = getCloudinary(account);

    // Upload options
    const uploadOptions: any = {
      resource_type: "auto" as const,
    };

    if (folder) {
      uploadOptions.folder = folder;
    }

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (tags) {
      uploadOptions.tags = tags.split(",").map((tag) => tag.trim());
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      asset: result,
    });
  } catch (error: any) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}