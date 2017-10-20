const Utils = require('../utils.js')
const global = require('../global.js')

module.exports = class Command
{
	constructor() {  }
	refresh() { }
	usage() { }

	shouldCall(command) { return false }
	call(message, params, client) { }

	gotMessage(message) { }
}
