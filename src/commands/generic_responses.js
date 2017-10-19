const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')

module.exports = class GenericResponses extends Command
{
	constructor()
	{
		super()
		this.genericResponses = global.db.get('genericResponses').value()
	}

	refresh() { this.genericResponses = global.db.get('genericResponses').value() }

	gotMessage(message)
	{
		if(message.content.toLowerCase().includes('bot'))
			this.send(Utils.getRandom(this.genericResponses, message.channel), message.channel, message.member)
		if(message.content.toLowerCase().includes('omae wa moi shinderu'))
			message.channel.send('***NANI?!***')
	}
}
