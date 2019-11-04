const hltv = require('./hltv/hltv.js');
const config = require("./config.json");
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (!msg.content.startsWith(config.prefix) || msg.author.bot) return;

    if(msg.content.startsWith(config.prefix + "cs")){
        let t = msg.content.split(" ");
        if(!t[1]){
            msg.channel.send("Please specify a team name!");
            return;
        }

        hltv.getTeamInfo(t[1], msg);
    }
    else if(msg.content.startsWith(config.prefix + "penny")){
        msg.channel.send("I'm combat ready!");
    }
});

client.login(config.token);

/*
TODO: ADD TIMEZONE
*/