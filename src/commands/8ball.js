const Command = require('./command.js')
const Utils = require('../utils.js')

module.exports = class eightball extends Command
{
	usage(token) { return '`' + token + '8ball <question>`: Answers your question' }

    shouldCall(command) { return command.toLowerCase() == '8ball' }

	call(message, params, client)
    {
		message.channel.send(Utils.getRandom([
			'Yes',
			'No',
			'Why the hell are you asking me?',
			'Uhh.. sure',
			'.. no',
			'You\'re asking a program with pre-determined answers no matter what you ask',
			'I don\'t see why not',
			'I\'m gonna have to go with... *no*'
		]))
    }
}
