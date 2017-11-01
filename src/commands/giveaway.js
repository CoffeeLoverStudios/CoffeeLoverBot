const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')

module.exports = class GiveAway extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh()
	{
		this.winResponses = global.db.get('giveawayWin').value()
	}

	usage(token) { return { usage: "`" + token + "giveaway <role> <name>`: Does a giveaway, choosing a random user from the given role", admin: true } }

	shouldCall(command) { return command.toLowerCase() == "giveaway" }

	call(message, params)
	{
		if(params[0].toLowerCase() != "giveaway")
			return
		if(params.length != 3)
		{
			message.channel.send("Usage: `giveaway <role> <name>`")
			return // get the hell outta there
		}
		let randomUser = Utils.getRandomUserFromRole(message.channel, params[1])
		if(randomUser == undefined)
			message.channel.send("That role is not found")
		else
			message.channel.send(Utils.process(Utils.getRandom(this.winResponses, message.channel), message.member, message.channel, [ "<@" + randomUser.id + ">", params[2] ]))
	}

	gotMessage(message) { }
};
