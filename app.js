const rp = require('request-promise');
const cheerio = require('cheerio'); 
const fs = require('fs');
const svg2img = require('svg2img');
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

function getTeamInfo(id, nameid, message){
    message.channel.send("oi");

    let options = {
        uri: `https://www.hltv.org/team/${id}/${nameid}`,
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    rp(options).then( $ => {
        let teamName = $("body > div.bgPadding > div > div.colCon > div.contentCol > div > div.standard-box.profileTopBox.clearfix > div.flex > div.profile-team-container.text-ellipsis > div.profile-team-info > div.profile-team-name.text-ellipsis").text();
        let ranking = $("body > div.bgPadding > div > div.colCon > div.contentCol > div > div.standard-box.profileTopBox.clearfix > div.profile-team-stats-container > div:nth-child(1) > span > a").text().substr(1);
        let countryImgSrc = $("body > div.bgPadding > div > div.colCon > div.contentCol > div > div.standard-box.profileTopBox.clearfix > div.flex > div.profile-team-container.text-ellipsis > div.profile-team-info > div.team-country.text-ellipsis > img");
        let countryName = countryImgSrc.attr('title');
        let countryFlagCode = countryImgSrc.attr('src').substr(46, 2);

        let embed = new Discord.RichEmbed()
        .setColor('#2b6ea4')
        .setTitle(`Showing status for ${teamName}`)
        .setURL(`https://www.hltv.org/${id}/${nameid}`)
        .addField(teamName, `:flag_${countryFlagCode.toLowerCase()}: ${countryName}`)
        .addField('Current Ranking', ranking, false)
        .setTimestamp()
        .setFooter('HLTV.org');

        fs.exists(`logos/${id}.png`, exists => { 
            if(!exists){
                console.log('não existe');

                svg2img(
                    `https://static.hltv.org/images/team/logo/${id}`,
                    {'width':128, 'height':128, preserveAspectRatio:true},
                    function(error, buffer) {
                        if(error){return error}

                        fs.writeFile(`logos/${id}.png`, buffer, writeError=>{
                            if(writeError){return writeError}

                            embed.attachFile(`logos/${id}.png`).setThumbnail(`attachment://${id}.png`);
                            message.channel.send(embed);
                        });
                });
            }
            else{
                console.log('existe');
                embed.attachFile(`logos/${id}.png`).setThumbnail(`attachment://${id}.png`);
                message.channel.send(embed);
            }
        });
          
     }).catch(err => {
         console.log("deu ruim " + err);
    });
}

client.on('message', msg => {
    if(msg.content.startsWith("!")){
        getTeamInfo("9215", "mibr", msg);
    }
});

client.login('');