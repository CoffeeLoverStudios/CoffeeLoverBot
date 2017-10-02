Discord = require 'discord.js'
client = new Discord.Client
# token: 'MzY0MzY3Mzk5NTM4OTE3Mzc3.DLOwgA.dCvPVzF7mIrLnPA6tzkDT-WO3Ss'

client.on 'ready', () ->
	console.log 'Bot ready'

client.on 'message', (message) ->
	if message.content == 'bot?'
		message.reply 'YOU WHAT?!'
