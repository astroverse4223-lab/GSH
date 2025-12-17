const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      password: true
    }
  });
  console.log("Users:", users);
}

checkUsers().finally(() => prisma.$disconnect());
