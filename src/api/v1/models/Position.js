const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

module.exports = {

    getMany: async () => {
        try {

            const list = await prisma.position.findMany()

            return list

        } catch (e) { console.error(e) }

        return []
    }
}
