const Command = require('./command.js')
const Utils = require('../utils.js')

module.exports = class Poem extends Command
{
	constructor(db)
	{
		super(db)
		this.refresh()
	}
	refresh() { this.poems = this.db.get('poems').value() }
	shouldCall(command) { return command.toLowerCase() == 'poem' }
	call(sender, channel, params) {	channel.send(Utils.getRandom(this.poems)) }
}
