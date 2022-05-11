const express = require('express')

const router = express.Router()

const Token = require('../models/Token')

router.get('/', async (req, res) => {
    const t = await Token.create(Token.requesterId(req), 40)

    res.json({
        success: Boolean(t),
        token: t
    })
})

module.exports = router
