const Discord = require('discord.js');
const Auth = require('./auth.json');

const bot = new Discord.Client();
bot.login(Auth.token);

var data = {};
function fetchRecursive(msg, limit, after, before) {
    if (data[msg.channelID] === undefined)
        return;
    msg.channel.fetchMessages({
        before: before,
        limit: limit,
    }).then(function(list){
        cancel = false;
        list.forEach(function(item) {
            if (item.id > after) {
                if (!msg.deleted)
                    data[msg.channelID].messages[item.member.user.id] = item.member.displayName + ': ' + item.content + ' (' + item.url + ')';
            } else {
                cancel = true;
            }
        });

        if (cancel) {
            data[msg.channelID].messages = Object.values(data[msg.channelID].messages);
            msg.reply(data[msg.channelID].messages.length + " messages in roll");
            return;
        }
        fetchRecursive(msg, limit, after, list.last().id);
    }, function(err){msg.channel.send("ERROR: ERROR FETCHING CHANNEL.");console.log(err)});

}

bot.on('message', function (msg) {

    if (!msg.member.hasPermission('ADMINISTRATOR'))
        return;

    if (msg.content.startsWith("!")) {
        var args = msg.content.split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case '!start':
                data[msg.channelID] = {
                    after: msg.id,
                    before: null,
                    limit: 100,
                    messages: []
                };
                break;
            case '!stop':
                if (data[msg.channelID] !== undefined) {
                    data[msg.channelID].before = msg.id;
                    fetchRecursive(msg, data[msg.channelID].limit, data[msg.channelID].after, data[msg.channelID].before);
                } else {
                    msg.reply('You should `!star` first');
                }
                break;
            case '!random':
                if (data[msg.channelID] === undefined || !data[msg.channelID].before) {
                    msg.reply('You should `!star` then `!stop` first');
                } else {
                    var items = data[msg.channelID].messages;
                    msg.reply(items[Math.floor(Math.random()*items.length)]);
                }
                break;
            case '!file':
                if (data[msg.channelID] === undefined || !data[msg.channelID].before) {
                    msg.reply('You should `!star` then `!stop` first');
                } else {
                    var items = data[msg.channelID].messages;
                    msg.reply("qq!", {
                        file: {
                            attachment: Buffer.from(items.join("\n"), 'utf-8'),
                            name: 'messages.txt'
                        }
                    });
                }
                break;
        }
    }
});