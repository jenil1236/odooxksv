import { prisma } from "./prisma";

export async function logActivity(userId: string, action: string, details?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function createNotification(userId: string, title: string, message: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
