const Utils = require('../utils.js')
const Config = require('../config.js')
const Command = require('./command.js')

module.exports = class EightBall extends Command
{
	usage(token)
	{
		return `\`${token}8ball <question>\`: Answers your question`
	}

	refresh()
	{
		if(!this.config)
			this.config = new Config('commands/eightball', { responses: [ 'Yes', 'No', 'Maybe' ]})
		this.responses = this.config.get('responses')
	}

    shouldCall(command) { return command.toLowerCase() == '8ball' }

	call(message, params, client)
    {
		Utils.send(message.channel, Utils.getRandom(this.responses))
    }
}
