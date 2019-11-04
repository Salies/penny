const rp = require('request-promise');
const cheerio = require('cheerio'); 
const fs = require('fs');
const svg2img = require('svg2img');
const Discord = require('discord.js');

const teams = require(`${__dirname}/teams.json`);

function formatUnixDate(unix){
    let date = new Date(Number(unix));

    return `${date.getUTCDate()}/${date.getUTCMonth()} ${date.getUTCHours()}:${date.getUTCMinutes()}`;
}

module.exports.getTeamInfo = function (name, message) {
    if (!teams[name.toLowerCase()]) {
        message.channel.send(`Couldn't find team "${name}".`);
    }

    let id = teams[name.toLowerCase()];

    let options = {
        uri: `https://www.hltv.org/team/${id}/-`,
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    rp(options).then($ => {
        let teamName = $("body > div.bgPadding > div > div.colCon > div.contentCol > div > div.standard-box.profileTopBox.clearfix > div.flex > div.profile-team-container.text-ellipsis > div.profile-team-info > div.profile-team-name.text-ellipsis").text();
        let ranking = $("body > div.bgPadding > div > div.colCon > div.contentCol > div > div.standard-box.profileTopBox.clearfix > div.profile-team-stats-container > div:nth-child(1) > span > a").text().substr(1);
        let countryImgSrc = $("body > div.bgPadding > div > div.colCon > div.contentCol > div > div.standard-box.profileTopBox.clearfix > div.flex > div.profile-team-container.text-ellipsis > div.profile-team-info > div.team-country.text-ellipsis > img");
        let countryName = countryImgSrc.attr('title');
        let countryFlagCode = countryImgSrc.attr('src').substr(46, 2);

        let embed = new Discord.RichEmbed()
            .setColor('#2b6ea4')
            .setTitle(`Showing status for ${teamName}`)
            .setURL(`https://www.hltv.org/team/${id}/-`)
            .addField(teamName, `:flag_${countryFlagCode.toLowerCase()}: ${countryName}`)
            .addField('Current Ranking', ranking, false)
            .setTimestamp()
            .setFooter('HLTV.org');

        let matchTable = $(".match-table");
        let mts = matchTable.get().length;

        let lastMatch, nextMatch, nmd, lost;

        if (mts == 0) {
            embed.addField('Last Match', "-", true).addField('Next Match', "-", true);
        }
        else if (mts == 1) {
            lastMatch = "#matchesBox > table > tbody:nth-child(3) > tr:nth-child(1)";
            lost = $(`${lastMatch} .score:first-of-type`).hasClass('lost');

            embed.addField('Last Match', `${lost ? "LOST" : "WON"} vs ${$(`${lastMatch} span.team-2`).text()}`, true);

            embed.addField('Next Match', "-", true);
        }
        else if (mts == 2) {
            lastMatch = "#matchesBox > table:nth-child(8) > tbody:nth-child(3) > tr:nth-child(1)";
            lost = $(`${lastMatch} .score:first-of-type`).hasClass('lost');

            embed.addField('Last Match', `${lost ? "LOST" : "WON"} vs ${$(`${lastMatch} span.team-2`).text()}`, true);

            nextMatch = "#matchesBox > table:nth-child(5) > tbody:nth-child(3) > tr";
            nmd = $(`${nextMatch} .date-cell span`).first().attr('data-unix');

            embed.addField('Next Match', `${formatUnixDate(nmd)} vs ${$(`${nextMatch} span.team-2`).first().text()}`, true)
        }

        //(MAYBE) TODO: REDO ABOVE WITH + 5

        fs.exists(`${__dirname}/logos/${id}.png`, exists => {
            if (!exists) {
                svg2img(
                    `https://static.hltv.org/images/team/logo/${id}`,
                    { 'width': 128, 'height': 128, preserveAspectRatio: true },
                    function (error, buffer) {
                        //TODO: ADD TRY PNG
                        if (error) { return error }

                        fs.writeFile(`${__dirname}/logos/${id}.png`, buffer, writeError => {
                            if (writeError) { return writeError }

                            embed.attachFile(`${__dirname}/logos/${id}.png`).setThumbnail(`attachment://${id}.png`);
                            message.channel.send(embed);
                        });
                    });
            }
            else {
                embed.attachFile(`${__dirname}/logos/${id}.png`).setThumbnail(`attachment://${id}.png`);
                message.channel.send(embed);
            }
        });

    }).catch(err => {
        console.log(err);
        return false;
    });
}