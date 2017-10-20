const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')

module.exports = class Poem extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}
	refresh() { this.poems = global.db.get('poems').value() }

	usage() { return '`!poem`: Sends you a nice poem :)' }	

	shouldCall(command) { return command.toLowerCase() == 'poem' }
	call(message) {	message.channel.send(Utils.getRandom(this.poems, message.channel)) }
}
