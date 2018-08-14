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
			`\`${token}choose <option1> <option2>...\`: Chooses an option at random`,
			{ usage: `\`${token}database\`: The database file is sent to you`, admin: true },
			{ usage: `\`${token}cleanse\`: Cleans the database file`, admin: true }
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'yesorno' ||
								 command.toLowerCase() == 'advice'  ||
							 	 command.toLowerCase() == 'database' ||
							 	 command.toLowerCase() == 'cleanse' ||
							  	 command.toLowerCase() == 'choose' }

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

			let newUsers = [], ignoredUsers = global.db.get('ignoredUsers').value()
			users.forEach(user =>
			{
				if(guildMemberIDs.includes(user.id) && !ignoredUsers.includes(user.name))
					newUsers.push(user)
			})

			global.db.set('users', newUsers).write()

			let musicQueues = global.db.get('music').value().queues
			for(let i = 0; i < musicQueues.length; i++)
			{
				musicQueues[i].queue = []
				musicQueues[i].songIndex = 0
			}
			global.db.get('music').set('queues', musicQueues).write()

			message.channel.send('Cleansing complete')
		}
		else if(params[0].toLowerCase() == 'choose')
		{
			if(params.length <= 2)
			{
				message.channel.send('Usage: \`choose <option1> <option2>...\`')
				return
			}

			let options = []
			for(let i = 1; i < params.length; i++)
				options.push(params[i])
			message.channel.send('Your option, chosen at random is...')
			message.channel.send(`*${Utils.process(Utils.getRandom(options), message.author, message.channel)}*`)
		}
	}
}
