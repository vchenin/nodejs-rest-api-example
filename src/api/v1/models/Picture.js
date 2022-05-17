const tinify = require('tinify')

tinify.key = process.env.TINIFY_KEY

module.exports = {

    optimize: async (data) => {
        try {
            data = await tinify.fromBuffer(data).toBuffer()
        } catch (e) { console.error(e) }

        return data
    }
}
