const Utils = require('../utils.js')

module.exports = class Play
{
	constructor(db) { this.db = db }
	refresh() { }

	shouldCall(command) { return command.toLowerCase() == 'play' }
	call(sender, channel, params, client) {  }
}
