const Utils = require('../utils.js')
const Command = require('./command.js')
const global = require('../global.js')

module.exports = class filteredPhrases extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh()
	{
		this.filteredPhrases = global.db.get('filteredPhrases').value()
	}

	gotMessage(message)
	{
		this.filteredPhrases.forEach(phrase =>
		{
			if(!(phrase.content instanceof Array) && !message.content.toLowerCase().includes(phrase.content))
				return
			else if(phrase.content instanceof Array)
			{
				let phraseFound = false
				phrase.content.forEach(content =>
				{
					if(message.content.toLowerCase().includes(content))
					{
						phraseFound = true
						return
					}
				})
				if(!phraseFound)
					return
			}
			message.channel.send(Utils.process(Utils.getRandom(phrase.responses), message.member, message.channel))
		})
	}
}
