/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const defaults = [
    { destination: "Likasi (before peage)", rateUsdPerCbm: 50 },
    { destination: "Likasi (after peage)", rateUsdPerCbm: 55 },
    { destination: "Kambove", rateUsdPerCbm: 65 },
    { destination: "kolwezi", rateUsdPerCbm: 75 },
    { destination: "Mokambo", rateUsdPerCbm: 65 },
    { destination: "Komoah", rateUsdPerCbm: 95 },
    { destination: "Fungurme", rateUsdPerCbm: 60 },
    { destination: "Luwisha", rateUsdPerCbm: 35 },
    { destination: "Lopoto", rateUsdPerCbm: 35 },
    { destination: "Kisanda", rateUsdPerCbm: 45 },
    { destination: "Kisamfu", rateUsdPerCbm: 65 },
    { destination: "kipoi", rateUsdPerCbm: 40 },
    { destination: "Kawama", rateUsdPerCbm: 15 },
    { destination: "Lubumbashi", rateUsdPerCbm: 15 },
    { destination: "Kibolve", rateUsdPerCbm: 65 },
  ];

  for (const item of defaults) {
    await prisma.transportRate.upsert({
      where: { destination: item.destination },
      update: { rateUsdPerCbm: item.rateUsdPerCbm },
      create: item,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });





