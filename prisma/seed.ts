import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
    },
  });

  console.log('Created users:');
  console.log(admin);
  console.log(user);

  // Create a test organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
    },
  });

  console.log('Created organization:');
  console.log(organization);

  // Add admin as an ADMIN member of the organization
  const adminMember = await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: admin.id,
      role: 'ADMIN',
      email: admin.email,
      name: 'Admin User',
    },
  });

  // Add user as a MEMBER of the organization
  const userMember = await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'MEMBER',
      email: user.email,
      name: 'Regular User',
    },
  });

  console.log('Created organization members:');
  console.log(adminMember);
  console.log(userMember);

  // Create some sample services
  const apiService = await prisma.service.upsert({
    where: { id: 'api-service' },
    update: {},
    create: {
      id: 'api-service',
      name: 'API Service',
      description: 'Our public API service',
      status: 'OPERATIONAL',
      organizationId: organization.id,
    },
  });

  const webService = await prisma.service.upsert({
    where: { id: 'web-service' },
    update: {},
    create: {
      id: 'web-service',
      name: 'Web Application',
      description: 'Our main web application',
      status: 'OPERATIONAL',
      organizationId: organization.id,
    },
  });

  const databaseService = await prisma.service.upsert({
    where: { id: 'database-service' },
    update: {},
    create: {
      id: 'database-service',
      name: 'Database Service',
      description: 'Our database infrastructure',
      status: 'OPERATIONAL',
      organizationId: organization.id,
    },
  });

  console.log('Created services:');
  console.log(apiService);
  console.log(webService);
  console.log(databaseService);

  console.log('Database seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 