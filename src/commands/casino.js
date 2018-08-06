const Utils = require('../utils.js')
const Command = require('./command.js')
const global = require('../global.js')

module.exports = class filteredPhrases extends Command
{
	constructor()
	{
		super()
		this.refresh()
	}

	refresh()
	{
		this.userData = []
		this.defaultLoliValue = global.db.get('casinoDefaultLolis').value() || 100
		this.rewardValues = global.db.get('casinoRewardValues').value()
		this.jackpot = global.db.get('casinoJackpot').value()
		this.casinoResponses = global.db.get('casinoResponses').value()
		if(this.jackpot.number < 0)
			this.resetJackpot()

		global.db.get('users').filter(user =>
			{
				this.userData.push({
					id: user.id,
					lolis: user.casinoLolis || this.defaultLoliValue,
					nickname: user.casinoNickname || '',
					rewards: user.casinoRewards || []
				})
			}).value()
	}

	shouldCall(command) { return command.toLowerCase() == 'casino' || command.toLowerCase() == 'gamble' || command.toLowerCase() == 'jackpot' }

	usage(token)
	{
		return [
			{ usage: `\`${token}casino lolis\`: Shows the amount of *lolis* (currency) you have` },
			{ usage: `\`${token}casino rewards show\`: Shows all rewards` },
			{ usage: `\`${token}casino rewards get <reward>\`: Purchases reward` },
			// { usage: `\`${token}casino reset\`: Resets your lolis and rewards - useful for when you run out of lolis`},
			{ usage: `\`${token}casino set <name> <value>\`: Sets the reward value if you have it`},
			{ usage: `\`${token}gamble <amount> <heads/tails | 1-10 | red/black>\`: Gamble your lolis` },
			{ usage: `\`${token}jackpot ${this.jackpot.strictValue ? '' : '<amount> '}<1-100>\`: Guess the number between 1 and 100 to win the jackpot ${this.jackpot.strictValue ? ('(*costs ' + this.jackpot.costValue + ' lolis*)') : ''}` }
		]
	}

	changeLolis(user, amount)
	{
		user.lolis += amount
		if(user.lolis <= 0)
			user.lolis = 1
		global.db.get('users').find({ id: user.id }).set('casinoLolis', user.lolis).write()
	}

	resetJackpot()
	{
		this.jackpot.number = Utils.getRandomNumber(0, 100)
		this.jackpot.value = this.jackpot.initialValue
		global.db.set('casinoJackpot', this.jackpot).write()
		this.refresh()
	}

	call(message, params, client)
	{
		let channel = message.channel
		let sender = message.member
		let user = this.userData.find(x => x.id == sender.id)

		let name = (user.rewards.includes('customNickname') ? user.nickname : sender.displayName) || sender.displayName

		if(params.length < 2 && params[0] != 'jackpot')
		{
			channel.send(`Usage: \`casino <lolis|rewards>\`, \`gamble <amount> <heads/tails | 1-10 | red/black>\`, \`jackpot <amount> <1-100>\``)
			return
		}

		if(!user)
		{
			console.log('User not found, refreshing...')
			this.refresh()
			if(!(user = this.userData.find(x => x.id == sender.id)))
			{
				channel.send('Internal error - user not found')
				return
			}
		}

		if(params[0].toLowerCase() == 'casino')
		{
			if(params[1].toLowerCase() == 'lolis' || params[1].toLowerCase() == 'loli')
			{
				channel.send(`${name} has **${user.lolis}** lolis`)
				return
			}

			// only cheat if admin
			if(params[1].toLowerCase() == 'cheat' && global.db.get('adminRoles').value().includes(sender.highestRole.name))
			{
				this.changeLolis(user, 1000)
				channel.send('Gained *1000* lolis')
				this.refresh()
				return
			}

			/*
			else if(params[1].toLowerCase() == 'reset')
			{
				user.lolis = this.defaultLoliValue
				user.rewards = []
				global.db.get('users').find({ id: user.id }).set('casinoRewards', user.rewards).set('casinoLolis', user.lolis).write()
				channel.send(`Your casino has been reset, you now have ${user.lolis} lolis and no rewards`)
			}
			*/
			else if(params[1].toLowerCase() == 'leaderboard' || params[1].toLowerCase() == 'top')
			{
				let leaderboard = '**Casino Leaderboard**\n'
				let leaderboardUsers = global.db.get('users')
					.filter(x => x.casinoLolis)
					.sort((a, b) => a.casinoLolis == b.casinoLolis ? 0 : (a.casinoLolis < b.casinoLolis ? 1 : -1))
					.forEach(user => leaderboard += ` - \`${user.nickname || user.name}\` ${(user.casinoRewards || []).includes('customNickname') ? ('*(' + user.casinoNickname + ')*') : ''} has *${user.casinoLolis || 0} lolis*\n`)
					.value()
				channel.send(leaderboard)
			}
			else if(params[1].toLowerCase() == 'rewards')
			{
				if(params.length < 2)
				{
					channel.send('Usage: `casino rewards <show|get>`')
					return
				}
				if(params[2].toLowerCase() == 'show' || params.length == 2)
					channel.send('***Casino Rewards***:\n' +
									` - **Nickname** [\`${this.rewardValues.customNickname}\`]: Sets a custom nickname for only the bot, such as *onii-chan*`)
				else if(params[2].toLowerCase() == 'get')
				{
					if(params.length < 4)
					{
						channel.send('Usage: `casino rewards get <reward>` (`casino rewards show` for list of rewards)')
						return
					}
					if(params[3].toLowerCase() == 'nickname')
					{
						if(user.rewards.includes('customNickname'))
						{
							channel.send('You already have that reward')
							return
						}
						if(user.lolis >= this.rewardValues.customNickname)
						{
							user.rewards.push('customNickname')
							user.lolis -= this.rewardValues.customNickname
							global.db.get('users').find({ id: user.id }).set('casinoRewards', user.rewards).set('casinoLolis', user.lolis).write()

							this.jackpot.value += this.rewardValues.customNickname
							global.db.set('casinoJackpot', this.jackpot).write()

							channel.send('Congratulations, you can use custom nicknames')
						}
						else
							channel.send(`You require ${this.rewardValues.customNickname - user.lolis} more lolis`)
					}
					else
						channel.send('Unknown reward, check `casino rewards show` for possible rewards')
				}
			}
			else if(params[1].toLowerCase() == 'set')
			{
				if(params.length < 3)
				{
					channel.send('Usage: `casino set <name> <value>` (see `casino rewards show` for reward names)')
					return
				}
				if(params[2].toLowerCase() == 'nickname')
				{
					if(!user.rewards.includes('customNickname'))
					{
						channel.send('You don\'t have that reward, use `casino rewards get nickname` to purchase')
						return
					}
					if(params.length == 3 || !params[3].trim())
					{
						global.db.get('users').find({ id: user.id }).set('casinoNickname', '').write()
						channel.send('Cleared nickname')
						this.refresh()
						return
					}
					if(params[3].length > 20)
					{
						channel.send('Custom nicknames have a maximum length of 20')
						return
					}
					global.db.get('users').find({ id: user.id }).set('casinoNickname', params[3]).write()
					channel.send('Nickname updated')
				}
				else
					channel.send('Unkown reward, check `casino rewards show` for possible rewards')
			}
		}
		else if(params[0].toLowerCase() == 'gamble')
		{
			if(params.length < 3)
			{
				channel.send('Usage: `gamble <amount> <heads/tails | 1-10 | red/black>`')
				return
			}

			if(params[1].toLowerCase() == 'shake' && params[2].toLowerCase() == 'the' && params[3].toLowerCase() == 'machine')
			{
				let cheatNumber = Utils.getRandomNumber(0, 100), cheatValue = Utils.getRandom([100, 200, 300, 500])
				if(cheatNumber < 10)
				{
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.cheatSuccess), sender, channel, cheatValue))
					this.changeLolis(user, cheatNumber)
				}
				else if(cheatNumber >= 10 && cheatNumber < 25)
				{
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.cheatFail), sender, channel, cheatValue))
					this.changeLolis(user, -cheatValue)
				}
				else
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.cheat), sender, channel))

				this.refresh()
				return
			}

			let value = parseInt(params[1])
			if(!value) { channel.send('Invalid number of lolis to gamble with'); return }
			if(user.lolis < value) { channel.send(`You only have ${user.lolis} lolis..`); return }

			params[2] = params[2].toLowerCase()
			if(params[2] == 'heads' || params[2] == 'tails' || params[2] == 'red' || params[2] == 'black')
			{
				let generated = Utils.getRandomNumber(1, 100) > 50 ? 1 : 0
				if(generated == 0 && (params[2] == 'heads' || params[2] == 'red') ||
					generated == 1 && (params[2] == 'tails' || params[2] == 'black'))
				{
					let prize = value * this.rewardValues.gambleSimpleMultiplier
					this.changeLolis(user, prize)
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.win), sender, channel, prize))
				}
				else
				{
					this.changeLolis(user, -value)
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.lose), sender, channel, value))
				}
			}
			else
			{
				let userGuess = parseInt(params[2])
				if(!userGuess || userGuess < 0 || userGuess > 10) { channel.send('Guess must be a valid number between *1* and *10*, *heads*, *tails*, *red* or *black*'); return }
				let number = Utils.getRandomNumber(1, 10)
				// console.log(`Attempted gamble - user guess ${userGuess} but was ${number}`)
				if(userGuess == number)
				{
					let prize = value * this.rewardValues.gambleNumberGuessMultiplier
					this.changeLolis(user, prize)
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.win), sender, channel, prize))
				}
				else
				{
					this.changeLolis(user, -value)
					channel.send(Utils.process(Utils.getRandom(this.casinoResponses.lose), sender, channel, value))
				}
			}
		}
		else if(params[0].toLowerCase() == 'jackpot')
		{
			if(params.length == 1 || params[1].toLowerCase() == 'value')
			{
				channel.send(`Current jackpot value: **${this.jackpot.value}** lolis`)
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
				this.changeLolis(user, prize)
				channel.send(Utils.process(Utils.getRandom(this.casinoResponses.win), sender, channel, prize))

				this.resetJackpot()
				channel.send(`Jackpot has been reset! Current value: **${this.jackpot.value}** lolis`)
			}
			else
			{
				this.changeLolis(user, -value)
				channel.send(Utils.process(Utils.getRandom(this.casinoResponses.lose), sender, channel, value))

				global.db.get('casinoJackpot').set('value', this.jackpot.value + value).write()
			}
			console.log(`Attempted jackpot - user guess ${userGuess} but was ${number} (updated value: ${this.jackpot.value})`)
		}

		this.refresh()
	}
}
