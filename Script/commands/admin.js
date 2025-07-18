const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
	name: "admin",
	version: "1.0.3", // Updated version for this revision
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Display information about the bot operator",
	commandCategory: "info",
	cooldowns: 1
};

module.exports.languages = {
	"en": {
		"message": `══✦ Bot Operator Info ✦══
Name: Alex Jhon Ponce
Gender: Male
Age: 15
Status: Single
Occupation: Student
Hobby: Coding
Facebook: https://www.facebook.com/100085861488156
Page: https://www.facebook.com/share/1ZyfGgpSHj/
Quote: "I Will Always Make This Bot Free For Everyone."
Telegram: +63 910 541 8124
Contact: Inbox for email or further details
══✦ Powered by AlexRebornV2 ✦══`
	}
};

module.exports.run = async function ({ api, event, getText }) {
	return api.sendMessage(getText("message"), event.threadID, event.messageID);
};
