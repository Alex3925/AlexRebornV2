module.exports.config = {
	name: "choose",
	version: "1.0.2", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Let the bot randomly choose an option for you",
	commandCategory: "utility",
	usages: "[Option 1] | [Option 2] | ...",
	cooldowns: 5
};

module.exports.languages = {
	"en": {
		"return": "══✦ Choice ✦══\n%1 seems like the best pick!\nPowered by AlexRebornV2",
		"missingOptions": "❌ Please provide at least one option (e.g., option1 | option2)."
	}
};

module.exports.run = async ({ api, event, args, getText }) => {
	const { threadID, messageID } = event;

	const input = args.join(" ").trim();
	if (!input) return api.sendMessage(getText("missingOptions"), threadID, messageID);

	const options = input.split(" | ").filter(option => option.trim());
	if (options.length === 0) return api.sendMessage(getText("missingOptions"), threadID, messageID);

	const choice = options[Math.floor(Math.random() * options.length)];
	return api.sendMessage(getText("return", choice), threadID, messageID);
};
