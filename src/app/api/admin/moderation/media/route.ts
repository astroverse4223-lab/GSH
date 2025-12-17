import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Fetch all media uploads for moderation
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, reportsReceived: true },
  });
  return NextResponse.json(media);
}

export async function DELETE(request: Request) {
  const { mediaId } = await request.json();
  await prisma.media.delete({ where: { id: mediaId } });
  return NextResponse.json({ success: true });
}
