const Discord = require("discord.js");
const fs = require('fs');

var bot = new Discord.Client();

const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');


const PREFIX = "*";


var file = "";
var helpmsg = "";

fs.readdir("GIF", function(err, folder) {
 
	for (var i=0; i<folder.length; i++) {
		const wextend = folder[i];		//wextend = with extend (exemple.gif)
		file = wextend.split(".");	//file = [exemple, gif]
		helpmsg += file[0];
		helpmsg += "	";
	}
});


bot.on("ready", function(){
	const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
	if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
		// Ensure that the "id" row is always unique and indexed.
		sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
		sql.pragma("synchronous = 1");
		sql.pragma("journal_mode = wal");
	}
 
	  // And then we have two prepared statements to get and set the score data.
	  bot.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
	  bot.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");
	
	
	console.log("GEM sens pret !")
	bot.user.setActivity("with Kongo's nerves");
})

bot.on("message", function(message){
	if (message.author.equals(bot.user)) return;
	let score;
	
	
	var args = message.content.substring(PREFIX.length).split(" ");
	
	if (message.guild){
		score = bot.getScore.get(message.author.id, message.guild.id);
		if (!score) {
			score = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, points: 0, level: 1 }
		}
		score.points++;
		const curLevel = Math.floor(0.2 * Math.sqrt(score.points));
		if(score.level < curLevel) {
			score.level++;
			message.reply(`You've leveled up to level **${curLevel}**! Ain't that dandy?`);
			}
		bot.setScore.run(score);
	}
		
		if (args[0] == "level"){
			return message.reply(`You currently have ${score.points} points and are level ${score.level}!`);
			
		
		} else {
		
		
		if (!message.content.startsWith(PREFIX)) return;
		
		
		if (args[0] == "help"){
				message.channel.send(helpmsg);
		} else {
			split = helpmsg.split("	");
			search = split.find(function(str) { return str == args[0]; });
			if (search != undefined){
				message.channel.send({
					files: [{
						attachment: 'GIF/'+args[0]+'.gif',
						name: args[0]+'.gif'
					}]
				});
			}
			
			
		}}
		
})

bot.login(process.env.BOT_TOKEN);