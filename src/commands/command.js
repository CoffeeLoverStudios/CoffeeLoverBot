const Utils = require('../utils.js')
const global = require('../global.js')

module.exports = class Command
{
	// Called when command created
	constructor() { this.refresh() }

	// Called when data should be reloaded
	refresh() { }

	// Deconstructor, used when the command is unloaded
	save() { }

	// Returns the usage for the command, usually in the format of
	//		`\'${token}command <option>\': general description`
	usage(token) { return '' }

	// Returns boolean for whether `call` should be run
	shouldCall(command) { return false }
	call(message, params, client) { }

	// Called whenever any message is received
	gotMessage(message) { }
}
