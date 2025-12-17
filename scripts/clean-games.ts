import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete all existing games
  await prisma.gamePlayer.deleteMany({});
  await prisma.game.deleteMany({});

  console.log("Cleaned up existing games");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
