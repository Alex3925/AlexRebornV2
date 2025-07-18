module.exports.config = {
	name: "bio",
	version: "1.0.1", // Updated version
	hasPermssion: 2, // Admin-only
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Change the bot's bio",
	commandCategory: "admin",
	usages: "[text]",
	cooldowns: 5
};

module.exports.languages = {
	"en": {
		"success": "✅ Bot bio updated to:\n%1",
		"error": "❌ Failed to update bio:\n%1",
		"missingText": "⚠️ Please provide a new bio text."
	}
};

module.exports.run = async ({ api, event, args, getText }) => {
	const newBio = args.join(" ");
	if (!newBio) return api.sendMessage(getText("missingText"), event.threadID, event.messageID);

	try {
		await api.changeBio(newBio);
		return api.sendMessage(
			`══✦ Bio Update ✦══\n${getText("success", newBio)}\nPowered by AlexRebornV2`,
			event.threadID,
			event.messageID
		);
	} catch (err) {
		return api.sendMessage(
			`══✦ Bio Update ✦══\n${getText("error", err.message || err)}\nPowered by AlexRebornV2`,
			event.threadID,
			event.messageID
		);
	}
};
