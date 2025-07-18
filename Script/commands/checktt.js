module.exports.config = {
	name: "checktt",
	version: "1.0.6", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Check message interaction counts in the group",
	commandCategory: "group",
	usages: "[all/@tag]",
	cooldowns: 5,
	envConfig: {
		"maxColumn": 10
	}
};

module.exports.languages = {
	"en": {
		"all": "%1. %2: %3 messages",
		"mention": "%1 is ranked #%2 with %3 messages",
		"myself": "You are ranked #%1 with %2 messages",
		"noData": "No interaction data found for the group."
	}
};

module.exports.run = async function ({ args, api, event, Currencies, getText }) {
	const { threadID, messageID, mentions, senderID } = event;

	try {
		const threadInfo = await api.getThreadInfo(threadID);
		const userInfo = threadInfo.userInfo || [];

		const users = userInfo.map(user => ({
			id: user.id,
			name: user.name || "Unknown"
		}));

		const exp = await Promise.all(users.map(async user => {
			const userData = await Currencies.getData(user.id);
			return {
				name: user.name,
				exp: userData?.exp ?? 0,
				uid: user.id
			};
		}));
		exp.sort((a, b) => b.exp - a.exp);

		if (args[0]?.toLowerCase() === "all") {
			if (exp.length === 0) return api.sendMessage(getText("noData"), threadID, messageID);
			const msg = exp.map((user, index) => getText("all", index + 1, user.name, user.exp)).join("\n");
			return api.sendMessage(
				`══✦ Group Interaction Rankings ✦══\n${msg}\nPowered by AlexRebornV2`,
				threadID,
				messageID
			);
		}

		if (Object.keys(mentions).length === 1) {
			const mentionID = Object.keys(mentions)[0];
			const rank = exp.findIndex(info => info.uid === mentionID) + 1;
			if (rank === 0) return api.sendMessage(`No interaction data for ${mentions[mentionID].replace(/@/g, "")}.`, threadID, messageID);
			const user = exp[rank - 1];
			return api.sendMessage(
				`══✦ User Interaction ✦══\n${getText("mention", user.name, rank, user.exp)}\nPowered by AlexRebornV2`,
				threadID,
				messageID
			);
		}

		const rank = exp.findIndex(info => info.uid === senderID) + 1;
		if (rank === 0) return api.sendMessage(getText("noData"), threadID, messageID);
		const user = exp[rank - 1];
		return api.sendMessage(
			`══✦ Your Interaction ✦══\n${getText("myself", rank, user.exp)}\nPowered by AlexRebornV2`,
			threadID,
			messageID
		);
	} catch (e) {
		console.error("Error in checktt:", e);
		return api.sendMessage("❌ An error occurred while fetching interaction data.", threadID, messageID);
	}
};
