const Utils = require('../utils.js')
const global = require('../global.js')
const Command = require('./command.js')

let technologies = [
	'NodeJS (https://nodejs.org)',
    'Discord.js (https://discord.js.org)',
    'LowDB (https://github.com/typicode/lowdb)'
]

module.exports = class About extends Command
{
	usage(token) { return `\`${token}about\`: Returns information about the bot` }

	shouldCall(command) { return command.toLowerCase() == 'about' }

	call(message, params)
	{
		let msg = '*CoffeeLoverBot* (by `CoffeeLover Studios`)\n*Technologies*:\n'
		this.technologies.forEach((tech) => { msg += '\t' + tech + '\n' })
		if(global.tokens.cleverbot)
		{
			msg += '\n*Enabled*:\n'
			msg += '\t- Cleverbot'
		}
		Utils.send(message.channel, msg)
	}
}
