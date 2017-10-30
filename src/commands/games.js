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
			'`' + token + 'currentgames`: Lists users and the game they\'re playing',
			'`' + token + 'alias <add|remove> <game> <alias>`: When asking for games, switches the game name out for it\'s alias'
		]
	}

	refresh()
	{
		this.gamers = new Map()
		global.db.get('users').forEach(user => { if(user.games && user.games.length > 0) this.gamers.set(user.id, user.games) }).value()

		this.aliases = global.db.get('gameAliases').value()
	}

	shouldCall(command) { return 	command.toLowerCase() == 'games' ||
									command.toLowerCase() == 'currentgames' ||
									command.toLowerCase() == 'alias' }

	call(message, params)
	{
		let msg = ''
		if(params[0].toLowerCase() == 'currentgames')
		{
			msg = '*Games currently being played:*'
			global.db.get('users').forEach(user =>
			{
				if(user.currentlyPlaying && user.currentlyPlaying != '')
					msg += '\n - **' + user.name + '** is playing \'*' + user.currentlyPlaying + '*\''
			}).value()
			message.channel.send(msg)
			return
		}
		else if(params[0].toLowerCase() == 'alias')
		{
			if((params.length != 4 && params.length != 3) || (params[1].toLowerCase() != 'add' && params[1].toLowerCase() != 'remove'))
			{
				message.channel.send('Usage: `alias <add|remove> <game> <alias>` (*alias only required for adding*)')
				return
			}
			if(params[1].toLowerCase() == 'add')
			{
				if(this.aliases.find((alias) => alias.game.toLowerCase() == params[2].toLowerCase() ))
				{
					message.channel.send('Game already has an alias (*\'' + params[2] + '\' => \'' + (this.aliases.find(alias => alias.game.toLowerCase() == params[2].toLowerCase()).alias || 'undefined(?)') + '\'*)')
					return
				}
				global.db.get('gameAliases').push({ game: params[2], alias: params[3] }).write()
				message.channel.send('Added alias for \'' + params[2] + '\' => \'' + params[3] + '\'')
			}
			else if(params[1].toLowerCase() == 'remove')
			{
				let find = this.aliases.find(alias => alias.game.toLowerCase() == params[2].toLowerCase())
				if(!find)
				{
					message.channel.send('Can\'t find an alias for \'' + params[2] + '\'')
					return
				}
				global.db.get('gameAliases').remove({ game: find.game }).write()
				message.channel.send('Removed alias for \'' + params[2] + '\'')
			}
			else
				message.channel.send('I\'m not sure what you mean')
			this.refresh()
			return
		}

		if(params.length == 1)
		{
			// List all registered games
			msg = '**Registered Games:**'
			this.gamers.forEach((games, id, map) =>
			{
				games.forEach(game =>
				{
					let find = this.aliases.find((alias) => alias.game.toLowerCase() == game.toLowerCase())
					if(find)
						game = find.alias
					if(!msg.includes(game))
						msg += '\n - ' + game
				})
			})
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
					this.gamers.get(user.id).forEach(game =>
					{
						let find = this.aliases.find((alias) => alias.game.toLowerCase() == game.toLowerCase())
						if(find)
							game = find.alias
						msg += '\n - ' + game
					})
				else
					msg += ' None registered'
			}
			if(msg)
				message.channel.send(msg)
		}
	}
}
