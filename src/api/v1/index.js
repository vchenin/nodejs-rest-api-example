const api = require('express').Router()

api.use('/positions', require('./controllers/positions'))
api.use('/token', require('./controllers/token'))
api.use('/users', require('./controllers/users'))

api.use(function (req, res, next) {
    res.status(404).json({
        success: false,
        message: 'Page not found'
    })
})
api.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    })
})

module.exports = api
