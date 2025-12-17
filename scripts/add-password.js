const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function addPasswordToUser() {
  try {
    // Hash a password for your account
    const password = "your_password_here"; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update your user account with the password
    const updatedUser = await prisma.user.update({
      where: {
        email: "countryboya20@gmail.com", // Your email
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log("✅ Password added to user account:", updatedUser.email);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addPasswordToUser();
