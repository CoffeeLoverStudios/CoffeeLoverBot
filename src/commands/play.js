const Utils = require('../utils.js')
const Command = require('./command.js')

module.exports = class Play extends Command
{
	constructor(db)
	{
		super()
		this.db = db
		this.refresh()
	}
	refresh()
	{
		this.statuses = this.db.get('statuses').value()
		this.adminRoles = this.db.get('adminRoles').value()
		this.adminRefusals = this.db.get('insufficientRole').value()
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
		{
			game = ''
			for(var i = 1; i < params.length; i++)
				game += params[i] + (i < params.length - 1 ? ' ' : '')
		}
		client.user.setGame(game)
		message.channel.send('Now playing \'' + game + '\'')
	}
}
