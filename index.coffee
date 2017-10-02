Discord = require 'discord.js'
Express = require 'express'
request = require 'request'

if process.env.BOT_TOKEN == undefined
	console.log 'No token specified!'
	return

# Setup Express server
app = new Express
app.get '/discord_redirect', (req, res) ->
	res.send 'Successfully joined server'

# Setup Discord bot
client = new Discord.Client

client.on 'ready', () ->
	console.log 'CoffeeBot started'

client.on 'message', (message) ->
	if message.content == 'bot?'
		message.channel.send 'YOU WHAT?!'
	else if message.content.startsWith 'ping'
		message.channel.send 'pong'

client.on 'guildMemberAdd', (member) ->
	channel = member.guild.channels.find 'name', 'member-log'
	if !channel
		return
	channel.send 'Welcome, *${member}*'

client.login process.env.BOT_TOKEN

# Start server
server = app.listen process.env.port || 3000, () ->
	host = server.address().address
	port = server.address().port
	console.log 'Listening at \'%s:%s\'', host, port
	console.log  'To add the bot, go to\n\thttps://discordapp.com/oauth2/authorize?client_id=364367399538917377&scope=bot&permissions=1275579456'
