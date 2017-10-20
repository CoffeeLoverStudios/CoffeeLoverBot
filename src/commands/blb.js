const Utils = require('../utils.js')
const Discord = require('discord.js')
const Command = require('./command.js')

const BaseURL = 'http://belikebill.azurewebsites.net/billgen-API.php?default=1'

module.exports = class BeLikeBill extends Command
{
	usage() { return '`!blb`, `!belikebill`: Gets a meme from the interwebs (*uses a name you supply, otherwise defaults to \'Bill\'*)' }

	shouldCall(command) { return command.toLowerCase() == 'blb' || command.toLowerCase() == 'belikebill' }

	call(message, params)
	{
		let url = BaseURL
		if(params.length > 1)
			url += '&name=' + Utils.replaceAll(message.content.substring(params[0].length + 1), /\s/g, '+')
		message.channel.send(new Discord.Attachment(url, 'be_like_bill.png'))
	}
}
