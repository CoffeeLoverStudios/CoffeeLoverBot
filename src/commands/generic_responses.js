const Command = require('./command.js')
const Utils = require('../utils.js')

module.exports = class GenericResponses extends Command
{
	constructor(db)
	{
		super(db)
		this.genericResponses = db.get('genericResponses').value()
	}

	refresh() { this.genericResponses = this.db.get('genericResponses').value() }

	gotMessage(message)
	{
		if(message.content.toLowerCase().includes('bot'))
			this.send(Utils.getRandom(this.genericResponses, message.channel), message.channel, message.member)
		if(message.content.toLowerCase().includes('omae wa moi shinderu'))
			message.channel.send('***NANI?!***')
	}
}
