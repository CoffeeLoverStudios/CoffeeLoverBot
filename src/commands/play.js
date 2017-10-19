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
		let game = Utils.getRandom(this.statuses)
		if(params.length > 1)
			game = message.content.substring(params[0].length + 1)
		client.user.setGame(game)
		message.channel.send('Now playing \'' + game + '\'')
	}
}
