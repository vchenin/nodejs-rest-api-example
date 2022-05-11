const Ajv = require('ajv').default
const ajv = new Ajv({ allErrors: true })

module.exports = {

    validate: async (input) => {

        const count = Number(input.count || 5)
        const offset = Number(input.offset || 0)
        const page = Number(input.page || 1)

        const schema = require('../schemas/pagination.json')
        const validate = ajv.compile(schema)

        const data = { count, offset, page }
        if (!validate(data)) {
            const fails = {}
            for (const err of validate.errors) {
                const prop = err.instancePath.slice(err.instancePath.indexOf('/') + 1)
                switch (prop) {
                    case 'count': fails[prop] = ['The count must be an positive integer.']; break
                    case 'page': fails[prop] = ['The page must be at least 1.']; break
                    default:
                        if (!fails[prop]) fails[prop] = []
                        fails[prop].push(`${prop}: ${err.message}`)
                }
            }
            return { fails }
        }

        return { data }
    }
}
