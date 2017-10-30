const SeedRandom = require('seedrandom')

let CommandRegex = /\w+|[^\s"]+|"[^"]+"/g // Split words by white-space, but leave words in quotes as a single parameter
let ParamsReplaceRegex = /"|'/g // Replace all quotation marks, single or double
module.exports =
{
	getRandom: function(list, channel)
	{
		let item = list[Math.floor(SeedRandom(new Date().getTime(), { entropy: true })() * list.length)]
		if(typeof item == 'string' && item.startsWith('${nsfw}'))
		{
			if(channel.nsfw)
				return item.substring('${nsfw}'.length)
			else
				return this.getRandom(list, channel)
		}
		return item
	},
	getRandomNumber: function(min, max) { return Math.floor(SeedRandom(new Date().getTime(), { entropy: true })() * max) + min },
	getRandomUser: function(guild, filteredIDs)
	{
		let member = guild.members.filter((user) => { return !filteredIDs.includes(user.id) }).random(1)
		console.log('Got random memember \'' + (member.name || 'null') + '\'')
		return member
	},

	replaceAll: function(input, replace, value) { return input.replace(new RegExp(replace, 'g'), value) },

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

	getUser: function(channel, userID) { return channel.guild.members.find({ id: userID }) },
	getUserByName: function(channel, username)
	{
		let user = undefined
		channel.guild.members.forEach((member, key, map) =>
		{
			if(member.displayName.toLowerCase() == username.toLowerCase() ||
			  (member.nickname && member.nickname.toLowerCase() == username.toLowerCase()) ||
		  	   member.user.username.toLowerCase() == username.toLowerCase())
			{
				user = member
				return
			}
		})
		return user
	},

	process: function(input, sender, channel)
	{
		if(input == undefined)
			return ''
		if(input.includes('${random_member}'))
			input = this.replaceAll(input, /\${random_member}/g, this.getRandomUser(sender.guild, [ sender.id ]).displayName || "someone")
		if(input.includes('${random_number}'))
			input = this.replaceAll(input, /\${random_number}/g, this.getRandomNumber(1, 10))
		if(input.includes('${username}'))
			input = this.replaceAll(input, /\${username}/g, sender.displayName)
		return input
	}
}
