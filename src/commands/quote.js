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

	usage(token)
	{
		return [
			'`' + token + 'quote`: Registers a quote with the bot to be one of the many responses to a sentence including the word *bot*',
			'`' + token + 'userquote <username>`: Saves the last message of a user to their list-o-quotes',
			'`' + token + 'listquotes`, `!quotes`: Shows the quotes for all the users supplied, or the bot\'s responses if none were given'
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'quote' ||
								 command.toLowerCase() == 'quotes' ||
								 command.toLowerCase() == 'userquote' ||
							 	 command.toLowerCase() == 'listquotes' }

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
		else if(params[0].toLowerCase() == 'listquotes' || params[0].toLowerCase() == 'quotes')
		{
			let msg = ''
			if(params.length == 1)
			{
				msg = '**Quotes**:'
				global.db.get('genericResponses').forEach(quote => msg += '\n - ' + quote).value()
			}
			else
			{
				for(let i = 1; i < params.length; i++)
				{
					let userID = Utils.getUserID(message.channel, params[i])
					if(userID == 0)
					{
						msg += '\nCould not find user \'' + params[i] + '\''
						continue
					}
					let user = global.db.get('users').find({ id: userID }).value()
					msg += (msg == '' ? '' : '\n') + 'Quotes for **' + user.name + '**:'
					if(user.quotes.length == 0)
						msg += ' None\n'
					else
					{
						user.quotes.forEach(quote => msg += '\n - ' + quote)
						msg += '\n'
					}
				}
			}
			if(msg != '')
				message.channel.send(msg)
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
