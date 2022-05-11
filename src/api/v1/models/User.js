const { PrismaClient } = require('@prisma/client')
const Ajv = require('ajv').default
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const prisma = new PrismaClient()
const ajv = new Ajv({ allErrors: true })

module.exports = {

    create: async (data) => {
        try {

            const user = await prisma.user.create({ data })

            return user

        } catch (e) {
            console.error(e)
            switch (e.code) {
                case 'P2002': return { status: 409, message: 'User with this phone or email already exist' }
            }
        }

        return { status: 500, message: 'Internal Server Error' }
    },

    getMany: async (opts = {}) => {
        const { count = 0, offset = 0 } = opts

        try {

            const users = await prisma.user.findMany({
                skip: offset,
                take: count,
                include: { position: true }
            })

            return users.map(user => { user.position = user.position.name; return user })

        } catch (e) { console.error(e) }

        return []
    },

    getOne: async (id) => {
        try {

            const user = await prisma.user.findUnique({
                where: { id },
                include: { position: true }
            })

            if (user) user.position = user.position.name

            return user

        } catch (e) { console.error(e) }

        return null
    },

    remove: async (id) => {
        try {

            const result = await prisma.user.delete({ where: { id } })

            if (result?.photo) {
                await module.exports.removePhoto(result.photo)
            }

            return result

        } catch (e) { console.error(e) }

        return false
    },

    removePhoto: async (filepath) => {
        try {

            const dirpath = path.join(process.cwd(), 'public', 'images', 'users')
            const filename = path.basename(filepath)

            if (filename !== 'avatar.jpg') {
                fs.unlinkSync(path.join(dirpath, filename))
            }

            return true

        } catch (e) { console.error(e) }

        return false
    },

    savePhoto: async (file, opts = {}) => {
        try {

            const { width = 70, height = 70 } = opts
            const photo = sharp(file.data)
            const metadata = await photo.metadata()
            const filename = `${file.md5}.jpg`
            const dirpath = path.join(process.cwd(), 'public', 'images', 'users')
            await photo
                .extract({
                    left: Math.floor(metadata.width / 2 - width / 2),
                    top: Math.floor(metadata.height / 2 - height / 2),
                    width,
                    height
                })
                .toFile(path.join(dirpath, filename))

            return `/images/users/${filename}`

        } catch (e) { console.error(e) }

        return '/images/users/avatar.jpg'
    },

    totalCount: async () => {
        try {

            const result = await prisma.user.count()

            return result

        } catch (e) { console.error(e) }

        return 0
    },

    update: async (id, data) => {
        try {

            const user = await prisma.user.update({ where: { id }, data })

            return user

        } catch (e) {
            console.error(e)
            switch (e.code) {
                case 'P2002': return { status: 409, message: 'User with this phone or email already exist' }
                case 'P2025': return {
                    status: 404,
                    message: 'The user with the requested identifier does not exist',
                    fails: { user_id: [ 'User not found' ] }
                }
            }
        }

        return { status: 500, message: 'Internal Server Error' }
    },

    validate: async (input, files) => {
        let { name = '', email = '', phone = '', position_id = 0, photo_path = '' } = input

        const { photo } = files || {}

        let schema = require('../schemas/user-photo.json')
        let validate = ajv.compile(schema)

        if (validate(photo)) {

            photo_path = await module.exports.savePhoto(photo)

        } else if (!photo_path) {

            const fails = { photo: ['Image is invalid.'] }
            for (const err of validate.errors) {
                const prop = err.instancePath.slice(err.instancePath.indexOf('/') + 1)
                switch (prop) {
                    case 'size':
                        if (err.keyword === 'maximum')
                            fails.photo.push(`The photo may not be greater than ${err.params.limit / 1024 ** 2} Mbytes.`)
                        break
                }
            }

            return { fails }
        }

        schema = require('../schemas/user.json')
        validate = ajv.compile(schema)

        const data = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.replace(/[^0-9]/g, ''),
            position_id: Number(position_id),
            photo: photo_path
        }

        if (!validate(data)) {
            const fails = {}
            for (const err of validate.errors) {
                const prop = err.instancePath.slice(err.instancePath.indexOf('/') + 1)
                switch (prop) {
                    case 'name': fails[prop] = ['The name must be at least 2 characters.']; break
                    case 'email': fails[prop] = ['The email must be a valid email address.']; break
                    case 'phone': fails[prop] = ['The phone field is required and should start with country code.']; break
                    case 'position_id': fails[prop] = ['The position id must be an positive integer.']; break
                    case 'photo': fails[prop] = ['Image is invalid.']; break
                    default:
                        if (!fails[prop]) fails[prop] = []
                        fails[prop].push(`${prop}: ${err.message}`)
                }
            }
            return { fails }
        }

        return { data }
    },

    validateId: (id) => {
        const data = Number(id)
        if (isNaN(data) || data < 1) {
            const fails = {}
            fails['user_id'] = [ 'The user id must be an positive integer.' ]
            return { fails }
        }
        return { data }
    }
}
