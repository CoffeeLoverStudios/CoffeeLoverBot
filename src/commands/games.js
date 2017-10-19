const Utils = require('../utils.js')
const global = require('../global.js')
const Command = require('./command.js')

module.exports = class Games extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh()
	{
		this.gamers = new Map()
		global.db.get('users').forEach(user => { if(user.games && user.games.length > 0) this.gamers.set(user.id, user.games) }).value()
	}

	shouldCall(command) { return command.toLowerCase() == 'games' }

	call(message, params)
	{
		if(params.length == 1)
		{
			// List all registered games
			let msg = '**Registered Games:**'
			this.gamers.forEach((games, id, map) => { games.forEach(game => msg += '\n - ' + game) })
			message.channel.send(msg)
		}
		else
		{
			// List games for user(s)
			let msg = ''
			for(var i = 1; i < params.length; i++)
			{
				let user = Utils.getUserByName(message.channel, params[i])
				if(user == undefined)
				{
					message.channel.send('User \'' + params[i] + '\' not found')
					continue
				}
				msg += (i > 1 ? '\n' : '') + '*Games for* **' + user.displayName + '**:'
				if(this.gamers.has(user.id))
					this.gamers.get(user.id).forEach(game => msg += '\n - ' + game)
				else
					msg += ' None registered'
			}
			if(msg)
				message.channel.send(msg)
		}
	}
}
