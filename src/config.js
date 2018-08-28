const low = require('lowdb')
const path = require('path')
const FileSync = require('lowdb/adapters/FileSync')

module.exports = class Config
{
	constructor(name, defaults = {})
	{
		this._ready = false
		try
		{
			this._path = `${Config.dataPath()}${name}.json`
			this._adapter = new FileSync(this._path)
			this.db = low(this._adapter)
			this.db.defaults(defaults).write()
			console.log(`New config at '${this._path}'`)
		}
		catch(err)
		{
			console.log(`Couldn't read database '${this._path}' - ${err}`)
			this.db = undefined
		}
	}

	refresh() { this.db.read() }

	get(name, defaultValue) { return this.db.get(name).value() || defaultValue }
	set(name, value) { this.db.set(name, value).write() }

	static dataPath() { return path.join(__dirname, '../data/') }
}
