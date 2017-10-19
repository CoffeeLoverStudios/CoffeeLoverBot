const convert = require('xml-js')
const request = require('request')
const Utils = require('../utils.js')
const Discord = require('discord.js')
const Command = require('./command.js')


const BaseURL = 'https://rule34.xxx/index.php?page=dapi&s=post&q=index&limit=1'

module.exports = class Rule34 extends Command
{
	constructor(db)
	{
		super(db)
	}

	shouldCall(command) { return command.toLowerCase() == 'r34' || command.toLowerCase() == 'rule34' }

	call(message, params)
	{
		let url = BaseURL
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
				/*
				let url = JSON.parse(convert.xml2json(body, { compact: true, spaces: 2})).posts.post[0]._attributes.file_url
				message.channel.send(new Discord.Attachment(url))
				console.log('Sent \'' + url + '\'')
				*/

				let posts = JSON.parse(convert.xml2json(body, { compact: true, spaces: 2 })).posts.post
				if(posts !== undefined || posts.length == 0)
				{
					let index = Math.floor(Math.random() * posts.length)
					let url = posts[index]._attributes.file_url
					url = 'https:' + Utils.replaceAll(url, '\\\\', '/')
					message.channel.send(new Discord.Attachment(url))
					console.log('Sent \'' + url + '\'')
				}
				else
					message.channel.send('Could not find anything')
			}
		})
	}
}
