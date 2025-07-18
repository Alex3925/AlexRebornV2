const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
	name: "callad",
	version: "1.0.1", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Report a bug or message to bot admins",
	commandCategory: "admin",
	usages: "[message]",
	cooldowns: 5,
	dependencies: {
		"fs-extra": "",
		"path": "",
		"axios": "",
		"moment-timezone": ""
	}
};

module.exports.languages = {
	"en": {
		"noReportContent": "❌ Please provide a message or attachment to report.",
		"successSend": "✅ Report sent to %1 admin(s).",
		"reportFrom": "══✦ Report to Admins ✦══\nFrom: %1\nUser ID: %2\nGroup: %3\nGroup ID: %4\n\nMessage: %5\nTime: %6\nPowered by AlexRebornV2",
		"feedbackFromAdmin": "══✦ Admin Feedback ✦══\nFrom: %1\n\nMessage: %2\n\n» Reply to continue reporting.\nPowered by AlexRebornV2",
		"noReply": "No message provided.",
		"onlyFilesNoReply": "Only files, no message."
	}
};

async function downloadAttachments(attachments) {
	if (!attachments || attachments.length === 0) return { paths: [], streams: [] };

	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const charLength = 20;
	const paths = [];
	const streams = [];

	for (const file of attachments) {
		let ext = "jpg"; // Default
		if (file.type === "photo") ext = "jpg";
		else if (file.type === "video") ext = "mp4";
		else if (file.type === "audio") ext = "mp3";
		else if (file.type === "animated_image") ext = "gif";

		let filename = "";
		for (let i = 0; i < charLength; i++) {
			filename += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		const filepath = path.join(__dirname, "cache", `${filename}.${ext}`);

		try {
			const response = await axios.get(encodeURI(file.url), { responseType: "arraybuffer" });
			await fs.writeFile(filepath, Buffer.from(response.data));
			paths.push(filepath);
			streams.push(fs.createReadStream(filepath));
		} catch (error) {
			console.error(`Failed to download file: ${file.url}`, error);
		}
	}

	return { paths, streams };
}

async function cleanupFiles(paths) {
	for (const filePath of paths) {
		try {
			await fs.unlink(filePath);
		} catch (error) {
			console.warn(`Failed to delete file ${filePath}:`, error);
		}
	}
}

module.exports.handleReply = async function ({ api, event, handleReply, Users }) {
	try {
		const userName = (await Users.getData(event.senderID))?.name || "Unknown";
		const { paths, streams } = await downloadAttachments(event.attachments);

		switch (handleReply.type) {
			case "reply": {
				const admins = global.config.ADMINBOT || [];
				for (const adminID of admins) {
					api.sendMessage(
						{
							body: `══✦ User Feedback ✦══\nFrom: ${userName}\nUser ID: ${event.senderID}\n\nMessage: ${event.body || (paths.length ? module.exports.languages.en.onlyFilesNoReply : module.exports.languages.en.noReply)}\nPowered by AlexRebornV2`,
							mentions: [{ id: event.senderID, tag: userName }],
							attachment: streams
						},
						adminID,
						(err, info) => {
							if (!err) {
								global.client.handleReply.push({
									name: this.config.name,
									messageID: info.messageID,
									messID: event.messageID,
									author: event.senderID,
									id: event.threadID,
									type: "calladmin"
								});
							}
						}
					);
				}
				if (paths.length) await cleanupFiles(paths);
				break;
			}
			case "calladmin": {
				api.sendMessage(
					{
						body: module.exports.languages.en.feedbackFromAdmin(
							userName,
							event.body || (paths.length ? module.exports.languages.en.onlyFilesNoReply : module.exports.languages.en.noReply)
						),
						mentions: [{ id: event.senderID, tag: userName }],
						attachment: streams
					},
					handleReply.id,
					(err, info) => {
						if (!err) {
							global.client.handleReply.push({
								name: this.config.name,
								author: event.senderID,
								messageID: info.messageID,
								type: "reply"
							});
						}
					},
					handleReply.messID
				);
				if (paths.length) await cleanupFiles(paths);
				break;
			}
		}
	} catch (ex) {
		console.error("Error in handleReply:", ex);
	}
};

module.exports.run = async function ({ api, event, Threads, args, Users }) {
	try {
		const userName = (await Users.getData(event.senderID))?.name || "Unknown";
		const attachments = event.messageReply?.attachments || [];
		if (!args[0] && !attachments.length) {
			return api.sendMessage(module.exports.languages.en.noReportContent, event.threadID, event.messageID);
		}

		const { paths, streams } = await downloadAttachments(attachments);
		const threadName = (await Threads.getData(event.threadID))?.threadInfo?.threadName || "Unknown Thread";
		const userID = event.senderID;
		const threadID = event.threadID;
		const timeNow = moment.tz("Asia/Manila").format("HH:mm:ss DD/MM/YYYY");
		const admins = global.config.ADMINBOT || [];

		api.sendMessage(
			`══✦ Report Sent ✦══\n${module.exports.languages.en.successSend(admins.length)}\nTime: ${timeNow}\nPowered by AlexRebornV2`,
			event.threadID,
			event.messageID
		);

		for (const adminID of admins) {
			api.sendMessage(
				{
					body: module.exports.languages.en.reportFrom(
						userName,
						userID,
						threadName,
						threadID,
						args.join(" ") || (paths.length ? module.exports.languages.en.onlyFilesNoReply : module.exports.languages.en.noReply),
						timeNow
					),
					mentions: [{ id: userID, tag: userName }],
					attachment: streams
				},
				adminID,
				(err, info) => {
					if (!err) {
						global.client.handleReply.push({
							name: this.config.name,
							messageID: info.messageID,
							author: event.senderID,
							messID: event.messageID,
							id: threadID,
							type: "calladmin"
						});
					}
				}
			);
		}
		if (paths.length) await cleanupFiles(paths);
	} catch (ex) {
		console.error("Error in callad run:", ex);
		api.sendMessage("❌ An error occurred while sending the report.", event.threadID, event.messageID);
	}
};
