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
			let member = Utils.getUserByName(message.channel, params[1])
			let lastMessage = member.lastMessage
			if(lastMessage)
			{
				global.db.get('users').find({ id: member.id }).get('quotes').push(lastMessage.content).write()
				message.channel.send('Saved "' + lastMessage.content + '"')
			}
			else
				message.channel.send('Couldn\'t find a quote from that user, maybe get them to send it again?')
		}
	}
}
