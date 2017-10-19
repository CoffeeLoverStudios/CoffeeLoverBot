const Command = require('./command.js')

module.exports = class flipcoin extends Command
{
    shouldCall(command)
	{
		if(command == "flipcoin") return true
  		else return false
	}

	call(message, params, client)
    {
    	var flipcoin = Math.random()
    	if(flipcoin > 0.3)
          	message.channel.send(message.member.displayName + "'s coin flip was tails")
      	else
			message.channel.send(message.member.displayName + "'s coin flip was heads")
    }
}
