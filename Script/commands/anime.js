const { readFileSync, createReadStream, unlinkSync } = require("fs-extra");
const { join } = require("path");

module.exports.config = {
	name: "anime",
	version: "1.0.3", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Fetch a random SFW anime image by tag",
	commandCategory: "random-img",
	usages: "[tag]",
	cooldowns: 5,
	dependencies: {
		"request": "",
		"fs-extra": "",
		"path": ""
	}
};

module.exports.languages = {
	"en": {
		"addTags": "=== Available Anime Tags ===\n%1"
	}
};

module.exports.getAnime = async function (type) {
	try {
		const { getContent, downloadFile, randomString } = global.utils;
		const animeData = JSON.parse(readFileSync(await global.utils.assets.data("ANIME")));
		if (!animeData[type]) throw new Error(`Invalid tag: ${type}`);
		const dataImage = (await getContent(animeData[type])).data;
		const urlImage = dataImage.data.response.url;
		const ext = urlImage.substring(urlImage.lastIndexOf(".") + 1);
		const string = randomString(5);
		const path = join(__dirname, "cache", `${string}.${ext}`);
		await downloadFile(urlImage, path);
		return path;
	} catch (e) {
		console.error(e);
		return null;
	}
};

module.exports.run = async function ({ event, api, args, getText }) {
	const { threadID, messageID } = event;

	const animeData = JSON.parse(readFileSync(await global.utils.assets.data("ANIME")));

	if (!args[0] || !animeData.hasOwnProperty(args[0])) {
		const list = Object.keys(animeData).join(", ");
		return api.sendMessage(getText("addTags", list), threadID, messageID);
	}

	try {
		const path = await this.getAnime(args[0]);
		if (!path) throw new Error("Failed to fetch image");
		return api.sendMessage(
			{ attachment: createReadStream(path) },
			threadID,
			() => unlinkSync(path),
			messageID
		);
	} catch (e) {
		console.error(e);
		return api.sendMessage("⚠️ Failed to fetch anime image. Try another tag!", threadID, messageID);
	}
};
