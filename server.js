const { Client, Util } = require('discord.js');
const {prefix} = require("./config.json");
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const opus = require("node-opus");
const gyp = require("node-gyp");
const Discord = require("discord.js");

const client = new Client({ disableEveryone: true });
const Youtube = new Youtube(process.env.yt_api);

const queue = new Map

client.on('warn', console.warn);
client.on('error', console.error);

client.on('ready', () => {
  console.log(`${client.user.tag} Omg ready`);
});

client.login(process.env.TOKEN);
