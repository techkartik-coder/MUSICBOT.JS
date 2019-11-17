const http = require('http');
http.createServer(function(request,responce)
                  {
  responce.writeHead(200, {'Content-Type': 'text/plain'});
}).listen(3000);

const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY, COLOR, STATUS, CMDNAME } = require('./config');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const Discord = require("discord.js");

const client = new Client({ disableEveryone: true });

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map(); 

client.on('message', message => {
  if (message.content === `${PREFIX}ping`) {
    message.reply('pong');
  }
});

client.on('message', message => {
  if (message.content === `${PREFIX}help`) {
    var embed = new Discord.RichEmbed()
    .setTitle('MUSIC COMMANDS')
    .setColor(`${COLOR}`)
    .setDescription(`${PREFIX}play, ${PREFIX}skip, ${PREFIX}np, ${PREFIX}volume, ${PREFIX}stop, ${PREFIX}resume, ${PREFIX}queue, ${PREFIX}pause, ${PREFIX}clean`);
    message.channel.send(embed);
  }
});


client.on('warn', console.warn);

client.on('error', console.error);


client.on('ready', () => {
      

  console.log(`${client.user.tag} Yo this ready!`)
        client.user.setActivity(`${STATUS}`);
    
});

client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));

client.on('reconnecting', () => console.log('I am reconnecting now!'));

client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(PREFIX)) return undefined;

	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)

	if (command === 'play') {
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT')) {
            return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
        }
        if (!permissions.has('SPEAK')) {
            return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
        }

        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
          var embed = new Discord.RichEmbed()
                .setTitle("Song Selection")
                .setDescription(`✅ Song has been added to the queue!`)
                .setColor(`${COLOR}`)
            return msg.channel.send(embed);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                msg.react('✅');
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    // eslint-disable-next-line max-depth
                  
                  
                    var video = await youtube.getVideoByID(videos[1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send('🆘 I could not obtain any search results.');
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
	} else if (command === 'skip') {
    if (!msg.member.hasPermission("ADMINISTRATOR")) {
      return msg.reply('YOU DIDENT HAVE ADMINISTRATOR PERMISSIONS!')
    }
    
    
    
		if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
		serverQueue.connection.dispatcher.end('Skip command has been used!');
    const embed = new Discord.RichEmbed()
    .setTitle('Song')
    .setColor(`${COLOR}`)
    .setDescription('✅ Successfully skipped the song');
    msg.channel.send(embed);
    
		return undefined;
	} else if (command === 'stop') {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could stop for you.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        msg.reply("**bot has been stopped !**");
        return undefined;
	} else if (command === 'volume') {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		if (!args[1]) return msg.channel.send(`The current volume is: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 4);
		return msg.channel.send(`I set the volume to: **${args[1]}**`);
	} else if (command === 'clean') {
    if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('Quene is already empty');
     msg.channel.send(`Cleared the queue`).then(m => serverQueue.connection.dispatcher.clear());
  } else if (command === 'duration') {
    if (!msg.member.voiceChannel) return msg.channel.send('Please join voice channel first');
    if (!serverQueue) return msg.channel.send('There is nothing playing');
                  let data = await Promise.resolve(ytdl.getInfo(serverQueue.songs[0].url));
        let duration = (data.length_seconds * 1000).toFixed(0);
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return msg.channel.send(`Song duration is - ${hours}h:${minutes}m:${seconds}s`);
}

  
  else if (command === 'np') {
    var embed = new Discord.RichEmbed()
    .setTitle("Song Detail")
    .setDescription(`🎶 \`Now playing:\` **${serverQueue.songs[0].title}**`)
    .setColor(`${COLOR}`)
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		return msg.channel.send(embed);

} else if (command === 'queue') {
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		var embed = new Discord.RichEmbed()
                .setTitle("Song Queue")
                .setDescription(`${serverQueue.songs.map(song => `**• ** ${song.title}`).join('\n')}

🎵 \`Now playing:\` **${serverQueue.songs[0].title}**`)
                .setColor(`${COLOR}`)
    return msg.channel.send(embed);
	} else if (command === 'pause') {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            var embed = new Discord.RichEmbed()
                .setTitle("Song")
                .setDescription(`⏸ Paused the music for you!`)
                .setColor(`${COLOR}`)
            msg.channel.send(embed)
          
           }
          } else if (command === 'resume') {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            var embed = new Discord.RichEmbed()
                .setTitle("Song")
                .setDescription(`▶ Resumed the music for you!`)
                .setColor(`${COLOR}`)
            msg.channel.send(embed)
        }
    } 

});


async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 10,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
    var embed = new Discord.RichEmbed()
                .setTitle("Song Selection")
                .setDescription(`✅ Song has been added to the queue!`)
                .setColor(`${COLOR}`)
		 return msg.channel.send(embed);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') 
      console.log('Song ended');
       else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
             
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 10);

	var embed = new Discord.RichEmbed()
        .setTitle("Song Selection")
        .setDescription(`🎵 \`Start playing:\` **${song.title}**`)
        .setColor(`${COLOR}`)
    serverQueue.textChannel.send(embed);
}
          


client.login(TOKEN);
