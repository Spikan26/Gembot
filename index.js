//TODO Gerer les png et jpg (autre format) --> avec l'extension ??

const Discord = require("discord.js");
const fs = require('fs');
const talkedRecently = new Set();

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
		if (helpmsg == ""){
			helpmsg += file[0];
		} else {			
			helpmsg += "	";
			helpmsg += file[0];
		}
		
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

bot.on("message", async function(message){
	if (message.author.equals(bot.user)) return;
	let score;
	
	
	var args = message.content.substring(PREFIX.length).split(" ");
	
	if (message.guild){
		score = bot.getScore.get(message.author.id, message.guild.id);
		if (!score) {
			score = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, points: 0, level: 1 }
		}
		if (talkedRecently.has(message.author.id)){
			console.log("Slow down !!");
		} else {
			score.points++;
			// Adds the user to the set so that they can't talk for 2.5 seconds
			talkedRecently.add(message.author.id);
			setTimeout(() => {
				// Removes the user from the set after 2.5 seconds
				talkedRecently.delete(message.author.id);
			}, 60000);
		}
		const curLevel = Math.floor(0.2 * Math.sqrt(score.points));
		if(score.level < curLevel) {
			score.level++;
			message.reply(`You've leveled up to level **${curLevel}**! You become harder !`);
			}
		bot.setScore.run(score);
	}
	
		if (!message.content.startsWith(PREFIX)) return;
		
		
		if (args[0] == "level"){
			return message.reply(`You currently have ${score.points} points and are level ${score.level}!`);
			
		
		} else {
		
		
		
		if (args[0] == "help"){
				var helplist = helpmsg.split("	")
				msgembed = "";
				currentpage = 1;
				limit = Math.ceil(helplist.length / 50)
				var authormenu = message.author.id;
				var authornick = message.author.username
				var i = (currentpage - 1) * 50;
				for(var j=0;j<5; j++){
					for(var i;i<(j*10)+10; i++){
						if(helplist[i] != undefined){
							msgembed += "**" + helplist[i] + "** | ";
						} else {
							msgembed += "";
						}
					}
				}
				message.delete();
				message.channel.send({
					"embed": {
						"title": "Page "+currentpage+"/"+limit+"			" + authornick,
						"description": "\n" + msgembed,
						"color": 5536943
					}
				}).then(async function (message) {
						await message.react('⏪');
						await message.react('⏩');
						await message.react('❌')
						.then(() => {
							const filter = (reaction, user) => reaction.emoji.name === '⏪' || reaction.emoji.name === '❌' || reaction.emoji.name === '⏩' && user.id === authormenu;
							const collector = message.createReactionCollector(filter);
							collector.on('collect', function(r){
								if(r.count > 1){	
									if (r.emoji.name == '❌'){
										message.delete();
									} else if(r.emoji.name == '⏪') {
										if(currentpage > 1){
											currentpage--;
											msgembed = "";
											var i = (currentpage - 1) * 50;
											for(var j=0;j<5; j++){
												for(var i;i<((currentpage -1) *50)+(j*10)+10; i++){
													if(helplist[i] != undefined){
														msgembed += "**" + helplist[i] + "** | ";
													} else {
														msgembed += "";
													}
												}
												msgembed += "\n";
											}
											const newEmbed = new Discord.RichEmbed({
												title: "Page "+currentpage+"/"+limit+"			" + authornick,
												description: "\n" + msgembed,
												"color": 5536943
											});
										
											message.edit(newEmbed)
											message.reactions.get('⏪').remove(authormenu);
										} else {
											message.reactions.get('⏪').remove(authormenu);
										}
									}else if(r.emoji.name == '⏩') {
										if(currentpage < limit){
											currentpage++;
											msgembed = "";
											var i = (currentpage - 1) * 50;
											for(var j=0;j<5; j++){
												for(var i;i<((currentpage -1) *50)+(j*10)+10; i++){
													if(helplist[i] != undefined){
														msgembed += "**" + helplist[i] + "** | ";
													} else {
														msgembed += "";
													}
												}
												msgembed += "\n";
											}
											const newEmbed = new Discord.RichEmbed({
												title: "Page "+currentpage+"/"+limit+"			" + authornick,
												description: "\n" + msgembed,
												"color": 5536943
											});
										
											message.edit(newEmbed)
											message.reactions.get('⏩').remove(authormenu);
										} else {
											message.reactions.get('⏩').remove(authormenu);
										}
									}
								}
							})
						})
					
					})									
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