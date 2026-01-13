import { authOptions } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Helper function to verify ownership
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

// GET - Get a specific Cloudinary account by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const accountId = (await params).id;

    const { exists, authorized } = await verifyOwnership(accountId, userId);

    if (!exists) {
      return NextResponse.json(
        { error: "Cloudinary account not found" },
        { status: 404 }
      );
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const account = await prisma.cloudinaryAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        name: true,
        cloudName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching Cloudinary account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a Cloudinary account
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const accountId = (await params).id;
    const body = await req.json();
    const { name, cloudName, apiKey, apiSecret } = body;

    // Verify ownership
    const { exists, authorized } = await verifyOwnership(accountId, userId);

    if (!exists) {
      return NextResponse.json(
        { error: "Cloudinary account not found" },
        { status: 404 }
      );
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data object
    const updateData: {
      name?: string;
      cloudName?: string;
      apiKeyEncrypted?: string;
      apiSecretEncrypted?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (cloudName !== undefined) {
      updateData.cloudName = cloudName.trim();
    }

    if (apiKey !== undefined) {
      updateData.apiKeyEncrypted = encrypt(apiKey);
    }

    if (apiSecret !== undefined) {
      updateData.apiSecretEncrypted = encrypt(apiSecret);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update the account
    const updatedAccount = await prisma.cloudinaryAccount.update({
      where: { id: accountId },
      data: updateData,
      select: {
        id: true,
        name: true,
        cloudName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Cloudinary account updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating Cloudinary account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a Cloudinary account
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the account
    await prisma.cloudinaryAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({
      message: "Cloudinary account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Cloudinary account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
