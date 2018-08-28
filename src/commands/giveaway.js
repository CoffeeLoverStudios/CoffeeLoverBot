const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')
const Casino = require('./casino.js')

module.exports = class GiveAway extends Command
{
	refresh() { this.winResponses = global.db.get('giveawayWin').value() }

	usage(token)
	{
		return [
			{ usage: `\`${token}giveaway <role> <reward name>\`: Does a giveaway, choosing a random user from the given role`, admin: true },
			{ usage: `\`${token}giveloli <amount> <user>\`: Gives lolis to someone`, admin: true},
			{ usage: `\`${token}givelolirandom <amount> <role>\`: Gives lolis to a random user in the role`, admin: true}
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'giveaway' || command.toLowerCase().startsWith('giveloli') }

	call(message, params)
	{
		if(!Utils.isAdmin(message.member))
		{
			Utils.send(message.channel, Utils.process(Utils.getRandom(global.db.get('insufficientRole').value()), message.member, message.channel))
			return
		}
		if(params[0].toLowerCase() == "giveaway")
		{
			if(params.length < 3)
			{
				Utils.send(message.channel, "Usage: `giveaway <role> <reward_name>`")
				return // get the hell outta there
			}
			let reward = params.slice(2).join(' ')
			let randomUser = Utils.getRandomUserFromRole(message.channel, params[1])
			if(!randomUser)
				Utils.send(message.channel, "No user could be found")
			else
				Utils.send(message.channel, Utils.process(Utils.getRandom(this.winResponses, message.channel), message.member, message.channel, [ "<@" + randomUser.id + ">", reward ]))
		}
		else if(params[0].toLowerCase() == 'giveloli' || params[0].toLowerCase() == 'givelolirandom')
		{
			if(params.length < 3)
			{
				Utils.send(message.channel, usage(global.tokens.command))
				return
			}
			let amount = parseInt(params[1])
			let search = message.content.substring(params[0].length + params[1].length + 2)
			let user = params[0].includes('random') ? Utils.getRandomUserFromRole(message.channel, search) : Utils.getUserByName(message.guild, search)
			if(!user || !amount)
			{
				Utils.send(message.channel, 'User not found or amount invalid')
				return
			}

			let casino = global.getCommand('Casino')
			if(!casino)
			{
				Utils.send(message.channel, 'Couldn\'t find the casino command!')
				return
			}
			casino.changeLolis(user.id, amount)
			Utils.send(message.channel, Utils.process(`\$\{username\} is now ${amount} lolis richer`, user, message.channel))
		}
	}
};
