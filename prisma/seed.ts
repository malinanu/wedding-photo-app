import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a sample event
  const event = await prisma.event.upsert({
    where: { id: 'default-event-id' },
    update: {},
    create: {
      id: 'default-event-id',
      name: 'Sarah & John Wedding',
      description: 'A beautiful celebration of love',
      date: new Date('2024-12-25'),
      venue: 'Grand Ballroom Hotel',
      organizerName: 'Wedding Organizer',
      organizerEmail: 'organizer@example.com',
      organizerPhone: '+1234567890',
      passcode: '1234',
      isActive: true,
      maxUploadSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      storageQuota: BigInt(10 * 1024 * 1024 * 1024), // 10GB
      storageUsed: BigInt(0),
    },
  })

  // Create sample tables
  const tables = await Promise.all([
    prisma.table.upsert({
      where: { qrCode: 'table-1-qr' },
      update: {},
      create: {
        eventId: event.id,
        tableNumber: '1',
        tableName: 'Family Table',
        qrCode: 'table-1-qr',
      },
    }),
    prisma.table.upsert({
      where: { qrCode: 'table-2-qr' },
      update: {},
      create: {
        eventId: event.id,
        tableNumber: '2',
        tableName: 'Friends Table',
        qrCode: 'table-2-qr',
      },
    }),
  ])

  // Create an admin user
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: '$2a$10$K7L1OJ0TfPIoAUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // You should hash a real password
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('Event ID:', event.id)
  console.log('Event Passcode:', '1234')
  console.log('Tables created:', tables.length)
  console.log('Admin email:', admin.email)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
