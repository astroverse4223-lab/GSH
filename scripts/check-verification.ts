import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkVerification() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ email: "countryboya20@gmail.com" }, { name: "Dave420" }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  console.log("User verification status:", users);
}

checkVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
