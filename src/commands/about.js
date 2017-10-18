const Command = require('./command.js')

let technologies =
[
	' - NodeJS (https://nodejs.org)',
	' - Discord.js (https://discord.js.org)',
	' - Heroku (https://heroku.com)',
	' - LowDB (https://github.com/typicode/lowdb)'
]

module.exports = function(params)
{
	let msg = '*CoffeeLoverBot* (by `CoffeeLover Studios`)\n'
	msg += '*Technologies*: \n'
	technologies.forEach((tech) => { msg += '\t' + tech + '\n' })
	return msg
}
