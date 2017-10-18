let CommandRegex = /\w+|[^\s"]+|"[^"]+"/g // Split words by white-space, but leave words in quotes as a single parameter
let ReplaceRegex = /"|'/g // Replace all quotation marks, single or double
module.exports =
{
	getParams: function(input)
	{
		let matches, params = []
		while(matches = CommandRegex.exec(input))
			params.push(matches[0].replace(ReplaceRegex, ''))
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
	}
}
