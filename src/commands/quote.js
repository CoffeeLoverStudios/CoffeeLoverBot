const Utils = require('../utils.js')
const Command = require('./command.js')
const global = require('../global.js')

module.exports = class Quote extends Command
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

	shouldCall(command) { return command.toLowerCase() == 'quote' || command.toLowerCase() == 'userquote'}

	call(message, params, client)
	{
		if(params[0].toLowerCase() == 'quote')
		{
			if(params.length == 1)
			{
				message.channel.send('Usage: quote <some words here>')
				return
			}
			global.db.get('genericResponses').push(message.content.substring('quote'.length + 1)).write()
		}
		else if(params[0].toLowerCase() == 'userquote')
		{
			if(params.length != 2)
			{
				message.channel.send('Usage: userquote <username>\n(*if username contains spaces, quote it. e.g. "Coffee Bot")')
				return
			}
			let userID = Utils.getUserID(params[1])

		}
	}
}
