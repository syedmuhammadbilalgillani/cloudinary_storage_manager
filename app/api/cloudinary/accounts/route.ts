import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - List all Cloudinary accounts for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const accounts = await prisma.cloudinaryAccount.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        cloudName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching Cloudinary accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new Cloudinary account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, cloudName, apiKey, apiSecret } = body;

    // Validation
    if (!name || !cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Name, cloudName, apiKey, and apiSecret are required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Create account with encrypted credentials
    const account = await prisma.cloudinaryAccount.create({
      data: {
        name: name.trim(),
        cloudName: cloudName.trim(),
        apiKeyEncrypted: encrypt(apiKey),
        apiSecretEncrypted: encrypt(apiSecret),
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        cloudName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Cloudinary account created successfully",
        account,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating Cloudinary account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}