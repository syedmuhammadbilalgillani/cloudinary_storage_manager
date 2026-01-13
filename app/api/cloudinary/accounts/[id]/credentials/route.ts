import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Get decrypted credentials (use with caution, only for testing/validation)
export async function GET(
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

    const account = await prisma.cloudinaryAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        ownerId: true,
        apiKeyEncrypted: true,
        apiSecretEncrypted: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Cloudinary account not found" },
        { status: 404 }
      );
    }

    if (account.ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Decrypt credentials
    const apiKey = decrypt(account.apiKeyEncrypted);
    const apiSecret = decrypt(account.apiSecretEncrypted);

    return NextResponse.json({
      id: account.id,
      apiKey,
      apiSecret,
      // Note: Only return credentials in development or for specific use cases
      // Consider adding additional security checks here
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}