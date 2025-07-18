module.exports.config = {
	name: "daily",
	version: "1.0.3", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Claim 200 coins daily",
	commandCategory: "economy",
	cooldowns: 5,
	envConfig: {
		cooldownTime: 43200000, // 12 hours in milliseconds
		rewardCoin: 200
	}
};

module.exports.languages = {
	"en": {
		"cooldown": "══✦ Daily Reward ✦══\nYou’ve already claimed today’s reward.\nPlease try again in: %1h %2m %3s.\nPowered by AlexRebornV2",
		"rewarded": "══✦ Daily Reward ✦══\nYou claimed %1 coins!\nCome back in 12 hours for more.\nPowered by AlexRebornV2"
	}
};

module.exports.run = async ({ event, api, Currencies, getText }) => {
	const { daily } = global.configModule;
	const cooldownTime = daily.cooldownTime;
	const rewardCoin = daily.rewardCoin;
	const { senderID, threadID, messageID } = event;

	let data = (await Currencies.getData(senderID))?.data || {};
	if (data.dailyCoolDown && cooldownTime - (Date.now() - data.dailyCoolDown) > 0) {
		const time = cooldownTime - (Date.now() - data.dailyCoolDown);
		const seconds = Math.floor((time / 1000) % 60);
		const minutes = Math.floor((time / 1000 / 60) % 60);
		const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
		return api.sendMessage(
			getText("cooldown", hours, minutes, seconds < 10 ? "0" + seconds : seconds),
			threadID,
			messageID
		);
	}

	data.dailyCoolDown = Date.now();
	await Currencies.setData(senderID, { data });
	await Currencies.increaseMoney(senderID, rewardCoin);
	return api.sendMessage(getText("rewarded", rewardCoin), threadID, messageID);
};
