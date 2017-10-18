const low = require('lowdb')
const Express = require('express')
const request = require('request')
const Discord = require('discord.js')
const FileAsync = require('lowdb/adapters/FileAsync')

const Commands = require('./commands/command.js')
const About = require('./commands/about.js')

const CommandToken = process.env.COMMAND_TOKEN || '!'

if(process.env.BOT_TOKEN == undefined)
{
	console.log('No token specified!')
	return
}

let server = undefined
let app = new Express()
let client = new Discord.Client()

let shushed = []

app.get('/discord_redirect', function(req, res)
{
	res.send('Successfully joined server')
})

setGame = (id, game) =>
{
	let user = db.get('users').find({ id: id }).value()
	if(user == undefined)
	{
		console.log('Couldn\' find user with id ${id}')
		return
	}
	db.get('users').find({ id: id }).set('currentlyPlaying', game).write()
}

getGame = (id) =>
{
	let user = db.get('users').find({ id: id }).value()
	if(user == undefined)
	{
		console.log('Could\'nt find user with id ${id}')
		return 'None'
	}
	return user.currentlyPlaying
}

setup = (db) =>
{
	client.on('ready', () =>
	{
		statuses = db.get('statuses').value()
		index = Math.floor((Math.random() * statuses.length))
		client.user.setGame(statuses[index])

		client.guilds.forEach((value, key, map) =>
		{
			value.members.forEach((member, key, map) =>
			{
				if(member.id == client.user.id)
					return
				let user = db.get('users').find({ id: member.id }).value()
				if(!user)
				{
					user =
					{
						id: member.id,
						name: member.displayName,
						shushed: false,
						currentlyPlaying: (member.presence.game ? member.presence.game.name : '')
					}
					db.get('users').push(user).write()
				}
				else if(user.shushed)
					shushed.push(member.id)
				member.client.on('presenceUpdate', (oldMember, newMember) =>
				{
					if(newMember.id != user.id)
						return
					if(user.name != newMember.displayName)
					{
						user.name = newMember.displayName
						db.get('users').find({ id: member.id }).set('name', newMember.displayName).write()
					}
					if(newMember.presence == 'offline')
						db.get('users').find({ id: member.id }).set('currentlyPlaying', '')
					if(newMember.presence.game && user.currentlyPlaying != newMember.presence.game)
						console.log('\'' + newMember.displayName + '\' is now playing \'' + newMember.presence.game + '\'')
				})
			})
		})

		console.log('\nCoffeeLoverBot is playing ' + statuses[index])
	})
	client.on('message', (message) =>
	{
		if(message.content.toLowerCase().includes('hentai'))
		{
			message.channel.send('( ͡° ͜ʖ ͡°)')
			return
		}
		if(message.author.bot)
			return
		if(message.content.toLowerCase().includes('bot'))
		{
			let replies = [
				'Whatchu want?',
				'Yo ' + message.author,
				'___random_guild_member___, I think this guy wants you',
				'***NANI?!***',
				'( ͡° ͜ʖ ͡°)',
				'Sssshhhhh',
				'*This bot appears to be offline, leave a message after the screech*\n***SCREEEECCCCHHHH***',
				'*pretends to not be here*',
				'Yes?',
				'I AM BOT',
				'Go away, I\'m playing with ___random_guild_member___'
			]
			let msg = replies[Math.floor(Math.random() * replies.length)]
			if(msg.includes("___random_guild_member___"))
				msg = msg.replace("___random_guild_member___", message.guild.members.filter((user) => { return user.id != client.user.id && user.id != message.author.id }).random(1)[0])
			message.channel.send(msg)
		}
		else if(message.content.toLowerCase().includes('autism') || message.content.toLowerCase().includes('autistic'))
			message.channel.send('*Autistic screeching*')
		else if(message.content.length < 2 || message.content[0] != CommandToken)
		{
			if(shushed.includes(message.author.id))
			{
				message.delete()
				message.channel.send('Ssssshhhhhh')
			}
			return
		}

		let input = message.content.substring(CommandToken.length)
		let params = Commands.getParams(input)
		if(params.length == 0)
			return
		if(params[0] == "about")
			message.channel.send(About(params))
		else if(params[0] == "shush")
		{
			if(params.length == 2)
			{
				let userID = Commands.getUserID(message.channel, params[1])
				if(userID && userID > 0)
				{
					shushed.push(userID)
					if(userID == message.author.id)
						message.channel.send('Interesting choice. Your will is my command!')
					else
						message.channel.send('Shushed \'' + params[1] + '\'')
					db.get('users').find({ id: userID }).set('shushed', true).write()
				}
				else
					message.channel.send('Could not find user \'' + params[1] + '\'')
			}
			else
				message.channel.send("usage: !shush <username>\n(*if a user has spaces in their name, put it in quotes, e.g. \"Coffee Bot\"*)")
		}
		else if(params[0] = "unshush")
		{
			if(params.length == 2)
			{
				let userID = Commands.getUserID(message.channel, params[1])
				let index = shushed.indexOf(userID)

				if(userID == message.author.id)
					message.channel.send('You fool! You can\'t unshush yourself!?')
				else if(userID && userID > 0 && index >= 0)
				{
					shushed.splice(index, 1)
					message.channel.send('*\'' + params[1] + '\'* can now speak freely again... to an extent')
					db.get('users').find({ id: userID }).set('shushed', false).write()
				}
				else if(!userID || userID <= 0)
					message.channel.send('Could not find user \'' + params[1] + '\'')
			}
			else
				message.channel.send("usage: !unshush <username>\n(*if a user has spaces in their name, put it in quotes, e.g. \"Coffee Bot\"*)")
		}
	})
	client.on('guildMemberAdd', (member) =>
	{
		let channel = member.guild.channels.find('name', 'member-log')
		if(!channel)
			return
		channel.send('Welcome, *' + member.displayName + '*')
		db.get('users').push({ id: member.id, games: [] }).write()
	})
	client.on('guildMemberRemove', (member) =>
	{
		db.get('users').remove({ id: member.id }).write()
	})
	client.on('unhandledRejection', console.error)
	client.login(process.env.BOT_TOKEN)
}

let adapter = new FileAsync('db.json')
low(adapter)
	.then(db =>
	{
		setup(db)
		app.get('/users/:handle', (req, res) =>
		{
			const user = db.get('users').find({ handle: req.params.handle }).value()
			if(!user)
			{
				res.send('User \'*' + req.params.handle + '*\' not found')
				return
			}
			res.send(user)
		})
		app.post('/users/:handle', (req, res) =>
		{
			if(req.query.handle == undefined)
			{
				res.send('User handle required')
				return
			}
			db.get('users')
			  .push({
				  handle: req.query.handle,
				  games: [],
				  currentlyPlaying: 'Nothing'
			  }).write().then(user => res.send(user))
		})
		return db.defaults({
			users: [],
			statuses: [
				// Playing...
				"with itself",
				"all the songs",
				"TF2 on an alienware"
			]
		}).write()
	})
	.then(() =>
	{
		server = app.listen(process.env.PORT || 3000, () =>
		{
			host = server.address().address
			port = server.address().port
			console.log('Listening at \'%s:%s\'', host, port)
			console.log('To add the bot to your server go to\n\thttps://discordapp.com/oauth2/authorize?client_id=364367399538917377&scope=bot&permissions=1275579456')
		})
	})
