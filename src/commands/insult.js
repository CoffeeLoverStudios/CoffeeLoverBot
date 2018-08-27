const Utils = require('../utils.js')
const global = require('../global.js')
const Command = require('./command.js')

module.exports = class insult extends Command
{
	usage(token) { return '`' + token + 'insult <user>`: Insults the user, or the caller if none given' }

    shouldCall(command) { return command.toLowerCase() == 'insult' }

	call(message, params, client)
    {
		let insultObject = global.db.get('insults').value()
		if(params.length == 1)
			message.channel.send(Utils.process(insultObject.genericResponse, client, message.channel))
		else
		{
			let user = params[1].toLowerCase() == 'random' ? Utils.getRandomUserChannel(message.channel) : Utils.getUserByName(message.guild, params[1])
			if(!user)
				user = { displayName: params[1] }
			message.channel.send(Utils.process(
				Utils.getRandom(insultObject.otherResponses),
				client,
				message.channel,
				[ user.displayName ]
			))
		}
		let userID = params.length == 0 ? client.id : Utils.getUserID(message.channel, params[0])
    }
}
