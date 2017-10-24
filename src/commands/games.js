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

	usage(token)
	{
		return [
			'`' + token + 'games`: Lists registered games. If usernames are supplied then shows their registered games, otherise shows *all* registered games\n(*registered being someone on the server has played it*)',
			'`' + token + 'currentgames`: Lists users and the game they\'re playing'
		]
	}

	refresh()
	{
		this.gamers = new Map()
		global.db.get('users').forEach(user => { if(user.games && user.games.length > 0) this.gamers.set(user.id, user.games) }).value()
	}

	shouldCall(command) { return command.toLowerCase() == 'games' || command.toLowerCase() == 'currentgames'}

	call(message, params)
	{
		let msg = ''
		if(params[0].toLowerCase() == 'currentgames')
		{
			msg = '***Games currently being played:***'
			global.db.get('users').forEach(user =>
			{
				if(user.currentlyPlaying && user.currentlyPlaying != '')
					msg += '\n - **' + user.name + '** is playing \'**' + user.currentlyPlaying + '**\''
			}).value()
			message.channel.send(msg)
			return
		}

		if(params.length == 1)
		{
			// List all registered games
			msg = '**Registered Games:**'
			this.gamers.forEach((games, id, map) => { games.forEach(game => msg += '\n - ' + game) })
			message.channel.send(msg)
		}
		else
		{
			// List games for user(s)
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
