const global = require('./global.js')
const randomExt = require('random-ext');

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
		let members = [...guild.members.filter((user) => { return filteredIDs ? !filteredIDs.includes(user.id) : true }).values()];
		let member = this.getRandom(members)
		return member
	},
	getRandomUserChannel: function(channel, filteredIDs)
	{
		let members = [...channel.members.filter((user) => { return filteredIDs ? !filteredIDs.includes(user.id) : true }).values()];
		let member = this.getRandom(members)
		return member
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
		while(matches = CommandRegex.exec(input))
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
		let user = undefined
		guild.members.forEach((member, key, map) =>
		{
			if(user)
				return
			if(member.displayName.toLowerCase() == username.toLowerCase() ||
			  (member.nickname && member.nickname.toLowerCase() == username.toLowerCase()) ||
		  	   member.user.username.toLowerCase() == username.toLowerCase() ||
		   	   (username.startsWith('<@') && username.substring(2, username.length - 1) == member.id.toString()) ||
		   	   (username.startsWith('<@!') && username.substring(3, username.length - 1) == member.id.toString()))
				user = member
		})
		return user
	},
	getRandomUserFromRole: function(channel, roleName)
	{
		let role = this.getRole(channel.guild, roleName)
		if(!role)
		{
			channel.send('Role \'' + roleName + '\' not found')
			return undefined
		}
		let users = []
		channel.guild.members.forEach((member, key, map) =>
		{
			if(member.roles.has(role.id))
				users.push(member)
		})
		if(users.length == 0)
			return undefined
		return this.getRandom(users)
	},
	getRole: function(guild, roleName)
	{
		if(!roleName)
			return
		if(!guild)
		{
			console.log('No guild provided')
			return
		}
		let foundRole = undefined
		guild.roles.forEach((role, key, map) =>
		{
			if((role.name.toLowerCase() == roleName.toLowerCase()) ||
				(role.name.toLowerCase() == "@everyone" && roleName.toLowerCase() == "everyone"))
				foundRole = role
		})
		return foundRole
	},
	getRoleMembers: function(role)
	{
		let users = []
		if(role)
			role.members.forEach((member, id, map) => users.push(member))
		return users
	},

	process: function(input, sender, channel, customs)
	{
		if(input == undefined)
			return ''
		let user = global.db.get('users').find(x => x.id == sender.id).value()
		if(input.includes('${random_member}'))
		{
			let index = 0
			while((index = input.indexOf('${random_member}', index)) >= 0)
				input = input.replace(/\${random_member}/, this.getRandomUser(sender.guild, [ sender.id ]).displayName || "someone")
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
			input = this.replaceAll(input, /\${username}/g, ((user.casinoRewards || []).includes('customNickname') ? user.casinoNickname : sender.displayName) || sender.displayName)
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
			if(!customs.length)
				input = this.replaceAll(input, '${custom_0}', customs, false)
			else
				for(let i = 0; i < customs.length; i++)
					input = this.replaceAll(input, `\${custom_${i}}`, customs[i], false)
		}
		return input
	}
}
