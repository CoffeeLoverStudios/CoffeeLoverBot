const Utils = require('../utils.js')
const Command = require('./command.js')
const global = require('../global.js')

module.exports = class Shush extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	shouldCall(command) { return command.toLowerCase() == 'shush' || command.toLowerCase() == 'unshush' }

	usage(token)
	{
		return [
			{ usage: '`' + token + 'shush <username>`: *"shushes"* the user(s), one of the best things for an admin', admin: true },
			{ usage: '`' + token + 'unshush <username>`: The opposite of shushing. Let\'s a user talk again', admin: true }
		]
	}

	refresh()
	{
		this.shushed = []
		global.db.get('users').filter((user) => { return user.canMessage !== undefined && !user.canMessage }).forEach((user) => { this.shushed.push(user.id) }).value()

		this.adminRoles = global.db.get('adminRoles').value()
		this.adminRefusals = global.db.get('insufficientRole').value()
	}

	call(message, params)
	{
		let channel = message.channel
		let sender = message.member
		if(!this.adminRoles.includes(sender.highestRole.name))
		{
			channel.send(Utils.getRandom(this.adminRefusals), message.channel, message.member)
			return
		}
		if(params[0].toLowerCase() == 'shush')
		{
			if(params.length > 1)
			{
				for(let i = 1; i < params.length; i++)
				{
					let userID = Utils.getUserID(channel, params[i])
					if(userID == 0)
					{
						this.send('Could not find user \'' + params[i] + '\'', channel)
						return
					}
					let user = channel.members.find(member => member.id === userID)
					if(this.shushed.includes(userID))
						this.send('\'' + (user == undefined ? params[i] : user.displayName) + '\' already shushed', channel)
					else
					{
						this.shushed.push(userID)
						global.db.get('users').find({ id: userID }).set('canMessage', false).write()
						if(userID == sender.id)
							this.send(Utils.getRandom(global.db.get('shushedSelfResponses').value()), channel, user)
						else
							this.send(Utils.getRandom(global.db.get('shushedResponses').value()), channel, user)
					}
				}
			}
			else
				this.send('Usage: !shush <username>\n(*if usernames have spaces, put them in quotes. e.g. "Coffee Bot")\n(can mass shush)')
		}
		else if(params[0].toLowerCase() == 'unshush')
		{
			if(this.shushed.includes(sender.id))
			{
				message.delete(1000)
				message.channel.send(Utils.getRandom(global.db.get('unshushSelfResponses').value()), channel, message.member).then(message=> message.delete(2500))
				return
			}
			if(params.length > 1)
			{
				for(let i = 1; i < params.length; i++)
				{
					let userID = Utils.getUserID(channel, params[i])
					let index = this.shushed.indexOf(userID)
					if(userID == 0 || index == -1)
					{
						this.send('Could not find user \'' + params[i] + '\'', channel)
						return
					}
					let user = channel.members.find(member => member.id === userID)
					if(!this.shushed.includes(userID))
						this.send('\'' + user.displayName + '\' has not been shushed', channel)
					else
					{
						if(userID == sender.id)
						{
							this.send(Utils.getRandom(global.db.get('unshushSelfResponses').value()), channel, user)
							return
						}
						this.shushed.splice(index, 1)
						global.db.get('users').find({ id: userID }).set('canMessage', true).write()
						this.send(Utils.getRandom(global.db.get('unshushResponses').value()), channel, user)
					}
				}
			}
			else
				channel.send('Usage: !unshush <username>\n(*if usernames have spaces, put them in quotes. e.g. "Coffee Bot")\n(can mass unshush)')
		}
	}

	static shushMessage(message)
	{
		message.delete()
		let msg = 'S'
		for(let i = 0; i < (Math.floor(Math.random() * 7) + 2); i++)
			msg += 's'
		for(let i = 0; i < (Math.floor(Math.random() * 10) + 3); i++)
			msg += 'h'
		message.channel.send(msg).then(message => message.delete(2500))
	}

	gotMessage(message)
	{
		if(this.shushed.includes(message.member.id))
			shushMessage(message)
		else
			return false
	}
}
