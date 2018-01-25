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
			{ usage: '`' + token + 'unshush <username>`: The opposite of shushing. Let\'s a user talk again', admin: true },
			{ usage: '`' + token + 'shush group <role>`: *"shushes"* everyone with the given role, minus the admins (admin are defined in `db.json`)', admin: true },
			{ usage: '`' + token + 'unshush group <role>`: *"unshshes"* everyone with the given role', admin: true }
		]
	}

	refresh()
	{
		this.shushed = []
		global.db.get('users').filter((user) => { return user.canMessage !== undefined && !user.canMessage }).forEach((user) => { this.shushed.push(user.id) }).value()

		this.adminRoles = global.db.get('adminRoles').value()
		this.adminRefusals = global.db.get('insufficientRole').value()
	}

	shush(user, channel)
	{
		this.shushed.push(user.id)
		global.db.get('users').find({ id: user.id }).set('canMessage', false).write()
		channel.send(Utils.process(Utils.getRandom(global.db.get('shushedResponses').value(), channel), user, channel))
	}

	unshush(user, channel)
	{
		let index = this.shushed.indexOf(user.id)
		this.shushed.splice(index, 1)
		global.db.get('users').find({ id: user.id }).set('canMessage', true).write()
		channel.send(Utils.process(Utils.getRandom(global.db.get('unshushResponses').value(), channel), user, channel))
	}

	call(message, params, client)
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
				if(params[1].toLowerCase() == 'group')
				{
					if(params.length == 2)
					{
						message.channel.send('Usage: `shush group <role>`')
						return
					}
					let users = Utils.getRoleMembers(Utils.getRole(message.guild, params[2]))
					if(users.length == 0)
					{
						message.channel.send('Couldn\'t find role "' + params[2] + '" or there are no members in that role')
						return
					}
					for(let i = 0; i < users.length; i++)
					{
						if((!this.adminRoles.find(role => role.toLowerCase() == params[2].toLowerCase()) && users[i].roles.find(role => this.adminRoles.includes(role.name))) ||
							users[i].id == client.user.id)
							continue;
						this.shush(users[i], message.channel)
					}
					return
				}
				if(params[1].toLowerCase() == 'random')
				{
					if(params.length == 2)
					{
						message.channel.send('Usage: `shush random`')
						return
					}
					this.shush(Utils.getRandomUser(message.guild), message.channel)
				}
				for(let i = 1; i < params.length; i++)
				{
					if(params[i][0] == '@')
						params[i] = params[i].substring(1)
					let user = Utils.getUserByName(channel, params[i])
					if(!user)
					{
						message.channel.send('Could not find user \'' + params[i] + '\'', channel)
						return
					}
					if(this.shushed.includes(user.id))
						message.channel.send('\'' + user.displayName + '\' already shushed')
					else
						this.shush(user, message.channel)
				}
			}
			else
				message.channel.send('Usage: `shush <username>`\n(*if usernames have spaces, put them in quotes. e.g. "Coffee Bot")\n(can mass shush)')
		}
		else if(params[0].toLowerCase() == 'unshush')
		{
			if(this.shushed.includes(sender.id))
			{
				message.delete(1000)
				message.channel.send(Utils.getRandom(global.db.get('unshushSelfResponses').value(), channel)).then(message=> message.delete(2500))
				return
			}
			if(params.length > 1)
			{
				if(params[1].toLowerCase() == 'group')
				{
					if(params.length == 2)
					{
						message.channel.send('Usage: `unshush group <role>`')
						return
					}
					let roleMembers = Utils.getRoleMembers(Utils.getRole(message.guild, params[2]))
					roleMembers.forEach(user =>
					{
						let index = this.shushed.find(id => id == user.id)
						if(index >= 0)
							this.unshush(user, message.channel)
					})
					return
				}
				for(let i = 1; i < params.length; i++)
				{
					let user = Utils.getUserByName(channel, params[i])
					if(!user)
					{
						message.channel.send('Could not find user \'' + params[i] + '\'')
						return
					}
					if(this.shushed.indexOf(user.id) == -1)
					{
						message.channel.send('They aren\'t shushed')
						return
					}
					if(user.id == sender.id)
					{
						message.channel.send(Utils.process(Utils.getRandom(global.db.get('unshushSelfResponses').value(), channel), sender, channel))
						return
					}
					this.unshush(user, message.channel)
				}
			}
			else
				message.channel.send('Usage: `unshush <username>`\n(*if usernames have spaces, put them in quotes. e.g. "Coffee Bot")\n(can mass unshush)')
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
			this.shushMessage(message)
		else
			return false
	}
}
