var Discord = require('discord.io');
var bot = new Discord.Client({
	autorun: true,
	token: 'MzY0MzY3Mzk5NTM4OTE3Mzc3.DLOwgA.dCvPVzF7mIrLnPA6tzkDT-WO3Ss'
});


bot.on('ready', function() {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', function(user, userID, channelID, message, event) {
	if(message === 'coffeebot')
	{
		bot.sendMessage({
			to: channelID,
			message: "WHAT?!"
		});
	}
});
