const Utils = require('../utils.js')
const Discord = require('discord.js')
const Command = require('./command.js')
const request = require('request')
const global = require('../global.js')

const YesOrNoURL = 'https://yesno.wtf/api/'
const AdviceURL = 'http://api.adviceslip.com/advice'

module.exports = class SimpleWeb extends Command
{
	usage(token)
	{
		return [
			`\`${token}yesorno\`: Returns either *yes* or *no* in .gif form`,
		 	`\`${token}advice\`: Get some advice from a computer. Yeah, how does that make you feel? (*optionally add a word to search for*)`,
			{ usage: `\`${token}database\`: The database file is sent to you`, admin: true },
			{ usage: `\`${token}cleanse\`: Cleans the database file`, admin: true }
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'yesorno' ||
								 command.toLowerCase() == 'advice'  ||
							 	 command.toLowerCase() == 'database' ||
							 	 command.toLowerCase() == 'cleanse' }

	call(message, params, client)
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
		else if(params[0].toLowerCase() == 'database')
			message.channel.send(new Discord.Attachment('./data/db.json'))
		else if(params[0].toLowerCase() == 'cleanse')
		{
			console.log('Cleansing...')
			// Cleanse members
			let guildMemberIDs = [], users = global.db.get('users').value()
			client.guilds.forEach((value, key, map) => { value.members.forEach((member, key, map) => { guildMemberIDs.push(member.id) })})
			console.log(`Guild members: ${guildMemberIDs.length}\nUsers: ${users.length}`)

			for(let i = users.length - 1; i > 0; i--)
			{
				if(!guildMemberIDs.includes(users[i].id))
				{
					console.log(`Removing '${users[i].nickname || users[i].name}'...`)
					users.splice(i, 1)
				}
			}

			global.db.set('users', users).write()

			let musicQueues = global.db.get('music').value().queues
			for(let i = 0; i < musicQueues.length; i++)
			{
				musicQueues[i].queue = []
				musicQueues[i].songIndex = 0
			}
			global.db.get('music').set('queues', musicQueues).write()
		}
	}
}
