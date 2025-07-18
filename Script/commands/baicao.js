module.exports.config = {
	name: "baicao",
	version: "1.0.5", // Updated version
	hasPermssion: 0, // Accessible to all users
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Play a three-card game with betting",
	commandCategory: "game-mp",
	usages: "[create/join/leave/start/info]",
	cooldowns: 1
};

module.exports.handleEvent = async ({ event, api, Users }) => {
	const { senderID, threadID, body, messageID } = event;

	if (!body || typeof body !== "string") return;
	if (!global.moduleData.baicao) global.moduleData.baicao = new Map();
	if (!global.moduleData.baicao.has(threadID)) return;

	const values = global.moduleData.baicao.get(threadID);
	if (values.start !== 1) return;

	if (body.toLowerCase() === "deal") {
		if (values.chiabai === 1) return;
		for (const key in values.player) {
			const card1 = Math.floor(Math.random() * 9) + 1;
			const card2 = Math.floor(Math.random() * 9) + 1;
			const card3 = Math.floor(Math.random() * 9) + 1;
			let total = card1 + card2 + card3;
			if (total >= 20) total -= 20;
			if (total >= 10) total -= 10;
			values.player[key].card1 = card1;
			values.player[key].card2 = card2;
			values.player[key].card3 = card3;
			values.player[key].total = total;
			api.sendMessage(
				`Your cards: ${card1} | ${card2} | ${card3}\nTotal: ${total}`,
				values.player[key].id,
				(error) => {
					if (error) api.sendMessage(`Failed to deal cards to user: ${values.player[key].id}`, threadID);
				}
			);
		}
		values.chiabai = 1;
		global.moduleData.baicao.set(threadID, values);
		return api.sendMessage("Cards dealt successfully! Each player has 2 chances to swap cards. Check your private messages.", threadID);
	}

	if (body.toLowerCase() === "swap") {
		if (values.chiabai !== 1) return;
		const player = values.player.find((item) => item.id === senderID);
		if (!player) return;
		if (player.doibai === 0) return api.sendMessage("You have used all your card swap chances.", threadID, messageID);
		if (player.ready) return api.sendMessage("You have already marked ready and cannot swap cards!", threadID, messageID);
		const cardKeys = ["card1", "card2", "card3"];
		const randomCard = cardKeys[Math.floor(Math.random() * cardKeys.length)];
		player[randomCard] = Math.floor(Math.random() * 9) + 1;
		player.total = player.card1 + player.card2 + player.card3;
		if (player.total >= 20) player.total -= 20;
		if (player.total >= 10) player.total -= 10;
		player.doibai -= 1;
		global.moduleData.baicao.set(threadID, values);
		return api.sendMessage(
			`Your cards after swap: ${player.card1} | ${player.card2} | ${player.card3}\nTotal: ${player.total}`,
			player.id,
			(error) => {
				if (error) api.sendMessage(`Failed to swap cards for user: ${player.id}`, threadID);
			}
		);
	}

	if (body.toLowerCase() === "ready") {
		if (values.chiabai !== 1) return;
		const player = values.player.find((item) => item.id === senderID);
		if (!player || player.ready) return;
		const name = await Users.getNameUser(player.id);
		values.ready += 1;
		player.ready = true;
		global.moduleData.baicao.set(threadID, values);
		if (values.player.length === values.ready) {
			const sortedPlayers = values.player.sort((a, b) => b.total - a.total);
			const ranking = sortedPlayers.map(
				(info, index) => `${index + 1}. ${Users.getNameUser(info.id)}: ${info.card1} | ${info.card2} | ${info.card3} => ${info.total}`
			);
			global.moduleData.baicao.delete(threadID);
			return api.sendMessage(`══✦ Game Results ✦══\n\n${ranking.join("\n")}\n\nPowered by AlexRebornV2`, threadID);
		}
		return api.sendMessage(
			`Player ${name} is ready! ${values.player.length - values.ready} player(s) still need to ready.`,
			threadID
		);
	}

	if (body.toLowerCase() === "nonready") {
		const nonReadyPlayers = values.player.filter((item) => !item.ready);
		if (nonReadyPlayers.length === 0) return;
		const names = await Promise.all(nonReadyPlayers.map((info) => Users.getNameUser(info.id)));
		return api.sendMessage(`Players not ready: ${names.join(", ")}`, threadID);
	}
};

module.exports.run = async ({ api, event, args }) => {
	const { senderID, threadID, messageID } = event;

	if (!global.moduleData.baicao) global.moduleData.baicao = new Map();
	const values = global.moduleData.baicao.get(threadID) || {};

	switch (args[0]?.toLowerCase()) {
		case "create":
		case "-c":
			if (global.moduleData.baicao.has(threadID))
				return api.sendMessage("A game is already active in this group.", threadID, messageID);
			global.moduleData.baicao.set(threadID, {
				author: senderID,
				start: 0,
				chiabai: 0,
				ready: 0,
				player: [{ id: senderID, card1: 0, card2: 0, card3: 0, doibai: 2, ready: false, total: 0 }]
			});
			return api.sendMessage("Game created successfully! Join with 'baicao join'.", threadID, messageID);

		case "join":
		case "-j":
			if (!values) return api.sendMessage("No game exists. Create one with 'baicao create'.", threadID, messageID);
			if (values.start === 1) return api.sendMessage("The game has already started.", threadID, messageID);
			if (values.player.find((item) => item.id === senderID))
				return api.sendMessage("You are already in the game!", threadID, messageID);
			values.player.push({ id: senderID, card1: 0, card2: 0, card3: 0, doibai: 2, ready: false, total: 0 });
			global.moduleData.baicao.set(threadID, values);
			return api.sendMessage("You have joined the game!", threadID, messageID);

		case "leave":
		case "-l":
			if (!values || !values.player)
				return api.sendMessage("No game exists. Create one with 'baicao create'.", threadID, messageID);
			if (!values.player.some((item) => item.id === senderID))
				return api.sendMessage("You are not in the game!", threadID, messageID);
			if (values.start === 1) return api.sendMessage("The game has already started.", threadID, messageID);
			if (values.author === senderID) {
				global.moduleData.baicao.delete(threadID);
				return api.sendMessage("The game creator has left, and the game has been disbanded.", threadID, messageID);
			}
			values.player.splice(values.player.findIndex((item) => item.id === senderID), 1);
			global.moduleData.baicao.set(threadID, values);
			return api.sendMessage("You have left the game!", threadID, messageID);

		case "start":
		case "-s":
			if (!values) return api.sendMessage("No game exists. Create one with 'baicao create'.", threadID, messageID);
			if (values.author !== senderID) return api.sendMessage("Only the game creator can start the game.", threadID, messageID);
			if (values.player.length <= 1)
				return api.sendMessage("At least two players are required to start. Invite others with 'baicao join'.", threadID, messageID);
			if (values.start === 1) return api.sendMessage("The game has already started.", threadID, messageID);
			values.start = 1;
			global.moduleData.baicao.set(threadID, values);
			return api.sendMessage("Game started! Type 'deal' to distribute cards.", threadID, messageID);

		case "info":
		case "-i":
			if (!values || !values.player)
				return api.sendMessage("No game exists. Create one with 'baicao create'.", threadID, messageID);
			const authorName = await Users.getNameUser(values.author);
			return api.sendMessage(
				`══✦ Game Info ✦══\nCreator: ${authorName}\nPlayers: ${values.player.length}\nPowered by AlexRebornV2`,
				threadID,
				messageID
			);

		default:
			return api.sendMessage(
				`Invalid command. Use: ${this.config.name} [create/join/leave/start/info]`,
				threadID,
				messageID
			);
	}
};
