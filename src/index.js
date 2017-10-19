const low = require('lowdb')
const Express = require('express')
const request = require('request')
const Discord = require('discord.js')
const FileAsync = require('lowdb/adapters/FileAsync')

const Utils = require('./utils.js')
const Commands = require('./commands/command.js')
const About = require('./commands/about.js')
const Shush = require('./commands/shush.js')
const Poems = require('./commands/poems.js')
const Play = require('./commands/play.js')
const flipcoin = require('./commands/flip.js')
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
let commands = []

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
		client.user.setGame(Utils.getRandom(db.get('statuses').value()))

		commands.push(new About(db))
		commands.push(new Shush(db))
		commands.push(new Poems(db))
		commands.push(new Play(db))
		commands.push(new flipcoin(db))
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
				if(user.shushed)
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

		console.log('\nCoffeeLoverBot is ready')
	})
	client.on('message', (message) =>
	{
		if(message.author.bot || message.member.id == client.user.id)
			return
		let user = db.get('users').find({ id: message.member.id }).value()
		if(user.canMessage !== undefined && !user.canMessage)
		{
			Shush.shushMessage(message)
			return
		}
		if(message.content[0] == CommandToken)
		{
			let params = Utils.getParams(message.content.substring(CommandToken.length))
			if(params[0].toLowerCase() == 'refresh')
				commands.forEach((command) => { command.refresh() })
			else
				commands.forEach((command) => { if(command.shouldCall(params[0])) command.call(message.member, message.channel, params, client) })
		}
		else
			commands.forEach((command) => { command.gotMessage(message) })

			/*
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
				'Go away, I\'m playing with ___random_guild_member___',
              	'yes senpai?',
              	'hey',
              	'hai, ' + message.author + '-chan?',
              	'sorry uhh, no speaka englis',
              	'ugh not again...',
              	'**the hell you just call me?!**',
              	'can\'t you tell im busy not caring?',
              	'*muted*',
              	'roses are red, \n' + message.author + ' looks like a *pheasant*, \ndont say my name you *stupid dumb* ***peasant***',
              	'58008',
              	'Unsheath thou keyboard',
              	'Woah, whats that over there?',
              	'*deleting browser history*',
              	'*deleting cookies*',
				'It was me, ***Dio***',
              	'Mmmmmm, cheque please',
              	'@everyone, ' + message.author + ' needs help',
              	'My liege?',
              	'Are you scribing on a portable doohickey?!',
              	'I came, I saw, and I **came some more!**',
				'*My body is ready*',
				'print("ye what?")',
				'Yeah nah',
				'You got the goods?',
				'Insert food here',
				'Love is a lie',
				'Walla walla',
				'**whirring**',
				'You got the cash?',
				'I\'m not gay but 20kb/s is 20kb/s',
				'Go away i dont have time for *iiNet* speeds',
				'*gone fishing, back in 5*'
			]
			message.channel.send(Commands.process(Commands.getRandom(replies), message.member, client))
		}
		else if(message.content.toLowerCase().includes('autism') || message.content.toLowerCase().includes('autistic'))
			message.channel.send(Commands.process(Commands.getRandom([
              	'*Autistic screeching*',
              	'I heard autism',
              	'How many autistic people on this server? I\'d say about ' + Commands.getRandomNumber(1, message.channel.guild.memberCount)
			]), message.author, client))
		else if(message.content.length < 2 || message.content[0] != CommandToken || shushed.includes(message.author.id))
		{
			if(shushed.includes(message.author.id))
			{
				message.delete()
				let msg = ''
				for(let i = 0; i < (Math.floor(Math.random() * 7) + 2); i++)
					msg += 's'
				for(let i = 0; i < (Math.floor(Math.random() * 7) + 2); i++)
					msg += 'h'
				message.channel.send(msg).then(message => message.delete(2500))
			}
			return
		}
		else
		{
			let input = message.content.substring(CommandToken.length)
			let params = Commands.getParams(input)
			if(params.length == 0)
				return
			let paramsRaw = input.substring(params[0].length + (input.length > params[0].length ? 1 : 0))
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
                        let user = db.get('users').find({ id: userID }).value()
						if(userID == message.author.id)
							message.channel.send(Commands.getRandom([
                              'Interesting choice. Your will is my command!',
                              'Watch out, we got a badass over here',
                              'Sure?'
                              ]))
						else
							message.channel.send(Commands.getRandom([
                              	'Shushed \'' + params[1] + '\'',
                              	'*SILENCE TO THE PEASANT KNOWN AS \'' + user.name + '\'',
                              	'rip that dude'
                              ]))
						db.get('users').find({ id: userID }).set('shushed', true).write()
					}
					else
						message.channel.send('Could not find user \'' + params[1] + '\'')
				}
				else
					message.channel.send("usage: !shush <username>\n(*if a user has spaces in their name, put it in quotes, e.g. \"Coffee Bot\"*)")
			}
			else if(params[0] == "unshush")
			{
				if(params.length == 2)
				{
					let userID = Commands.getUserID(message.channel, params[1])
					let index = shushed.indexOf(userID)

					if(userID == message.author.id)
						message.channel.send(Commands.getRandom([
                          'You fool! You can\'t unshush yourself!?',
                          'lolwut, you can\'t do that\n*...can they..?*',
                          '**you what?!**',
                          'Nice try'
                          ]))
					else if(userID && userID > 0 && index >= 0)
					{
						shushed.splice(index, 1)
						message.channel.send('*\'' + db.get('users').find({ id: userID }).name + '\'* can now speak freely again... to an extent')
						db.get('users').find({ id: userID }).set('shushed', false).write()
					}
					else if(!userID || userID <= 0)
						message.channel.send('Could not find user \'' + params[1] + '\'')
				}
				else
					message.channel.send("usage: !unshush <username>\n(*if a user has spaces in their name, put it in quotes, e.g. \"Coffee Bot\"*)")
			}
			else if(params[0] == "play")
			{
				let game = paramsRaw.length > 1 ? paramsRaw : Commands.getRandom(db.get('statuses').value())
				client.user.setGame(game)
				message.channel.send("Now playing '" + game + "'")
			}
          	else if(params[0] == "poem")
            {
            	message.channel.send(Commands.getRandom([

                  ]))
            }
			else if(params[0] == "woah")
			{
				let amount = Math.floor(Math.random() * 7) + 2
				for(let i = 0; i < amount; i++)
					message.channel.send('*woah!*')
			}
			else if(params[0] == "number")
				message.channel.send('Your number: ' + Commands.getRandomNumber(1, 10))
		}
		*/
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
				res.send('User \'*' + req.params.handle + '*\' not found')
            else
				res.send(user)
		})
		app.post('/users/:handle', (req, res) =>
		{
			if(req.query.handle == undefined)
				res.send('User handle required')
			else
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
				"TF2 on an alienware",
				"definitely not porn",
				"something worth playing",
				"a game of will power",
				"with a gun",
				"with the bones of my enemies",
				"with a small infant",
				"my trap card",
				"the spell Toadify",
				"with the horniest pre-pubescent boy",
				"lose lose",
				"Cards Against Humanity",
				"catch the knife",
				"find the sausage",
				"with gluten free flour",
				"Supereme Comader",
				"wheres jaxon at a lan-party",
				"with definitely not milk"
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
