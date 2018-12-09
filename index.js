//TODO Reset de score
//TODO Palier de score

const Discord = require("discord.js");
const fs = require('fs');
const talkedRecently = new Set();

var bot = new Discord.Client();

const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');


const PREFIX = "*";
const ADMIN_PREFIX = "gem@";


var file = "";
var image_file = "";
var image_extend = ""


fs.readdir("GIF", function(err, folder) {
 
	for (var i=0; i<folder.length; i++) {
		var wextend = folder[i];		//wextend = with extend (exemple.gif)
		file = wextend.split(".");	//file = [exemple, gif]
		if (image_file == ""){
			image_file += file[0];
			image_extend += wextend;
		} else {			
			image_file += "	";
			image_file += file[0];
			image_extend += "	";
			image_extend += wextend;
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

///// Admin Use
bot.on("message", async function(message){
	if (message.author.equals(bot.user)) return;
	if (!message.content.startsWith(ADMIN_PREFIX)) return;
	if (message.author.id != "178483636671086592" && message.author.id != "242355725852999683" ) return;
	let score;
	var args = message.content.substring(ADMIN_PREFIX.length).split(" ");
	score = bot.getScore.get(message.author.id, message.guild.id);
	switch (args[0].toLowerCase()){
		
		case "ping":
			message.channel.send("I'm alive !");
			break
		
		case "give":
			const user = message.mentions.users.first() || bot.users.get(args[1]);
			if(!user) return message.reply("You must mention someone or give their ID!");
			
			const pointsToAdd = parseInt(args[2], 10);
			if(!pointsToAdd) return message.reply("You didn't tell me how many points to give...")
			
			// Get their current points.
			let userscore = bot.getScore.get(user.id, message.guild.id);
			// It's possible to give points to a user we haven't seen, so we need to initiate defaults here too!
			if (!userscore) {
				userscore = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, points: 0, level: 1 }
			}
			userscore.points += pointsToAdd;
			
			// We also want to update their level (but we won't notify them if it changes)
			let userLevel = Math.floor(0.2 * Math.sqrt(score.points));
			userscore.level = userLevel;
			
			// And we save it!
			bot.setScore.run(userscore);
			message.channel.send(`${user.tag} has received ${pointsToAdd} points and now stands at ${userscore.points} points.`);
			break
	}
})


///// Clasic use 
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
			var non = 1;
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
		
		switch (args[0].toLowerCase()){
		
			case "ping":
				message.channel.send("You're not an admin, just saying");
				break
				
			case "level":
				message.reply(`You currently have ${score.points} points and are level ${score.level}!`);
				break
			
			case "top":
				const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(message.guild.id);
	 
				// Now shake it and show it! (as a nice embed, too!)
				const embed = new Discord.RichEmbed()
					.setTitle("Leaderboard")
					.setAuthor(bot.user.username, bot.user.avatarURL)
					.setDescription("```markdown\n# Our top 10 points leaders!```")
					.setColor(0x00AE86);
				 
				for(const data of top10) {
					embed.addField(bot.users.get(data.user).tag, `${data.points} points (level ${data.level})`);
				}
				
				message.channel.send({embed});
				break
			
			case "list":
				var helplist = image_file.split("	")
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
				break
				
			default:
				split_extend = image_extend.split("	");
			
				split_file = image_file.split("	");
				search_file = split_file.find(function(str) { return str == args[0]; });
				if (search_file != undefined){
					var extend = ""
					split_extend.forEach(function(element) {
						var toto = element.slice(0, element.length - 4);
						if(toto == args[0]){
							extend = element.slice(toto.length, element.length);
						}
					})
					
					message.channel.send({
						files: [{
							attachment: 'GIF/'+args[0]+ extend,
							name: args[0]+ extend
						}]
					});
				}				
		}		
})

bot.login(process.env.BOT_TOKEN);