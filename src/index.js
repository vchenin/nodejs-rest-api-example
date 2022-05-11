const express = require('express')
const upload = require('express-fileupload')
const path = require('path')

const app = express()

const port = process.env.PORT || 3000

app.use(upload())
app.use(express.json())
app.use(express.static(path.join(process.cwd(), 'public')))
app.use('/api/v1', require('./api/v1'))

const server = app.listen(port, () => {
    console.log(`Server ready at: http://localhost:${port}`)
})
