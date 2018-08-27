const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')
const Casino = require('./casino.js')

module.exports = class GiveAway extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh() { this.winResponses = global.db.get('giveawayWin').value() }

	usage(token)
	{
		return [
			{ usage: `\`${token}giveaway <role> <reward name>\`: Does a giveaway, choosing a random user from the given role`, admin: true },
			{ usage: `\`${token}giveloli <amount> <user>\`: Gives lolis to someone`, admin: true},
			{ usage: `\`${token}givelolirandom <amount> <role>\`: Gives lolis to a random user in the role`, admin: true}
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'giveaway' ||
								 command.toLowerCase().startsWith('giveloli')
								}

	call(message, params)
	{
		if(params[0].toLowerCase() == "giveaway")
		{
			if(params.length < 3)
			{
				message.channel.send("Usage: `giveaway <role> <reward_name>`")
				return // get the hell outta there
			}
			let reward = params.slice(2).join(' ')
			let randomUser = Utils.getRandomUserFromRole(message.channel, params[1])
			if(!randomUser)
				message.channel.send("No user could be found")
			else
				message.channel.send(Utils.process(Utils.getRandom(this.winResponses, message.channel), message.member, message.channel, [ "<@" + randomUser.id + ">", reward ]))
		}
		else if(params[0].toLowerCase() == 'giveloli' || params[0].toLowerCase() == 'givelolirandom')
		{
			if(params.length < 3)
			{
				message.channel.send(usage(global.tokens.command))
				return
			}
			let amount = parseInt(params[1])
			let search = message.content.substring(params[0].length + params[1].length + 2)
			let user = params[0].includes('random') ? Utils.getRandomUserFromRole(message.channel, search) : Utils.getUserByName(message.guild, search)
			if(!user || !amount)
			{
				message.channel.send('User not found or amount invalid')
				return
			}
			Casino.giveLolis(user, amount)
			message.channel.send(Utils.process(`\$\{username\} is now ${amount} lolis richer`, user, message.channel))
		}
	}
};
