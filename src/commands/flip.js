  module.exports = class flipcoin
  {
    shouldCall(command) {if(command == "flipcoin") return true
  else return false }
  call(sender, channel, params, client)
    {
    var flipcoin = Math.random()
    if(flipcoin > 0.3)
        {
          channel.send("your coin flip was tails")
        }
      else channel.send("your coin flip was heads")
    }
  }
