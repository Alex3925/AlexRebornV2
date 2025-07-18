module.exports.config = {
	name: "balance",
	version: "1.0.3", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Check your balance or the balance of a tagged user",
	commandCategory: "economy",
	usages: "[@tag]",
	cooldowns: 5
};

module.exports.languages = {
	"en": {
		"yourBalance": "Your current balance: $%1",
		"otherBalance": "%1's current balance: $%2",
		"noUserTagged": "Please tag a user to check their balance or use without tags to check your own."
	}
};

module.exports.run = async function ({ api, event, args, Currencies, getText }) {
	const { threadID, messageID, senderID, mentions } = event;

	if (!args[0]) {
		const money = (await Currencies.getData(senderID))?.money ?? 0;
		return api.sendMessage(
			`══✦ Balance ✦══\n${getText("yourBalance", money)}\nPowered by AlexRebornV2`,
			threadID,
			messageID
		);
	}

	if (Object.keys(mentions).length === 1) {
		const mention = Object.keys(mentions)[0];
		const money = (await Currencies.getData(mention))?.money ?? 0;
		const name = mentions[mention].replace(/@/g, "");
		return api.sendMessage(
			{
				body: `══✦ Balance ✦══\n${getText("otherBalance", name, money)}\nPowered by AlexRebornV2`,
				mentions: [{ tag: name, id: mention }]
			},
			threadID,
			messageID
		);
	}

	return api.sendMessage(getText("noUserTagged"), threadID, messageID);
};
