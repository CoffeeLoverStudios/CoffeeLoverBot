const path = require('path')
const low = require('lowdb')
const Express = require('express')
const request = require('request')
const Discord = require('discord.js')
const FileSync = require('lowdb/adapters/FileSync')
const Cleverbot = require('cleverbot-node')

const Utils = require('./utils.js')
const Command = require('./commands/command.js')
const Shush = require('./commands/shush.js')

if(process.env.NODE_ENV !== 'production')
	require('dotenv').load()

// Some variable setup
let DBPath = 'data/db.json'
let global = require('./global.js')

let commands = []
let app = new Express()
let client = new Discord.Client()
let cleverbot = undefined

// Some mandatory(?) redirect to add the bot
app.get('/discord_redirect', (req, res) => res.send('Successfully joined server'))

// This is so we can go to something like 'localhost:3000/data/db.json' to view the database
// Especially helpful for the site shown at 'localhost:3000' which shows players and their stats
app.use('/data', Express.static(path.join(__dirname, '../data')))

// Put the game against the user's name. Hopefully it isn't Huniepop, everyone would see ( ͡° ͜ʖ ͡°)
setGame = (id, game) =>
{
	let user = global.db.get('users').find({ id: id }).value()
	if(user == undefined) // if the user apparently doesn't exist, bail gracefully
	{
		console.log('Couldn\' find a user with the id ' + id)
		return
	}
	// Get the user's database data
	let dbUser = global.db.get('users').find({ id: id })
	dbUser.set('currentlyPlaying', game).write()
	// If the user doesn't have any games yet... what are they doing here?
	if(user.games == undefined)
	{
		user.games = []
		dbUser.set('games', [])
	}
	// If the game isn't recorded yet, and it's not... well, nothing... then add it to their list
	if(!user.games.includes(game) && game != '')
		dbUser.get('games').push(game).write()
}

// *gets out binoculars*
watch = (member) =>
{
	if(global.db.get('ignoredUsers').includes(member.name))
		return
	let users = global.db.get('users')
	// Grab the user from our secret book of secrets
	let user = users.find({ id: member.id }).value()
	// If the user is sneaky enough to avoid our book, put them in it
	if(!user)
	{
		user =
		{
			id: member.id,
			name: member.user.username,
			nickname: member.displayName,
			games: [],
			quotes: []
		}
		if(member.presence && member.presence.game)
			user.currentlyPlaying = member.presence.game.name
		else
			user.currentlyPlaying = ''
		users.push(user).write()
	}
	else
	{
		if(user.currentlyPlaying && member.presence.status == 'offline')
			setGame(member.id, '')
		else if(member.presence.game)
			setGame(member.id, member.presence.game.name || '')
	}
}

getUsageFromObject = (usage) =>
{
	let modifiers = ' '
	if(usage.admin)
		modifiers += '**(admin)**'
	if(usage.nsfw)
		modifiers += '**(nsfw)**'
	return usage.usage + (modifiers == ' ' ? '' : modifiers)
}

sendHelp = (message) =>
{
	let helpMsg = '*Commands*:'
	helpMsg += '\n - `' + global.tokens.command + 'help`: Shows all available commands'
	helpMsg += '\n - ' + getUsageFromObject({ usage: '`' + global.tokens.command + 'refresh`: Refreshes the database of stuffs', admin: true })
	commands.forEach(command =>
	{
		if(typeof command.usage === 'undefined') return
		let usage = command.usage(global.tokens.command)
		if(usage == undefined)
			return
		if(typeof usage == 'string')
			helpMsg += '\n - ' + usage
		else if(Array.isArray(usage))
			usage.forEach(usage =>
			{
				if(usage.usage)
				{
					if(usage.admin && !global.db.get('adminRoles').value().includes(message.member.highestRole.name))
						return
					helpMsg += '\n - ' + getUsageFromObject(usage)
				}
				else
					helpMsg += '\n - ' + usage
			})
		else if(usage.usage)
		{
			if(usage.admin && !global.db.get('adminRoles').value().includes(message.member.highestRole.name))
				return
			helpMsg += '\n - ' + getUsageFromObject(usage)
		}
		else
			console.log('Couldn\'t get usage for \'' + usage + '\'')
	})
	while(helpMsg.length >= 2000)
	{
		let index = helpMsg.substring(0, 2000).lastIndexOf('-')
		if(index >= 0)
		{
			message.channel.send(helpMsg.substring(0, index))
			helpMsg = helpMsg.substring(index)
		}
		else
		{
			message.channel.send(helpMsg.substring(0, 2000))
			helpMsg = helpMsg.substring(2000)
		}
	}
	message.channel.send(helpMsg)
}

catchError = (message, error) =>
{
	console.log('\n\n' + JSON.stringify(error) + '\n\n')
	console.log(`\nERROR:\n\t${error}\n\nUser: ${message.author.name}\nMessage: ${message.content}\n`)
	message.channel.send(`Screw you, that caused an error. (<@191069151505154048>, '${error}')`)
}

// The big function-o-things
setup = () =>
{
	client.on('ready', () =>
	{
		global.tokens.command = global.db.get('commandToken').value() || '!'

		// Load all commands in the './commands/' directory
		var normalizedPath = path.join(__dirname, 'commands')
		require('fs').readdirSync(normalizedPath).forEach((file) =>
		{
			if(!file.endsWith('.js'))
				return
			const required = require('./commands/' + file)
			try
			{
				let instance = new required()
				if(instance instanceof Command)
				{
					commands.push(instance)
					console.log('Loaded \'' + file + '\'')
				}
			} catch (e)
			{
				// *facepalm* okay, who broke my thing?
				console.log('Failed to load \'' + file + '\' - ' + e.message)
			}
		})

		let ignoredUsers = global.db.get('ignoredUsers')
		// Watch upon all existing members
		client.guilds.forEach((value, key, map) =>
		{
			// Yes, I do 'value' each and every one of you equally. Bad pun, sorry...
			value.members.forEach((member, key, map) =>
			{
				// If this is the bot... well, it shouldn't watch itself. It's seen enough as it is...
				if(member.id == client.user.id || ignoredUsers.includes(member.name))
					return
				// ( ͡° ͜ʖ ͡°)
				watch(member)
			})
		})

		// Set Bot's game status ('Playing...')
		let status = Utils.getRandom(global.db.get('statuses').value())
		client.user.setPresence({ status: 'online', game: { name: status.content, type: status.type }})

		// Should probably let the console-onlooker know they can waste a few more hours of their life on Discord now.
		//	At least this time it's because of something I did, and that's an achievement in my books
		console.log('\nCoffeeLoverBot is ready')
	})

	// Capture all messages on the server(s)
	client.on('message', (message) =>
	{
		try
		{
			// if it's a message from a bot (especially this one), ignore it
			if(message.author.bot || message.member.id == client.user.id)
				return
			// Get the user's data from the book-o-secrets
			let user = global.db.get('users').find({ id: message.member.id }).value()
			// If the user cannot message, SHUSH THEMMMM!!! if they do an 'unshush' command,
			//		we'll skip this and let them know they can't do that >:)
			if(user.canMessage !== undefined && !user.canMessage && !message.content.toLowerCase().startsWith(global.tokens.command + 'unshush'))
			{
				Shush.shushMessage(message)
				return
			}
			// Check if the message is a command
			if(message.content[0] == global.tokens.command)
			{
				// Remove the command token, screw that thing
				message.content = message.content.substring(global.tokens.command.length)
				// Swap out iOS quote thingos because they screw everything over
				message.content = Utils.replaceAll(message.content, /‘|’|“|”/g, '\"')
				// Get the parameters, seperated by spaces (excluding words encapsulated in double quotes), using regex magic
				//	e.g. '!someCommand parameter1 "some other parameter" another one'
				//			=> [ 'someCommand', 'parameter1', 'some other parameter', 'another', 'one' ]
				let params = Utils.getParams(message.content)
				// Check for a refresh command, this is specific and can only be done from this file apparently
				if(params[0].toLowerCase() == 'refresh')
				{
					// Re-read the secret book
					global.db.read()
					// Tell the commands to refresh all their things
					commands.forEach((command) => { if(typeof command.refresh !== 'undefined') command.refresh() })

					// Check for a new command token
					global.tokens.command = global.db.get('commandToken').value()
					if(!global.tokens.command)
						global.tokens.command = '!'

					// Let the peasant know we're done here
					message.channel.send('Refreshed, thanks to Mountain Dew™')
				}
				// Send help, or raygun
				else if(params[0].toLowerCase() == 'help')
					sendHelp(message)
				else // otherwise check if another command wants to take the user up on that challenge
					commands.forEach((command) =>
					{
						// Check for tricky classes not implemented with everything (I'm looking at you, Garry)
						if(typeof command.shouldCall === 'undefined' || typeof command.call === 'undefined') return
						// The command class will tell us if it's ready for this battle
						if(command.shouldCall(params[0]))
						{
							try { command.call(message, params, client) } // FIGHT!
							catch(e) { catchError(message, e) }
						}
					})
			}
			else // it's not a command, so let all the commands know we got a general message,
			{	 // 	and they can do whatever the hell they want with it, like delete it
				let handled = false
				for(let i = 0; i < commands.length; i++)
				{
					if(typeof commands[i].gotMessage === 'undefined')
						continue;
					if(commands[i].gotMessage(message))
						handled = true
				}
				if(!handled && cleverbot && message.mentions.members && message.mentions.members.has(client.user.id))
					cleverbot.write(Utils.replaceAll(message.content, "(\s+|)<@" + client.user.id + ">(\s+|)", ''), (response) => { message.channel.send(response.output) })
			}
		}
		catch(e) { catchError(message, e) }
	})
	// Called when a user joins a Discord server, we'll use this event to get their information
	//	and watch them like the creepy devs we are. But hey, at least we greet them!
	client.on('guildMemberAdd', (member) =>
	{
		// Get the initial channel, set by the .json config (something like 'welcome' or 'new-members')
		let channel = member.guild.channels.find('name', global.db.get('initialChannel').value())
		if(channel) // If the channel exists, then welcome them with a random greeting
			channel.send(Utils.process(Utils.getRandom(global.db.get('greetings').value(), channel), member, channel))

		// Set the new user's role
		let role = Utils.getRole(member.guild, global.db.get('initialRole').value())
		if(role)
			member.setRoles([ role ])
		// Store their data in our secret file full of secret stuff
		global.db.get('users').push({ id: member.id, name: member.name, nickname: member.displayName, games: [], quotes: [] }).write()
		// Watch them intently so that we can know their every move/message
		watch(member)
	})
	// Called when a user joins a server, we'll remove their data from existence and give them a nice(?) farewell
	client.on('guildMemberRemove', (member) =>
	{
		global.db.get('users').remove({ id: member.id }).write()
		let channel = member.guild.channels.find('name', global.db.get('initialChannel').value())
		if(channel)
			channel.send(Utils.process(Utils.getRandom(global.db.get('farewells').value(), channel), member, channel))
	})
	// Check for sneaky buggers changing their name on us
	client.on('guildMemberUpdate', (oldMember, newMember) =>
	{
		let user = global.db.get('users').find({ id: newMember.id })

		// Check for nickname changes
		if(user.value() && user.value().nickname != newMember.displayName)
			user.set('nickname', newMember.displayName).write()
	})
	// client.on('debug', (msg) => console.log(`[${new Date().toLocaleTimeString()}][DEBUG]: ${msg}`))
	client.on('warn', (warning) => console.log(`[${new Date().toLocaleTimeString()}][WARNING]: ${warning}`))
	client.on('error', (err) => console.log(`[${new Date().toLocaleTimeString()}][ERROR]: ${err.message}` + (err.fileName ? ('\n\t' + (err.lineNumber ? `[${err.lineNumber}]` : '') + err.fileName) : '')))
	client.on('unhandledRejection', console.error)
	// Finally, the bot is set up and ready to tell the world that it LIVES!
	client.login(process.env.BOT_TOKEN || global.tokens.discord)

	if(global.tokens.cleverbot)
		cleverbot.configure({ botapi: global.tokens.cleverbot })
	else
	{
		console.log('Cleverbot token not found, disabling...')
		cleverbot = undefined
	}

	this.updateInterval = setInterval(() =>
	{
		client.guilds.forEach((value, key, map) =>
		{
			// Yes, I do 'value' each and every one of you equally. Bad pun, sorry...
			value.members.forEach((member, key, map) =>
			{
				// If this is the bot... well, it shouldn't watch itself. It's seen enough as it is...
				if(member.id == client.user.id || global.db.get('ignoredUsers').includes(member.name))
					return
				let user = global.db.get('users').find({ id: member.id }).value()
				// Check game status
				if(member.presence.game && (!member.currentlyPlaying || member.currentlyPlaying != member.presence.game))
					setGame(member.id, member.presence.game.name)
				else if((!member.presence.game && user.currentlyPlaying != 'None') || member.presence.status == 'offline')
					setGame(member.id, '')
			})
		})

		// Update the bot's game status
		let status = Utils.getRandom(global.db.get('statuses').value())
		client.user.setPresence({ status: 'online', game: { name: status.content, type: status.type }})
	}, process.env.UPDATE_INTERVAL || 120000)
}

// Some database stuff
try
{
	let adapter = new FileSync(DBPath)
	global.db = low(adapter)
}
catch (e)
{
	console.log('Couldn\'t read database "' + DBPath + '" - ' + e.message)
	return
}

// Set the defaults for the database, for if it doesn't exist yet
global.db.defaults({
	users: [],
	commandToken: '!',
	initialChannel: 'welcome',
	statuses: [
		// Playing...
		"with itself",
		"with a gun",
		"something worth playing",
		"definitely not porn"
	],
	greetings: [
		"Sup, ${username}",
		"Ayy, it's ${username}"
	],
	farewells: [
		"Goodbye ${username}, you may or may not be missed",
		"So uhh... did I do that?"
	],
	genericResponses: [
		'${random_member}, I think this guy wants you',
		'Hey',
		'Roses are red, \n${username} looks like a *pheasant*,\ndon\'t say my name you ***peasant***',
		'58008',
		'You got the goods?'
	]
}).write()

// Get the tokens
global.tokens.discord = process.env.BOT_TOKEN
global.tokens.cleverbot = process.env.CLEVERBOT_TOKEN

// We kinda NEED this token
if(!global.tokens.discord)
{
	console.log('No discord bot token specified!')
	return
}
if(global.tokens.cleverbot)
	cleverbot = new Cleverbot()

setup() // <-- This calls the long function up there ^^

// Be nice and show some sort of webpage
app.get('/', (req, res) => { res.sendFile(path.join(__dirname + '/index.html')) })

let server = app.listen(process.env.PORT || 3000, () =>
{
	host = server.address().address
	port = server.address().port
	console.log(`Listening at '${server.address().address}:${server.address().port}'`)
	console.log('To add the bot to your server go to\n\thttps://discordapp.com/oauth2/authorize?client_id=364367399538917377&scope=bot&permissions=1275579456')
})
