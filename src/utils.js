const SeedRandom = require('seedrandom')

let CommandRegex = /\w+|[^\s"]+|"[^"]+"/g // Split words by white-space, but leave words in quotes as a single parameter
let ParamsReplaceRegex = /"|'/g // Replace all quotation marks, single or double
module.exports =
{
	getRandom: function(list) { return list[Math.floor(SeedRandom(new Date().getTime())() * list.length)] },
	getRandomNumber: function(min, max) { return Math.floor(SeedRandom(new Date().getTime())() * max) + min },
	getRandomUser: function(guild, filteredIDs) { return guild.members.filter((user) => { return !filteredIDs.includes(user.id) }).random(1) },

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
			  (member.nickname && member.nickname.toLowerCase() == username.toLowerCase()))
			{
				userID = member.id
				return
			}
		})
		return userID
	},

	process: function(input, sender)
	{
		console.log('Input: ' + input)
		if(input == undefined)
			return
		if(input.includes('___random_guild_member___'))
			input = this.replaceAll(input, '___random_guild_member___', this.getRandomUser(sender.guild, [ sender.id ]))
		if(input.includes('___random_number___'))
			input = this.replaceAll(input, '___random_number___', this.getRandomNumber(1, 10))
		if(input.includes('___username___'))
		{
			input = this.replaceAll(input, '___username___', sender.displayName)
			console.log('Replaced ___username___ with \'' + sender.displayName + '\'')
		}
		return input
	}
}
