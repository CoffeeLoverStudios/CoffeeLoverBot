const request = require('request')
const Utils = require('../utils.js')
const global = require('../global.js')
const Discord = require('discord.js')
const Command = require('./command.js')

const BaseRule34URL = 'https://rule34.xxx/'
const BaseHentaiURL = 'https://gelbooru.com/'

module.exports = class Rule34 extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	usage(token)
	{
		return [
			{ usage: `\`${token}r34\`, \`${token}rule34\`: Fetches a *rule34* image from the interwebs (*image is random if no parameters are given. e.g. \`r34 bunnies\`*)`, nsfw: true },
			{ usage: `\`${token}hentai\`: Fetches a *"lewd anime"* image from the interwebs (*image is random if no parameters are given. e.g. \`hentai megumin\`*)`, nsfw: true }
		]
	}

	refresh() { this.notNSFW = global.db.get('notNSFW').value() }

	shouldCall(command) { return command.toLowerCase() == 'r34' ||
								 command.toLowerCase() == 'rule34' ||
							  	 command.toLowerCase() == 'hentai'
							 }

	call(message, params, client)
	{
		if(!message.channel.nsfw)
		{
			message.channel.send(Utils.process(Utils.getRandom(this.notNSFW), message.channel, message.member))
			return
		}
		if(params[0].toLowerCase() == 'r34' || params[0].toLowerCase() == 'rule34' || params[0].toLowerCase() == 'hentai')
		{
			let baseURL = params[0].toLowerCase() == 'hentai' ? BaseHentaiURL : BaseRule34URL
			let url = baseURL + 'index.php?page=dapi&s=post&q=index&json=1'
			if(params.length > 1)
				url += `&tags=${params.slice(1).join('+')}`

			try
			{
				request(url, (error, response, body) =>
				{
					if(error || response.statusCode != 200)
					{
						console.log(`Error retrieving from ${baseURL} - ${error}`)
						return
					}
					try
					{
						let json = JSON.parse(body)
						if(!json || json.length == 0)
						{
							message.channel.send('Could not find anything')
							return
						}
						let post = json[Math.floor(Math.random() * json.length - 1)]
						let image = params[0].toLowerCase() == 'hentai' ? post.file_url : `${baseURL}images/${post.directory}/${post.image}`
						console.log(`Posting Image: ${image}`)
						message.channel.send(new Discord.Attachment(image))
					}
					catch(e)
					{
						console.log(e)
						message.channel.send(`Getting rule34/hentai caused an error - ${e} (<@191069151505154048>)`)
					}
				})
			}
			catch(e)
			{
				console.log(e)
				message.channel.send(`Getting rule34/hentai caused an error - ${e} (<@191069151505154048>)`)
			}
		}
	}
}
