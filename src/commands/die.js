const Command = require('./command.js')

module.exports = class roll extends Command
{
    shouldCall(command) { return command.toLowerCase() == 'roll' }

	usage() { return '`!roll`: Rolls a 6 sided die'}

	call(message, params, client)
    {
    	var number = Math.floor(Math.random() * 7)
		var msg = message.member.displayName + ' rolled a ' + number
    	if (number == 1) message.channel.send(msg + ", unlucky")
    	else if (number == 6) message.channel.send(msg + " *OHHHH*")
		else if (number == 0) message.channel.send('You rolled a 0, and.... umm... you suck')
		else message.channel.send(msg)
  }
}
