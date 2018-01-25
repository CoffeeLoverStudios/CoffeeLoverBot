const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')

const BotRegex = /\bbot\b/gi

module.exports = class GenericResponses extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh()
	{
		this.genericResponses = global.db.get('genericResponses').value()
		this.approveResponses = global.db.get('approveResponses').value()
		this.disapproveResponses = global.db.get('disapproveResponses').value()
	}

	shouldCall(command) { return command.toLowerCase() == 'approve' || command.toLowerCase() == 'disapprove' }
	call(message, params)
	{
		if(params[0].toLowerCase() == 'approve')
			message.channel.send(Utils.process(Utils.getRandom(this.approveResponses, message.channel), message.member, message.channel))
		else if(params[0].toLowerCase() == 'disapprove')
			message.channel.send(Utils.process(Utils.getRandom(this.disapproveResponses, message.channel), message.member, message.channel))
	}

	usage(token)
	{
		return
		[
			'`' + token + 'approve`: Approves of the message',
			'`' + token + 'disapprove`: Disapproves of the message'
		]
	}

	gotMessage(message)
	{
		if(message.content.match(BotRegex))
			message.channel.send(Utils.process(Utils.getRandom(this.genericResponses, message.channel), message.member, message.channel))
		else if(message.content.toLowerCase().includes('omae wa moi shinderu'))
			message.channel.send('***NANI?!***')
		else
			return false
		return true
	}
}
