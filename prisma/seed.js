const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const USERS_CNT = 45

const NAMES = require('./mock-data/user-names')

const POSITIONS = [
    { name: 'Developer' },
    { name: 'DevOps' },
    { name: 'PM' },
    { name: 'Tester' }
]

fakeUser = (n) => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)]
    return {
        name,
        email: `${name.toLocaleLowerCase()}${n ? '.' + n : ''}@fake.mail`,
        phone: `380${(new Date()).getTime().toString().slice(-9)}`,
        position_id: Math.ceil(Math.random() * POSITIONS.length),
        photo: '/images/users/avatar.jpg'
    }
}

async function main() {

    for (let i = 1; i <= POSITIONS.length; i++) {
        const data = POSITIONS[i - 1]
        data.id = i
        await prisma.position.create({ data })
    }

    for (let i = 1; i <= USERS_CNT; i++) {
        await prisma.user.create({ data: fakeUser(i) })
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
