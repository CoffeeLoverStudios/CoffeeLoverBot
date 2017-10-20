const convert = require('xml-js')
const request = require('request')
const Utils = require('../utils.js')
const global = require('../global.js')
const Discord = require('discord.js')
const Command = require('./command.js')

const BaseRule34URL = 'https://rule34.xxx/index.php?page=dapi&s=post&q=index'

const HentaiKey = '454D34850A07E454EFC17ACABB490F273B03C05A'
const HentaiBaseURL = 'https://ibsearch.xxx/api/v1/images.format?parameters'

module.exports = class Rule34 extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	usage() { return { usage: '`!r34`, `!rule34`: Fetches a *rule34* image from the interwebs (*image is random if no parameters are given. e.g. `!r34 bunnies`)', nsfw: true } }

	refresh() { this.notNSFW = global.db.get('notNSFW').value() }

	shouldCall(command) { return command.toLowerCase() == 'r34' || command.toLowerCase() == 'rule34' || command.toLowerCase() == 'hentai' }

	call(message, params)
	{
		if(!message.channel.nsfw)
		{
			message.channel.send(Utils.process(Utils.getRandom(this.notNSFW), message.channel, message.member))
			return
		}
		if(message.content.toLowerCase() == 'hentai')
		{

		}
		else
		{
			let url = BaseRule34URL
			if(params.length > 1)
			{
				let tag = ''
				for(let i = 1; i < params.length; i++)
					tag += params[i] + (i < params.length - 1 ? '+' : '')
				url += '&tags=' + tag
			}

			request(url, (error, response, body) =>
			{
				if(response.statusCode != 200 || error)
					console.log('Error retrieving from https://rule34.xxx/ - ' + error)
				else
				{
					let json = JSON.parse(convert.xml2json(body, { compact: true, spaces: 2 }))
					if(json.posts !== undefined || json.posts._attributes.count == 0)
						message.channel.send(new Discord.Attachment('https:' + Utils.replaceAll(json.posts.post[Math.floor(Math.random() * json.posts.post.length)]._attributes.file_url, '\\\\', '/')))
					else
						message.channel.send('Could not find anything')
				}
			})
		}
	}
}
