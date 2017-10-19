const Utils = require('../utils.js')
const global = require('../global.js')

module.exports = class Command
{
	constructor() {  }
	refresh() { }

	shouldCall(command) { return false }
	call(message, params, client) { }

	gotMessage(message) { }
	send(message, channel, user) { if(user) { channel.send(Utils.process(message, user)) } else channel.send(message) }
}
