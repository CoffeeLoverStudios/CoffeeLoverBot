const Command = require('./command.js')

module.exports = class roll extends Command
{
    shouldCall(command)
	{
		if(command == "roll") return true
  		else return false
	}

	call(message, params, client)
    {
    	var number = math.floor( Math.random() * 6 )
        message.channel.send("you rolled a " + number)
    if (number == 1) message.channel.send("unlucky")
    if (number == 6) message.channel.send("*OHHHH*")
  }
}
