const Utils = require('../utils.js')
const Command = require('./command.js')
const global = require('../global.js')

module.exports = class Play extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	usage(token) { return { usage: '`' + token + 'play`: Changes the \'game\' the bot is playing. Chosen randomly if none given', admin: true } }

	refresh()
	{
		this.statuses = global.db.get('statuses').value()
		this.adminRoles = global.db.get('adminRoles').value()
		this.adminRefusals = global.db.get('insufficientRole').value()
	}

	shouldCall(command) { return command.toLowerCase() == 'play' }
	call(message, params, client)
	{
		if(!this.adminRoles.includes(message.member.highestRole.name))
		{
			message.channel.send(Utils.getRandom(this.adminRefusals), message.channel, message.member)
			return
		}
		let game = params.length > 1 ? { type: "PLAYING", content: message.content.substring(params[0].length + 1) } : Utils.getRandom(this.statuses)
		client.user.setPresence({ status: 'online', game: { name: game.content, type: game.type } })
		message.channel.send(`Now ${game.type.toLowerCase()} '${game.content}'`)
	}
}
