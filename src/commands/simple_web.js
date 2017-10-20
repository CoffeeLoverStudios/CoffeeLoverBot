const Utils = require('../utils.js')
const Discord = require('discord.js')
const Command = require('./command.js')
const request = require('request')

const YesOrNoURL = 'https://yesno.wtf/api/'
const AdviceURL = 'http://api.adviceslip.com/advice'

module.exports = class SimpleWeb extends Command
{
	usage()
	{
		return [
			'`!yesorno`: Returns either *yes* or *no* in .gif form',
			'`!advice`: Get some advice from a computer. Yeah, how does that make you feel? (*optionally add a word to search for*)'
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'yesorno' ||
								 command.toLowerCase() == 'advice' }

	call(message, params)
	{
		if(params[0].toLowerCase() == 'yesorno')
		{
			request(YesOrNoURL, (error, response, body) =>
			{
				if(response.statusCode != 200 || error)
					console.log('Error retrieving from ' + YesOrNoURL + ' - ' + error)
				else
				{
					let url = JSON.parse(body).image
					message.channel.send(new Discord.Attachment(url))
					console.log('Sent \'' + url + '\'')
				}
			})
		}
		else if(params[0].toLowerCase() == 'advice')
		{
			let url = AdviceURL
			if(params.length > 1)
				url += '/search/' + params[1]
			request(url, (error, response, body) =>
			{
				if(response.statusCode != 200 || error)
					console.log('Error retrieving from ' + url + ' - ' + error)
				else
				{
					let json = JSON.parse(body)
					if(params.length == 1)
						message.channel.send(json.slip.advice)
					else if(json.message || json.total_results == 0)
						message.channel.send('No advice found for that search')
					else
						message.channel.send(Utils.getRandom(json.slips).advice)
				}
			})
		}
	}
}
