import { prisma } from "./prisma";

export async function updateUserActivity(userId: string) {
  if (!userId) return;

  try {
    const timestamp = new Date();
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastSeen: timestamp,
      },
    });
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
}
