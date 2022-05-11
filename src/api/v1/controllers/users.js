const express = require('express')

const router = express.Router()

const Token = require('../models/Token')
const Pagination = require('../models/Pagination')
const User = require('../models/User')

const auth = async (req, res, next) => {
    if (await Token.verify(req.headers.token, Token.requesterId(req))) {
        next()
    } else {
        res.status(401).json({
            success: false,
            message: 'The token expired or invalid.'
        })
    }
}

router.post('/', auth, async (req, res) => {
    const validation = await User.validate(req.body, req.files)

    if (validation.fails) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            fails: validation.fails
        })
    }

    const result = await User.create(validation.data)

    if (result.id) {
        await Token.revoke(req.headers.token)

        res.json({
            success: true,
            user_id: result.id,
            message: 'New user successfully registered'
        })

    } else {
        return res.status(result.status).json({
            success: false,
            message: result.message
        })
    }
})

router.put('/:id', auth, async (req, res) => {
    const valid_id = User.validateId(req.params.id)
    if (valid_id.fails) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            fails: valid_id.fails
        })
    }

    const validation = await User.validate(req.body, req.files)

    if (validation.fails) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            fails: validation.fails
        })
    }

    const result = await User.update(valid_id.data, validation.data)

    if (result.id) {
        await Token.revoke(req.headers.token)

        res.json({
            success: true,
            message: 'User info successfully updated'
        })

    } else {
        return res.status(result.status).json({
            success: false,
            message: result.message,
            fails: result.fails || {}
        })
    }
})

router.get('/', async (req, res) => {
    const validation = await Pagination.validate(req.query)

    if (validation.fails) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            fails: validation.fails
        })
    }

    let { count, offset, page } = validation.data

    if (offset) {
        page = Math.ceil(offset / count) + 1
    } else {
        offset = count * (page - 1)
    }
    const total_users = await User.totalCount()
    const total_pages = Math.ceil(total_users / count)

    if (!total_pages) page = 0
    if (page > total_pages) {
        res.status(404).json({
            success: false,
            message: 'Page not found'
        })
    } else {
        res.json({
            success: true,
            page,
            total_pages,
            total_users,
            count,
            links: {
                next_url: page < total_pages ? `?page=${page + 1}&count=${count}` : null,
                prev_url: page > 1 ? `?page=${page - 1}&count=${count}` : null
            },
            users: await User.getMany({ count, offset })
        })
    }
})

router.get('/:id', async (req, res) => {
    const valid_id = User.validateId(req.params.id)
    if (valid_id.fails) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            fails: valid_id.fails
        })
    }
    const user = await User.getOne(valid_id.data)
    if (user) {
        res.json({
            success: true,
            user
        })
    } else {
        res.status(404).json({
            success: false,
            message: 'The user with the requested identifier does not exist',
            fails: { user_id: [ 'User not found' ] }
        })
    }
})

router.delete('/:id', auth, async (req, res) => {
    const valid_id = User.validateId(req.params.id)
    if (valid_id.fails) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            fails: valid_id.fails
        })
    }
    const result = await User.remove(valid_id.data)
    if (result) {
        await Token.revoke(req.headers.token)

        res.json({
            success: true,
            message: 'User info successfully removed'
        })
    } else {
        res.status(404).json({
            success: false,
            message: 'The user with the requested identifier does not exist',
            fails: { user_id: [ 'User not found' ] }
        })
    }
})

module.exports = router
