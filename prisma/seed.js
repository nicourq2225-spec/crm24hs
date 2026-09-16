const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Sembrando base de datos...')

  // Crear usuarios
  const nu = await prisma.user.upsert({
    where: { id: '1' },
    update: {},
    create: { id: '1', name: 'NU', initials: 'NU', role: 'SELLER' },
  })

  const kc = await prisma.user.upsert({
    where: { id: '2' },
    update: {},
    create: { id: '2', name: 'KC', initials: 'KC', role: 'SELLER' },
  })

  const nc = await prisma.user.upsert({
    where: { id: '3' },
    update: {},
    create: { id: '3', name: 'NC', initials: 'NC', role: 'SELLER' },
  })

  const admin = await prisma.user.upsert({
    where: { id: 'admin' },
    update: {},
    create: { id: 'admin', name: 'Administrador', initials: 'AD', role: 'ADMIN' },
  })

  // Crear Clientes de ejemplo
  const customer1 = await prisma.customer.create({
    data: { name: 'Juan Pérez', phone: '351 123 4567', origin: 'WhatsApp' },
  })

  const customer2 = await prisma.customer.create({
    data: { name: 'Carlos Gómez', phone: '351 987 6543', origin: 'Stand' },
  })

  const customer3 = await prisma.customer.create({
    data: { name: 'María López', phone: '351 456 7890', origin: 'Instagram' },
  })

  // Crear oportunidades (una de hoy, una atrasada)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 2)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await prisma.opportunity.create({
    data: {
      customerId: customer1.id,
      userId: nu.id,
      productInterest: 'Kit de cámaras',
      productModel: 'H9C',
      budgetValue: 180000,
      paymentMethod: '3 cuotas',
      status: 'Presupuesto enviado',
      nextFollowUp: today,
      hasAlarm: 'No sabe',
      alarmOpportunity: 'Potencial',
    }
  })

  await prisma.opportunity.create({
    data: {
      customerId: customer2.id,
      userId: kc.id,
      productInterest: 'Alarma',
      status: 'Negociación',
      nextFollowUp: yesterday,
      hasAlarm: 'No',
      alarmOpportunity: 'Ofrecer',
    }
  })

  await prisma.opportunity.create({
    data: {
      customerId: customer3.id,
      userId: nc.id,
      productInterest: 'Cámara',
      productModel: 'H6C',
      status: 'Seguimiento',
      nextFollowUp: tomorrow,
    }
  })

  console.log('Datos de prueba insertados con éxito.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
