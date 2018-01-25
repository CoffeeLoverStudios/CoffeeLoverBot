const Command = require('./command.js')
const global = require('../global.js')

const BaseURL = 'https://lmgtfy.com/?q='

module.exports = class About extends Command
{
	usage(token) { return '`' + token + 'lmgtfy <search term>`: Returns a quick link to google' }

	shouldCall(command) { return command.toLowerCase() == 'lmgtfy' }

	call(message, params)
	{
		if(params.length == 1)
		{
			message.channel.send('Usage: `lmgtfy <search term>`')
			return
		}
		let url = BaseURL
		for(let i = 1; i < params.length; i++)
		{
			url += encodeURIComponent(params[i])
			if(i < params.length - 1)
				url += '+'
		}
		message.channel.send(url)
	}
}
