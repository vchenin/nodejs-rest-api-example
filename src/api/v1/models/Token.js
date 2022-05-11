const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

module.exports = {

    create: async (requester, expiration_period = 10) => {
        try {

            const expires = new Date((new Date()).getTime() + expiration_period * 60 * 1000)
            const t_body = { requester, expires }
            const token = Buffer.from(JSON.stringify(t_body)).toString('base64')

            const result = await prisma.token.create({
                data: { token, expires }
            })

            return result?.token || null

        } catch (e) { console.error(e) }

        return null
    },

    removeObsolete: async () => {
        try {

            const result = await prisma.token.deleteMany({ where: { expires: { lte: new Date() } } })

            return result?.count

        } catch (e) { console.error(e) }

        return 0
    },

    requesterId: (req) => {
        const ip = req.header('x-forwarded-for') || req.socket.remoteAddress
        return `${ip}#${req.headers['user-agent']}`
    },

    revoke: async (token) => {
        try {

            const result = await prisma.token.delete({ where: { token } })

            return Boolean(result)

        } catch (e) { console.error(e) }

        return false
    },

    verify: async (token, requester) => {
        try {

            const result = await prisma.token.findUnique({
                where: { token }
            })
            if (!result) return false

            const t_body = JSON.parse(Buffer.from(token, 'base64').toString())

            return t_body.requester === requester && (new Date(t_body.expires)).getTime() > (new Date()).getTime()

        } catch (e) { console.error(e) }

        return false
    }
}
