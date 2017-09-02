const TelegramBot = require('node-telegram-bot-api');
var sqlite3 = require('sqlite3').verbose();
var moment = require('moment');

var db = new sqlite3.Database('db.db');
const token = '';
const bot = new TelegramBot(token, {polling: true});

var temp = {};

bot.on('message', function(msg){
	console.log('Received:' + JSON.stringify(msg));

	if(msg.text == '@edit_history_bot'){
		var str = '';
		//console.log("SELECT * FROM `messages` WHERE id LIKE '"+msg.reply_to_message.message_id+"_%' ORDER BY `timestamp` ASC;");
		db.each("SELECT * FROM `messages` WHERE id LIKE ? ORDER BY `timestamp` ASC;", msg.reply_to_message.message_id + '_%', function(err, row){
			//console.log(row);
			str += (moment.unix(row.timestamp).format("YYYY-MM-DD hh:mm:ss a") + ' : ' + row.message + "\r\n" );
		}, function(){
			try{
				if(str == '')
					str = 'No record found';
				
				bot.sendMessage(msg.chat.id, str);
			}catch(err){
				console.log(err);
			}
		});
	}else{
		msg.edit_date = msg.date;
		temp[msg.message_id] = msg;
		//console.log(temp);
	}

  	
  	
});
bot.on('edited_message_text', function(msg){
	console.log('Received:' + JSON.stringify(msg));
	//Insert original message
	db.run("INSERT INTO `messages`(`id`,`username`,`message`,`timestamp`) VALUES (?,?,?,?);", [ temp[msg.message_id].message_id + '_' + temp[msg.message_id].edit_date, temp[msg.message_id].from.id, temp[msg.message_id].text, temp[msg.message_id].edit_date ]);
	
	temp[msg.message_id] = msg;
	//console.log(temp);
  	//bot.sendMessage(chatId, 'Received:' + JSON.stringify(msg));
});

setInterval(function(){
	for (var key in temp) {
	  	if (temp.hasOwnProperty(key)) {
	  		if(moment.now() - temp[key].edit_date > 60 * 60 * 1000){
	  			delete temp[key];
	  		}
	  	}
	}
	//console.log(temp);
}, 60 * 60 * 1000)