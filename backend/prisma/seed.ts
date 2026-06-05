import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      passwordHash,
      storageLimit: BigInt(2 * 1024 * 1024 * 1024), // 2 GB
    },
  });

  const rootFolder = await prisma.folder.create({
    data: {
      name: 'Documents',
      userId: user.id,
    },
  });

  await prisma.folder.create({
    data: {
      name: 'Photos',
      parentId: rootFolder.id,
      userId: user.id,
    },
  });

  console.log('Seed completed:', { userId: user.id, rootFolderId: rootFolder.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
