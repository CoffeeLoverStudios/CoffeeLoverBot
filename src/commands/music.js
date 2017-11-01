const Command = require('./command.js')
const Utils = require('../utils.js')
const global = require('../global.js')
const ytdl = require('ytdl-core')

module.exports = class Music extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh()
	{
		this.queues = new Map()
		let music = global.db.get('music').get('queues').value()
		for(let i = 0; i < music.length; i++)
		{
			let queue = music[i]
			this.queues.set(queue.guild, {
				volume: queue.volume,
				songIndex: queue.songIndex,
				removeWhenFinished: queue.removeWhenFinished,
				queue: queue.queue || [],
				textChannel: undefined,
				voiceChannel: undefined,
				connection: undefined,
				playing: false
			})
		}
	}

	usage(token)
	{
		return [
			'`' + token + 'music <join|leave>`: Joins the voice channel you are on, or leaves any voice server the bot is on',
			'`' + token + 'music <play|pause>`: Self explanatory',
			'`' + token + 'music <next|prev>`: Self explanatory',
			'`' + token + 'music queue show`: Shows the current queue',
			'`' + token + 'music queue <add> <url>`: Adds the YouTube url to the queue',
			'`' + token + 'music queue <remove> <url|name|index>`: Removes the song from the queue',
			'`' + token + 'music queue clear`: Removes all songs from the current queue',
			'`' + token + 'music volume <0-100>`: Sets the volume of the bot (anywhere between `1` and `100`)',
			'`' + token + 'music removeWhenFinished <true|false>`: If set to true, removes songs from the queue once they\'ve been played'
		]
	}

	shouldCall(command) { return command.toLowerCase() == 'music' }

	writeQueue()
	{
		let musicQueues = []
		this.queues.forEach((info, id, map) =>
		{
			musicQueues.push({
				guild: id,
				volume: info.volume,
				songIndex: info.songIndex,
				removeWhenFinished: info.removeWhenFinished,
				queue: info.queue || []
			})
		})
		global.db.get('music').set('queues', musicQueues).write()
	}

	play(id, index)
	{
		if(!this.queues.has(id) || !this.queues.get(id).playing)
		 	return
		let info = this.queues.get(id)
		if(index < 0 || info.queue.length <= index)
		{
			info.textChannel.send('Invalid index')
			return
		}
		if(info.connection && info.connection.dispatcher)
			info.connection.dispatcher.end()
		info.playing = true
		info.songIndex = index
		this.queues.get(id).connection.playStream(ytdl(info.queue[info.songIndex].url).on('finish', () => { if(info.playing) this.playNext(id) }))
		this.queues.get(id).connection.dispatcher.setVolumeLogarithmic(info.volume / 100)
		info.textChannel.send('Now playing: *' + info.queue[info.songIndex].title + '*')
	}

	playNext(id)
	{
		if(this.queues.has(id))
		{
			let songIndex = this.queues.get(id).songIndex
			this.play(id, (songIndex < this.queues.get(id).queue.length - 1) ? (songIndex + 1) : 0)
		}
	}

	playPrevious(id)
	{
		if(this.queues.has(id))
		{
			let songIndex = this.queues.get(id).songIndex
			this.play(id, songIndex == 0 ? (this.queues.get(id).queue.length - 1) : (songIndex - 1))
		}
	}

	call(message, params, client)
	{
		if(params[0].toLowerCase() != 'music')
			return
		if(params.length == 1)
		{
			message.channel.send(this.usage(global.tokens.command))
			return
		}
		switch(params[1].toLowerCase())
		{
			default:
			{
				message.channel.send(this.usage(global.tokens.command))
				break
			}
			case 'play':
			{
				if(!this.queues.has(message.member.guild.id))
				{
					message.channel.send('Add a song to the queue to start playing (`music queue add <url>`)')
					break
				}
				let info = this.queues.get(message.member.guild.id)
				if(params.length == 2)
						this.play(message.member.guild.id, info.songIndex || 0)
				else
				{
					if(!isNaN(params[2]))
					{
						let index = parseInt(params[2])
						this.play(message.member.guild.id, index - 1)
					}
					else
					{
						let found = false
						for(let i = 0; i < info.queue.length; i++)
						{
							if(info.queue[i].title.toLowerCase() == params[2].toLowerCase() ||
								info.queue[i].url.toLowerCase() == params[2].toLowerCase())
							{
								this.play(message.member.guild.id, i)
								found = true
								break
							}
						}
						if(!found)
							message.channel.send('Couldn\'t find a song with that name or url')
					}
				}
				break
			}
			case 'pause':
			{
				if(!this.queues.has(message.member.guild.id))
					return
				let info = this.queues.get(message.member.guild.id)
				if(!info.playing || !info.connection || !info.connection.dispatcher)
				{
					message.channel.send('Nothing is playing')
					break
				}
				if(info.connection && info.dispatcher)
				{
					info.playing = false
					info.connection.dispatcher.end()
				}
				this.queues.get(id).playing = false
			}
			case 'join':
			{
				let guild = message.member.guild
				const voiceChannel = message.member.voiceChannel
				if(!voiceChannel)
				{
					message.channel.send('You must be in a voice channel before asking me to join you')
					break
				}
				if(!voiceChannel.permissionsFor(client.user).has('CONNECT'))
				{
					message.channel.send('I can\'t join that channel')
					break
				}
				if(this.queues.has(guild.id) && this.queues.get(guild.id).voiceChannel)
				{
					message.channel.send('Already in a voice chat')
					break
				}
				voiceChannel.join().then(connection =>
				{
					message.channel.send('Joined voice chat \'' + voiceChannel.name + '\'')

					if(!this.queues.has(guild.id))
						this.queues.set(guild.id,
						{
							volume: 100,
							songIndex: 0,
							removeWhenFinished: false,
							queue: []
						})
					let info = this.queues.get(guild.id)
					info.textChannel = message.channel
					info.voiceChannel = voiceChannel
					info.connection = connection
					info.playing = true
					if(info.queue.length > 0)
						this.play(message.member.guild.id, info.songIndex || 0)
				})
				break
			}
			case 'leave':
			{
				if(!message.guild)
					break
				if(this.queues.has(message.guild.id))
				{
					this.queues.get(message.guild.id).voiceChannel.leave()
					this.queues.get(message.guild.id).voiceChannel = undefined
					this.queues.get(message.guild.id).playing = false
					if(this.queues.get(message.guild.id).connection && this.queues.get(message.guild.id).connection.dispatcher)
					{
						this.queues.get(message.guild.id).connection.dispatcher.end()
						this.queues.get(message.guild.id).connection = undefined
					}
				}
				else
					message.channel.send('Not connected to a voice channel')
				break
			}
			case 'next':
			{
				this.playNext(message.member.guild.id)
				break
			}
			case 'prev':
			case 'previous':
			{
				this.playPrevious(message.member.guild.id)
				break
			}
			case 'queue':
			{
				if(params.length == 2)
				{
					message.channel.send(this.usage(global.tokens.command))
					break
				}
				switch(params[2].toLowerCase())
				{
					default: break
					case 'show':
					case 'list':
					{
						let msg = 'Queue:'
						let queue = this.queues.get(message.member.guild.id).queue
						for(let i = 0; i < queue.length; i++)
							msg += '\n [' + (i + 1) + '] *' + queue[i].title + '*'
						message.channel.send(msg)
						return
					}
					case 'add':
					{
						if(params.length == 3)
						{
							message.channel.send('Usage: `music queue add <url>`')
							break
						}
						for(let i = 3; i < params.length; i++)
						{
							ytdl.getInfo(params[i]).then(info =>
							{
								if(!this.queues.has(message.member.guild.id))
									this.queues.set(message.member.guild.id, {
										volume: 100,
										songIndex: 0,
										removeWhenFinished: false,
										queue: []
									})
								this.queues.get(message.member.guild.id).queue.push({ title: info.title, url: info.video_url })
								message.channel.send('Added \'' + info.title + '\' to the queue')
								this.writeQueue()
							})
						}
						return
					}
					case 'remove':
					{
						let guild = message.member.guild
						if(!isNaN(params[3]))
						{
							let index = parseInt(params[3])
							index--
							if(index < 0 || this.queues.get(guild.id).queue.length <= index)
							{
								message.channel.send('No songs found with that index')
								break
							}
							this.queues.get(guild.id).queue.splice(index, 1)
							message.channel.send('Removed from the queue')
							break
						}

						let queue = this.queues.get(guild.id).queue
						for(let i = 0; i < queue.length; i++)
						{
							if(queue[i].title.toLowerCase() == params[3].toLowerCase() ||
								queue[i].url.toLowerCase() == params[3].toLowerCase())
							{
								queue.splice(i, 1)
								i--
							}
						}
						if(queue.length != this.queues.get(guild.id).queue.length)
						{
							this.queues.get(guild.id).queue = queue
							message.channel.send('Removed from queue')
						}
						else
							message.channel.send('Couldn\'t find that in the queue')
						break
					}
					case 'clear':
					{
						this.queues.get(message.member.guild.id).queue = []
						break
					}
				}
				break
			}
			case 'volume':
			{
				if(params.length == 2)
				{
					if(this.queues.has(message.member.guild.id))
						message.channel.send('Current volume: ' + this.queues.get(message.member.guild.id).volume + '%')
					else
						message.channel.send('No volume, no queue. Try `music queue add <url>`')
					break
				}
				params[2] = Utils.replaceAll(params[2], '%', '')
				if(isNaN(params[2])) // isNotANumber
				{
					message.channel.send('Volume must be a number')
					break
				}
				let volume = parseInt(params[2])
				if(!this.queues.has(message.member.guild.id))
					this.queues.set(message.member.guild.id, {
						volume: 100,
						songIndex: 0,
						removeWhenFinished: false,
						queue: []
					})
				if(this.queues.get(message.member.guild.id).connection)
					this.queues.get(message.member.guild.id).connection.dispatcher.setVolumeLogarithmic(volume / 100)
				this.queues.get(message.member.guild.id).volume = volume
				message.channel.send('Volume set to ' + volume + '%')
				break
			}
			case 'removewhenfinished':
			{
				switch(params[2].toLowerCase())
				{
					default:
					case '0':
					case 'false':
						this.queues.get(message.member.guild.id).removeWhenFinished = false
						break
					case '1':
					case 'true':
						this.queues.get(message.member.guild.id).removeWhenFinished = true
						break
				}
				global.db.get('music').set('removeWhenFinished', this.removeWhenFinished).write()
				break
			}
		}
		this.writeQueue()
	}
}
