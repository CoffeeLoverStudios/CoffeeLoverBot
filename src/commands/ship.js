const Utils = require('../utils.js')
const Command = require('./command.js')

module.exports = class Ship extends Command
{
	usage(token) { return '`' + token + 'ship <username> <username>`: Ships them peeps' }

	shouldCall(command) { return command.toLowerCase() == 'ship' }
	call(message, params)
	{
		if(params.length != 3)
		{
			message.channel.send(usage());
			return;
		}
		if(Utils.getUserByName(message.channel, params[1]))
			params[1] = Utils.getUserByName(message.channel, params[1]).displayName
		if(Utils.getUserByName(message.channel, params[2]))
			params[2] = Utils.getUserByName(message.channel, params[2]).displayName
		params[1] = Utils.replaceAll(params[1], /\s/g, '')
		params[2] = Utils.replaceAll(params[2], /\s/g, '')
		let user1 = [ params[1].substring(0, params[1].length / 2), params[1].substring(params[1].length / 2) ]
		let user2 = [ params[2].substring(0, params[2].length / 2), params[2].substring(params[2].length / 2) ]

		message.channel.send('\*Shipping \'' + params[1] + '\'x\'' + params[2] + '\'...\*\nShip Names: *' + (user1[0] + user2[1]) + ', ' + (user2[0] + user1[1]) + '*')
	}
}
