const Command = require('./command.js')

let technologies = []

module.exports = class About extends Command
{
	constructor(db)
	{
		super(db)
		technologies = db.get('technologies').value()
	}

	shouldCall(command) { return command.toLowerCase() == 'about' }

	call(message, params)
	{
		let msg = '*CoffeeLoverBot* (by `CoffeeLover Studios`)\n*Technologies*:\n'
		technologies.forEach((tech) => { msg += '\t' + tech + '\n' })
		message.channel.send(msg)
	}
}
