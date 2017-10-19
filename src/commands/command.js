const Utils = require('../utils.js')

module.exports = class Command
{
	constructor(db) { this.db = db }
	refresh() { }

	shouldCall(command) { return false }
	call(sender, channel, params) { }

	gotMessage(message)
	{
		
	}

	send(message, channel, user) { if(user) { channel.send(Utils.process(message, user)) } else channel.send(message) }
}
