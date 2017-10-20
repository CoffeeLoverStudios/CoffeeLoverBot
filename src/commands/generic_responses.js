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
			message.channel.send(Utils.process(Utils.getRandom(this.genericResponses, message.channel), message.member, message.channel))
		if(message.content.toLowerCase().includes('omae wa moi shinderu'))
			message.channel.send('***NANI?!***')
	}
}
