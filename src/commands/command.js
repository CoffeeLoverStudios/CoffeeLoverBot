const Utils = require('../utils.js')

module.exports = class Command
{
	constructor(db) { this.db = db }
	refresh() { }

	shouldCall(command) { return false }
	call(message, params, client) { }

	gotMessage(message) { }
	send(message, channel, user) { if(user) { channel.send(Utils.process(message, user)) } else channel.send(message) }
}
