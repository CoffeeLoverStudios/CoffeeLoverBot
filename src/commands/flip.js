const Command = require('./command.js')

module.exports = class flipcoin extends Command
{
	usage(token) { return '`' + token + 'flipcoin`: Flips a coin'}

    shouldCall(command) { return command.toLowerCase() == 'flipcoin' }

	call(message, params, client)
    {
    	var flipcoin = Math.random()
    	if(flipcoin > 0.3)
          	message.channel.send(message.member.displayName + "'s coin flip was tails")
      	else
			message.channel.send(message.member.displayName + "'s coin flip was heads")
    }
}
