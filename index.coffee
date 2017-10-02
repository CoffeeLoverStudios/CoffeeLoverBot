# Add bot: https://discordapp.com/oauth2/authorize?client_id=364367399538917377&scope=bot&permissions=1275579456&response_type=code
Discord = require 'discord.js'
Express = require 'express'
app = new Express

# Setup Express server
app.get '/', (req, res) ->
	res.send 'Hello from the other siiidddeee'

app.post '/discord_redirect', (req, res) ->
	console.log 'Request: ' + req

# Setup Discord bot
client = new Discord.Client
if process.env.BOT_TOKEN == undefined
	console.log 'No token specified!'
	return

client.on 'ready', () ->
	console.log 'CoffeeBot started'

client.on 'message', (message) ->
	if message.content == 'bot?'
		message.reply 'YOU WHAT?!'

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
