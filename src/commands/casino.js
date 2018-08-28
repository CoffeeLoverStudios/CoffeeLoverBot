const Utils = require('../utils.js')
const global = require('../global.js')
const Config = require('../config.js')
const Command = require('./command.js')

let config = new Config('commands/casino', {
	minimumLolis: 10,
	defaultLolis: 100,
	rewardValues: {
		customNickname: 1200,
		VIPRole: 3000
	},
	VIPRole: 'Casino VIP',
	gambleMultipliers: {
		simple: 1,
		numberGuess: 4
	},
	jackpot: {
		value: 100,
		initialValue: 100,
		costValue: 100,
		strictValue: true,
		randomize: true
	},
	responses: {
		win: 	[ 'Congrats, you won ${custom_0}' ],
		lose: 	[ 'Well, you just lost ${custom_0} lolis..' ],
		cheat:	[ 'Can you not?' ],
		cheatSuccess: [ 'Huh, I guess that worked.. here\'s ${custom_0} lolis' ],
		cheatFail:	  [ 'Woah it worked?! You just *lost* ${custom_0} lolis' ]
	},
	users: []
})

module.exports = class Casino extends Command
{
	refresh()
	{
		config.refresh()
		this.users = config.get('users', [])
		this.minimumLoliValue = config.get('minimumLolis', 10)
		this.maximumLoliValue = config.get('maximumLolis', 99999)
		this.defaultLoliValue = config.get('defaultLolis', 100)
		this.rewardValues = config.get('rewardValues')
		this.jackpot = config.get('jackpot')
		this.casinoResponses = config.get('responses')
		this.VIPRole = config.get('VIPRole')
		if(!this.jackpot.number || this.jackpot.number < 0)
			this.resetJackpot()
	}

	shouldCall(command) { return command.toLowerCase() == 'casino' || command.toLowerCase() == 'gamble' || command.toLowerCase() == 'jackpot' }

	usage(token)
	{
		return [
			{ usage: `\`${token}casino lolis\`: Shows the amount of *lolis* (currency) you have` },
			{ usage: `\`${token}casino rewards show\`: Shows all rewards` },
			{ usage: `\`${token}casino leaderboard\`: Shows all members in ranking order` },
			{ usage: `\`${token}casino rewards get <reward>\`: Purchases reward` },
			{ usage: `\`${token}casino set <name> <value>\`: Sets the reward value if you have it`},
			{ usage: `\`${token}gamble <amount> <heads/tails | 1-10 | red/black>\`: Gamble your lolis` },
			{ usage: `\`${token}jackpot ${this.jackpot.strictValue ? '' : '<amount> '}<1-100>\`: Guess the number between 1 and 100 to win the jackpot ${this.jackpot.strictValue ? ('(*costs ' + this.jackpot.costValue + ' lolis*)') : ''}` }
		]
	}

	changeLolis(memberID, amount)
	{
		let user = this._getUser(memberID)
		user.lolis += amount

		if(user.lolis <= 0) 					user.lolis = this.minimumLoliValue
		if(user.lolis > this.maximumLoliValue) 	user.lolis = this.maximumLoliValue

		this.users.find(x => x.id == memberID).lolis = user.lolis
		config.set('users', this.users)
	}

	resetJackpot()
	{
		this.jackpot.number = Utils.getRandomNumber(0, 100)
		this.jackpot.value = this.jackpot.initialValue
		config.set('jackpot', this.jackpot)
		this.refresh()
	}

	tryGetReward(userID, reward, channel)
	{
		let user = this._getUser(userID)
		if(reward == 'nickname')
		{
			if(user.rewards.includes('customNickname'))
			{
				Utils.send(channel, 'You already have that reward')
				return
			}
			if(user.lolis >= this.rewardValues.customNickname)
			{
				user.rewards.push('customNickname')
				this.changeLolis(user.id, -this.rewardValues.customNickname)

				this.jackpot.value += this.rewardValues.customNickname
				config.set('jackpot', this.jackpot)

				Utils.send(channel, 'Congratulations, you can use custom nicknames')
			}
			else
				Utils.send(channel, `You require ${this.rewardValues.customNickname - user.lolis} more lolis`)
		}
		else if(reward == 'vip')
		{
			if(user.rewards.includes('vip'))
			{
				Utils.send(channel, 'You already have that reward')
				return
			}
			if(user.lolis >= this.rewardValues.VIPRole)
			{
				if(!channel.guild.available)
				{
					Utils.send(channel, 'Internal error - guild not available')
					return
				}

				let role = channel.guild.roles.find(role => role.name.toLowerCase() == this.VIPRole.toLowerCase())
				if(!role)
				{
					channel.guild.createRole({
						name: this.VIPRole,
						color: '#4286f4'
					})
					.then(role =>
					{
						console.log(`VIP role created - ${role.id}`)

						channel.guild.members.find(x => x.id == user.id).addRole(role)
							.then(Utils.send(channel, 'Welcome to the club'))
							.catch(error =>
							{
								console.error(`Error adding VIP role\n\t${error}\n`)
								Utils.send(channel, 'Internal error - failed to add role\n*"${error}"*')
							})

						let vipChannelName = 'coffeelovers_vip'
						if(!channel.guild.channels.find(x => x.name == vipChannelName))
							channel.guild.createChannel(vipChannelName, 'text', [
								{
									id: channel.guild.id,
									denied: [ 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'READ_MESSAGES', 'SEND_MESSAGES', 'ADD_REACTIONS' ]
								},
								{
									id: role.id,
									allowed: [ 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'READ_MESSAGES', 'SEND_MESSAGES', 'ADD_REACTIONS' ]
								}
							])
							.then(channel => console.log('Created VIP channel'))
							.catch(error =>
							{
								console.error(`Error creating VIP channel\n\t${error}\n`)
								Utils.send(channel, `Internal error - failed to create VIP channel [1]\n*"${error}"*`)
							})
					})
					.catch(error =>
					{
						console.error(`Error creating VIP role\n\t${error}\n`)
						Utils.send(channel, 'Internal error - failed to create VIP role\n*"${error}"*')
					})
				}
				else
					channel.guild.members.find(x => x.id == user.id).addRole(role)
						.then(Utils.send(channel, 'Welcome to the club'))
						.catch(error =>
						{
							console.error(`Error adding VIP role\n\t${error}\n`)
							Utils.send(channel, 'Internal error - failed to add role\n*"${error}"*')
						})

				user.rewards.push('vip')
				this.changeLolis(userID, -this.rewardValues.VIPRole)

				this.jackpot.value += this.rewardValues.customNickname
				config.set('jackpot', this.jackpot)
			}
			else
				Utils.send(channel, `You require ${this.rewardValues.VIPRole - user.lolis} more lolis`)
		}
		else
			Utils.send(channel, 'Unknown reward, check `casino rewards show` for possible rewards')
		this.refresh()
	}

	trySetRewardValue(userID, reward, value, channel)
	{
		let user = this._getUser(userID)
		if(reward == 'nickname')
		{
			if(!user.rewards.includes('customNickname'))
			{
				Utils.send(channel, 'You don\'t have that reward, use `casino rewards get nickname` to purchase')
				return
			}
			if(!value || !value.trim())
			{
				this.users.find(x => x.id == userID).nickname = ''
				config.set('users', this.users)
				Utils.send(channel, 'Cleared nickname')
				this.refresh()
				return
			}
			if(value.length > 20)
			{
				Utils.send(channel, 'Custom nicknames have a maximum length of 20')
				return
			}
			this.users.find(x => x.id == userID).nickname = value
			config.set('users', this.users)
			Utils.send(channel, 'Nickname updated')
			this.refresh()
		}
		else
			Utils.send(channel, 'Unkown reward, check `casino rewards show` for possible rewards')
	}

	call(message, params, client)
	{
		let channel = message.channel
		let sender = message.member
		let user = this._getUser(sender.id, sender.displayName)
		let name = ((user.rewards || []).includes('customNickname') && user.nickname) ? user.nickname : message.sender.displayName

		if(params.length < 2 && params[0] != 'jackpot')
		{
			Utils.send(channel, 'Usage: `casino <lolis|rewards|donate>`, `gamble <amount> <heads/tails | 1-10 | red/black>`, `jackpot <amount> <1-100>`')
			return
		}

		if(params[0].toLowerCase() == 'casino')
		{
			if(params[1].toLowerCase() == 'lolis' || params[1].toLowerCase() == 'loli')
			{
				Utils.send(channel, `${name} has **${user.lolis}** lolis`)
				return
			}

			// only cheat if admin
			if(params[1].toLowerCase() == 'cheat' && Utils.isAdmin(sender))
			{
				this.changeLolis(sender.id, 1000)
				Utils.send(channel, 'Gained *1000* lolis')
				return
			}
			else if(params[1].toLowerCase() == 'leaderboard' || params[1].toLowerCase() == 'top')
			{
				let leaderboard = '**Casino Leaderboard**\n'
				let guildUsers = [];
				(message.guild || message.channel).members.forEach((value, key, map) => guildUsers.push({ remote: value, local: this._getUser(value.id) }) )
				guildUsers = guildUsers.filter(x => x.local.lolis && x.local.lolis > this.defaultLoliValue)
										.sort((a, b) => a.local.lolis == b.local.lolis ? 0 : (a.local.lolis < b.local.lolis ? 1 : -1))
										.forEach(user => leaderboard += ` - \`${user.remote.displayName}\` ${((user.local.rewards || []).includes('customNickname') && user.local.nickname) ? ('*(' + user.local.nickname + ')*') : ''} has *${user.local.lolis || 0} lolis*\n`)
				Utils.send(channel, leaderboard)
			}
			else if(params[1].toLowerCase() == 'rewards')
			{
				if(params.length == 2 || (params.length >= 3 && params[2].toLowerCase() == 'show'))
					Utils.send(channel, '***Casino Rewards***:\n' +
									` - **Nickname** [\`${this.rewardValues.customNickname}\`]: Sets a custom nickname for only the bot, such as *onii-chan*\n` +
									` - **VIP** [\`${this.rewardValues.VIPRole}\`]: Gives the VIP role (*comes with a private chatroom*)`)
				else if(params[2].toLowerCase() == 'get')
				{
					if(params.length < 4)
					{
						Utils.send(channel, 'Usage: `casino rewards get <reward>` (`casino rewards show` for list of rewards)')
						return
					}
					this.tryGetReward(sender.id, params[3].toLowerCase(), message.channel)
				}
				else if(params[2].toLowerCase() == 'set')
				{
					if(params.length == 2)
					{
						Utils.send(channel, 'Usage: `casino rewards set <name> <value> (see `casino rewards show` for reward names)`')
						return
					}
					this.trySetRewardValue(sender.id, params[2].toLowerCase(), params.length == 4 ? params[3] : undefined, channel)
				}
				else
					Utils.send(channel, 'Usage: `casino rewards <show|get>`')
			}
			else if(params[1].toLowerCase() == 'set')
			{
				if(params.length == 2)
				{
					Utils.send(channel, 'Usage: `casino set <name> <value>` (see `casino rewards show` for reward names)')
					return
				}
				this.trySetRewardValue(sender.id, params[2].toLowerCase(), params.length == 4 ? params[3] : undefined, channel)
			}
			else if(params[1].toLowerCase() == 'donate')
			{
				if(params.length < 4)
				{
					Utils.send(channel, 'Usage: `casino donate <receiver> <value>`')
					return
				}
				let receiver = Utils.getUserByName(message.guild, params[2])
				if(!receiver)
				{
					Utils.send(channel, `Couldn't find a user by the name of *'${params[2]}'*`)
					return
				}
				let amount = parseInt(params[3])
				if(!amount || amount < 0)
				{
					Utils.send(channel, 'Invalid amount of lolis')
					return
				}
				if(user.lolis < amount)
				{
					Utils.send(channel, `You only have *${user.lolis}* lolis..`)
					return
				}

				this.changeLolis(sender.id, -amount)
				this.changeLolis(receiver.id, amount)
				channel.send(`You successfully transferred *${amount} lolis*`)
			}
			else
				channel.send('Usage: \`casino <lolis|rewards>\`')
		}
		else if(params[0].toLowerCase() == 'gamble')
		{
			if(params.length < 3)
			{
				Utils.send(channel, 'Usage: `gamble <amount> <heads/tails | 1-10 | red/black>`')
				return
			}

			if(message.content.substring('!gamble'.length).match(/(kick|shake|move|attack|violate|lewd|touch|choke|hit|threaten|beat|kill|destroy|assault|insult|stalk).+(machine|bot|loli)/gi))
			{
				let cheatNumber = Utils.getRandomNumber(0, 100), cheatValue = Utils.getRandom([100, 200, 300, 500])
				if(cheatNumber < 10)
				{
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.cheatSuccess), sender, channel, cheatValue))
					this.changeLolis(sender.id, cheatValue)
				}
				else if(cheatNumber >= 10 && cheatNumber < 25)
				{
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.cheatFail), sender, channel, cheatValue))
					this.changeLolis(sender.id, -cheatValue)
				}
				else
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.cheat), sender, channel))

				this.refresh()
				return
			}

			let value = parseInt(params[1])
			if(!value || value <= 0) { Utils.send(channel, 'Invalid number of lolis to gamble with'); return }
			if(user.lolis < value) { Utils.send(channel, `You only have ${user.lolis} lolis..`); return }

			params[2] = params[2].toLowerCase()
			if(params[2] == 'heads' || params[2] == 'tails' || params[2] == 'red' || params[2] == 'black')
			{
				let generated = Utils.getRandomNumber(1, 100) > 50 ? 1 : 0
				if(generated == 0 && (params[2] == 'heads' || params[2] == 'red') ||
					generated == 1 && (params[2] == 'tails' || params[2] == 'black'))
				{
					let prize = value * this.rewardValues.gambleSimpleMultiplier
					this.changeLolis(sender.id, prize)
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.win), sender, channel, prize))
				}
				else
				{
					this.changeLolis(sender.id, -value)
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.lose), sender, channel, value))
				}
			}
			else
			{
				let userGuess = parseInt(params[2])
				if(!userGuess || userGuess < 0 || userGuess > 10) { Utils.send(channel, 'Guess must be a valid number between *1* and *10*, *heads*, *tails*, *red* or *black*'); return }
				let number = Utils.getRandomNumber(1, 10)
				// console.log(`Attempted gamble - user guess ${userGuess} but was ${number}`)
				if(userGuess == number)
				{
					let prize = value * this.rewardValues.gambleNumberGuessMultiplier
					this.changeLolis(sender.id, prize)
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.win), sender, channel, prize))
				}
				else
				{
					this.changeLolis(sender.id, -value)
					Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.lose), sender, channel, value))
				}
			}
		}
		else if(params[0].toLowerCase() == 'jackpot')
		{
			if(params.length == 1 || params[1].toLowerCase() == 'value')
			{
				Utils.send(channel, `Current jackpot value: **${this.jackpot.value}** lolis`)
				return
			}
			let value = this.jackpot.strictValue ? this.jackpot.costValue : parseInt(params[1])
			if(!value) { channel.send('Invalid number of lolis to gamble with'); return }
			if(user.lolis < value) { channel.send(`You only have ${user.lolis} lolis..`); return }

			let userGuess = parseInt(params[this.jackpot.strictValue ? 1 : 2])
			if(!userGuess || userGuess < 0 || userGuess > 100) { channel.send('Guess must be a valid number between *1* and *100*'); return }

			let number = this.jackpot.randomize ? Utils.getRandomNumber(1, 100) : this.jackpot.number
			if(userGuess == number)
			{
				let prize = this.jackpot.value + value
				this.changeLolis(sender.id, prize)
				Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.win), sender, channel, prize))

				this.resetJackpot()
				Utils.send(channel, `Jackpot has been reset! Current value: **${this.jackpot.value}** lolis`)
			}
			else
			{
				this.changeLolis(sender.id, -value)
				Utils.send(channel, Utils.process(Utils.getRandom(this.casinoResponses.lose), sender, channel, value))

				this.jackpot.value += value
				config.set('jackpot', this.jackpot)
			}
			console.log(`Attempted jackpot - user guess ${userGuess} but was ${number} (updated value: ${this.jackpot.value})`)
		}

		this.refresh()
	}

	// Private functions
	_createUser(memberID, username)
	{
		let user = {
			id: memberID,
			name: username,
			lolis: this.defaultLoliValue,
			nickname: '',
			rewards: []
		}
		this.users.push(user)
		config.set('users', this.users)
		return user
	}

	_getUser(memberID, username) { return this.users.find(x => x.id == memberID) || this._createUser(memberID, username) }
}
