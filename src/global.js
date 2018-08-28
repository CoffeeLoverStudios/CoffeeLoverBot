const path = require('path')
const Config = require('./config.js')

let _config = new Config('db', {
	//defaults
	users: [],
	commandToken: '!'
})

module.exports =
{
	config: _config,
	client: undefined,
	db: _config.db,
	commands: [],
	dataPath: Config.dataPath(),
	tokens:
	{
		discord: undefined,
		cleverbot: undefined,
		command: '!'
	},

	getCommand(name)
	{
		for(let i = 0; i < module.exports.commands.length; i++)
			if(module.exports.commands[i].constructor.name.toLowerCase() == name.toLowerCase())
				return module.exports.commands[i]
		return undefined
	}
}
