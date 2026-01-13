import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinary } from "@/lib/cloudinary";

// Helper to verify ownership
async function verifyOwnership(accountId: string, userId: string) {
  const account = await prisma.cloudinaryAccount.findUnique({
    where: { id: accountId },
    select: { ownerId: true },
  });

  if (!account) {
    return { exists: false, authorized: false, account: null };
  }

  return {
    exists: true,
    authorized: account.ownerId === userId,
    account,
  };
}

// GET - List all assets in a Cloudinary account
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const searchParams = req.nextUrl.searchParams;
    const folder = searchParams.get("folder") || "";
    const maxResults = parseInt(searchParams.get("max_results") || "50");
    const nextCursor = searchParams.get("next_cursor") || "";

    // Verify ownership
    const { exists, authorized, account } = await verifyOwnership(
      accountId,
      userId
    );

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

    // Get full account with credentials
    const fullAccount = await prisma.cloudinaryAccount.findUnique({
      where: { id: accountId },
    });

    if (!fullAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Get Cloudinary instance
    const cloudinary = getCloudinary(fullAccount);

    // Build options for resources API
    const options: any = {
      max_results: maxResults,
      type: "upload" as const,
    };

    if (folder) {
      options.prefix = folder;
    }

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    // Use resources API instead of search API
    const result = await cloudinary.api.resources(options);

    return NextResponse.json({
      resources: result.resources || [],
      next_cursor: result.next_cursor || "",
      total_count: result.total_count || 0,
    });
  } catch (error: any) {
    console.error("Error listing Cloudinary assets:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}