const global = require('./global.js')
const randomExt = require('random-ext')
const Discord = require('discord.js')

let CommandRegex = /[^\s"]+|"[^"]+"/g // Split words by white-space, but leave words in quotes as a single parameter
let ParamsReplaceRegex = /"|'/g // Replace all quotation marks, single or double
module.exports =
{
	getRandom: function(list, channel)
	{
		let item = list[randomExt.integer(list.length - 1)]
		if(typeof item == 'string' && item.startsWith('${nsfw}'))
		{
			if(channel.nsfw)
				return item.substring('${nsfw}'.length)
			else
				return this.getRandom(list, channel)
		}
		return item
	},
	getRandomNumber: function(min, max) { return Math.floor(Math.random() * max) + min },
	getRandomUser: function(guild, filteredIDs)
	{
		if(!guild)
		{
			console.log('getRandomUser but no guild provided')
			return []
		}
		let members = guild.members.filter((user) => { return filteredIDs ? !filteredIDs.includes(user.id) : true })
		return members.random()
	},
	getRandomUserChannel: function(channel, filteredIDs)
	{
		if(!channel)
		{
			console.log('getRandomUserChannel but no channel provided')
			return undefined
		}
		let members = channel.members.filter((user) => { return filteredIDs ? !filteredIDs.includes(user.id) : true })
		return members.random()
	},

	getRandomInsult: function()
	{
		// Most, if not all, insults are from https://imgur.com/dXCGBE0
		let insults = global.db.get('insults').value()
		return (randomExt.integer(100) > 75 ? // more chance for a 3-part insult
			this.getRandom(insults.specifics) :
			this.getRandom(insults.insults[0]) + ' ' + this.getRandom(insults.insults[1]) + ' ' + this.getRandom(insults.insults[2])).toLowerCase()
	},

	replaceAll: function(input, replace, value, regex = true) { return input.replace(regex ? new RegExp(replace) : replace, value) },

	getParams: function(input)
	{
		let matches, params = []
		while((matches = CommandRegex.exec(input)))
			params.push(matches[0].replace(ParamsReplaceRegex, ''))
		return params
	},

	getUserID: function(channel, username)
	{
		let userID = 0
		channel.guild.members.forEach((member, key, map) =>
		{
			if(member.displayName.toLowerCase() == username.toLowerCase() ||
			  (member.nickname && member.nickname.toLowerCase() == username.toLowerCase()) ||
		  	   member.user.username.toLowerCase() == username.toLowerCase())
			{
				userID = member.id
				return
			}
		})
		return userID
	},

	getUser: function(guild, userID) { return guild.members.find({ id: userID }) },
	getUserByName: function(guild, username)
	{
		if(!guild || !username) return undefined
		let user = undefined
		if(username.startsWith('<@'))
			user = guild.members.get(username.substring(username.startsWith('<@!') ? 3 : 2, username.length - 1))
		if(!user)
			user = guild.members.find(member => member.displayName.toLowerCase() == username.toLowerCase() ||
										(member.nickname && member.nickname.toLowerCase() == username.toLowerCase()) ||
										(username.startsWith('<@!') && username.substring(3, username.length - 1) == member.id.toString()) ||
										(username.startsWith('<@')  && username.substring(2, username.length - 1) == member.id.toString()))
		return user
	},
	getRandomUserFromRole: function(channel, roleName)
	{
		let users = this.getRoleMembers(channel.guild, roleName)
		if(!users || users.size === 0)
			return undefined
		return users.random()
	},
	getRole: function(guild, roleName)
	{
		if(!roleName || !guild) return undefined
		let role
		if(roleName.startsWith('<@'))
			role = guild.roles.get(roleName.substring(roleName.startsWith('<@&') ? 3 : 2, roleName.length - 1))
		if(!role)
			role = guild.roles.find(role => role.name.toLowerCase() == roleName.toLowerCase() ||
									(roleName.startsWith('<@&') && roleName.substring(3, roleName.length - 1) == role.id.toString()) ||
									(roleName.startsWith('<@') && roleName.substring(2, roleName.length - 1) == role.id.toString()))
		return role
	},
	getRoleMembers: function(guild, role)
	{
		if(guild && role)
			role = this.getRole(guild, role) // convert from String to DiscordRole
		if(!role || !role.members || role.members.length === 0)
			return []
		return role.members
	},

	isAdmin: function(member)
	{
		return member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR, true, true, true)
	},

	send: function(channel, content, options = {})
	{
		channel.send(content, options)
				.catch(error => console.log(`Failed to send message - ${error}`))
	},

	process: function(input, sender, channel, customs)
	{
		if(!input)
			return ''
		else
			console.log('Input')
		try
		{
			let user = global.db.get('users').find(x => x.id == sender.id).value()
			let username = sender.displayName
			if(input.includes('${random_member}'))
			{
				let index = 0
				while((index = input.indexOf('${random_member}', index)) >= 0)
				{
					let randomUser = this.getRandomUser(sender.guild, [ sender.id ])
					let randomUsername = randomUser.displayName
					input = input.replace(/\${random_member}/, randomUsername || "someone")
				}
			}
			if(input.includes('${random_number}'))
			{
				let index = 0
				while((index = input.indexOf('${random_number}', index)) >= 0)
					input = input.replace(/\${random_number}/, this.getRandomNumber(1, 10))
			}
			if(input.includes('${random_percentage}'))
			{
				let index = 0
				while((index = input.indexOf('${random_percentage}', index)) >= 0)
					input = input.replace(/\${random_percentage}/, this.getRandomNumber(1, 100))
			}
			if(input.includes('${username}'))
				input = this.replaceAll(input, /\${username}/g, username)
			if(input.includes('${insult}'))
			{
				let index = input.indexOf('${insult}', input[0] == '$' ? 1 : 0)
				while(index > 0)
				{
					let insult = this.getRandomInsult().toLowerCase()
					if(input.substring(0, index).endsWith('a ') && (
						insult[0] == 'a' ||
						insult[0] == 'e' ||
						insult[0] == 'i' ||
						insult[0] == 'o' ||
						insult[0] == 'u'
						))
						input = input.substring(0, index - 2) + 'an ' + input.substring(index)
					input = input.replace(/\${insult}/, insult)
					index = input.indexOf('${insult}', index)
				}
			}
			if(customs)
			{
				if(!Array.isArray(customs))
					customs = [ customs ]
				for(let i = 0; i < customs.length; i++)
					input = this.replaceAll(input, `\${custom_${i}}`, customs[i], false)
			}
			return input
		}
		catch(e)
		{
			console.log(`ERROR[utils.process]: ${e}`)
			return `Failed - ${e}`
		}
	}
}
