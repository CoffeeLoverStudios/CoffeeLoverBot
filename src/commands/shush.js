const Utils = require('../utils.js')
const Command = require('./command.js')

module.exports = class Shush extends Command
{
	constructor(db)
	{
		super(db)
		this.db = db
		this.refresh()
	}

	shouldCall(command) { return command.toLowerCase() == 'shush' || command.toLowerCase() == 'unshush' }

	refresh()
	{
		this.shushed = []
		this.db.get('users').filter((user) => { return user.canMessage !== undefined && !user.canMessage }).forEach((user) => { this.shushed.push(user.id) }).value()
	}

	call(sender, channel, params)
	{
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
						this.send('\'' + user.displayName + '\' already shushed', channel)
					else
					{
						this.shushed.push(userID)
						this.db.get('users').find({ id: userID }).set('canMessage', false).write()
						if(userID == sender.id)
							this.send(Utils.getRandom(this.db.get('shushedSelfResponses').value()), channel, user)
						else
							this.send(Utils.getRandom(this.db.get('shushedResponses').value()), channel, user)
					}
				}
			}
			else
				send('Usage: !shush <username>\n(*if usernames have spaces, put them in quotes. e.g. "Coffee Bot")\n(can mass shush)')
		}
		else if(params[0].toLowerCase() == 'unshush')
		{
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
							this.send(Utils.getRandom(this.db.get('unshushSelfResponses').value()), channel, user)
						this.shushed.splice(index, 1)
						this.db.get('users').find({ id: userID }).set('canMessage', true).write()
						this.send(Utils.getRandom(this.db.get('unshushResponses').value()), channel, user)
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
		for(let i = 0; i < (Math.floor(Math.random() * 6) + 1); i++)
			msg += 's'
		for(let i = 0; i < (Math.floor(Math.random() * 6) + 3); i++)
			msg += 'h'
		message.channel.send(msg).then(message => message.delete(2500))
	}

	gotMessage(message)
	{
		if(this.shushed.includes(message.member.id))
			shushMessage(message)
	}
}
