const axios = require("axios");
const request = require("request");
const fs = require("fs-extra");
const path = require("path");
const { alldown } = require("shaon-videos-downloader");

module.exports = {
	config: {
		name: "autodl",
		version: "0.0.4", // Updated version
		hasPermssion: 0,
		credits: "Alex Jhon Ponce",
		description: "Automatically download videos when a link is sent",
		commandCategory: "media",
		usages: "",
		cooldowns: 5,
		dependencies: {
			"axios": "",
			"request": "",
			"fs-extra": "",
			"path": "",
			"shaon-videos-downloader": ""
		}
	},

	languages: {
		"en": {
			"downloading": "⏳ Downloading your video...",
			"success": "🎬 Video downloaded successfully!",
			"error": "❌ Failed to download video."
		}
	},

	run: async function ({ api, event }) {
		return api.sendMessage("⚠️ This command works automatically when you send a video link.", event.threadID, event.messageID);
	},

	handleEvent: async function ({ api, event, getText }) {
		const content = event.body || "";
		if (!content.startsWith("https://")) return;

		try {
			api.setMessageReaction("⏳", event.messageID, () => {}, true);
			api.sendMessage(getText("downloading"), event.threadID, event.messageID);

			const data = await alldown(content);
			if (!data.url) throw new Error("No downloadable video URL found");

			const videoBuffer = (await axios.get(data.url, { responseType: "arraybuffer" })).data;
			const uniqueName = `auto_${Date.now()}.mp4`;
			const filePath = path.join(__dirname, "cache", uniqueName);

			await fs.ensureDir(path.join(__dirname, "cache"));
			fs.writeFileSync(filePath, Buffer.from(videoBuffer));

			api.setMessageReaction("✅", event.messageID, () => {}, true);
			return api.sendMessage(
				{
					body: `══✦ Auto Downloader ✦══\n${getText("success")}\nPowered by AlexRebornV2`,
					attachment: fs.createReadStream(filePath)
				},
				event.threadID,
				() => {
					try {
						fs.unlinkSync(filePath);
					} catch (err) {
						console.error("Failed to delete file:", err);
					}
				},
				event.messageID
			);
		} catch (err) {
			console.error("Error:", err);
			api.setMessageReaction("❌", event.messageID, () => {}, true);
			return api.sendMessage(getText("error"), event.threadID, event.messageID);
		}
	}
};
