const Command = require('./command.js')

let technologies =
[
	/*
	' - NodeJS (https://nodejs.org)',
	' - Discord.js (https://discord.js.org)',
	' - Heroku (https://heroku.com)',
	' - LowDB (https://github.com/typicode/lowdb)'
	*/
]

module.exports = class About extends Command
{
	constructor(db)
	{
		super(db)
		technologies = db.get('technologies').value()
	}

	shouldCall(command) { return command.toLowerCase() == 'about' }

	call(sender, channel, params)
	{
		let msg = '*CoffeeLoverBot* (by `CoffeeLover Studios`)\n*Technologies*:\n'
		technologies.forEach((tech) => { msg += '\t' + tech + '\n' })
		channel.send(msg)
	}
}
