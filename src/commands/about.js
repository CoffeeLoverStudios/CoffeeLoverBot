const Command = require('./command.js')
const global = require('../global.js')

let technologies = []

module.exports = class About extends Command
{
	constructor()
	{
		super()
		technologies = global.db.get('technologies').value()
	}
	usage(token) { return '`' + token + 'about`: Returns information about the bot' }

	shouldCall(command) { return command.toLowerCase() == 'about' }

	call(message, params)
	{
		let msg = '*CoffeeLoverBot* (by `CoffeeLover Studios`)\n*Technologies*:\n'
		technologies.forEach((tech) => { msg += '\t' + tech + '\n' })
		message.channel.send(msg)
	}
}
