const express = require('express')

const router = express.Router()

const Position = require('../models/Position')

router.get('/', async (req, res) => {
    const list = await Position.getMany()

    if (list?.length) {
        res.json({
            success: true,
            positions: list
        })
    } else {
        res.status(422).json({
            success: false,
            message: 'Positions not found'
        })
    }
})

module.exports = router
