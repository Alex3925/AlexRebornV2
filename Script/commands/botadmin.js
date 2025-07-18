const { writeFileSync } = require("fs-extra");

module.exports.config = {
	name: "botadmin",
	version: "1.0.6", // Updated version
	hasPermssion: 0, // Accessible to all for listing, but add/remove require admin
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Manage bot admins (list, add, or remove)",
	commandCategory: "admin",
	usages: "[list/add/remove] [userID/@tag]",
	cooldowns: 5,
	dependencies: {
		"fs-extra": ""
	}
};

module.exports.languages = {
	"en": {
		"listAdmin": "══✦ Bot Admins ✦══\n%1\nPowered by AlexRebornV2",
		"notHavePermssion": "❌ You need admin permission to use '%1'.",
		"addedNewAdmin": "✅ Added %1 admin(s):\n%2\nPowered by AlexRebornV2",
		"removedAdmin": "✅ Removed %1 admin(s):\n%2\nPowered by AlexRebornV2",
		"invalidUsage": "⚠️ Usage: %1 [list/add/remove] [userID/@tag]"
	}
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
	const { threadID, messageID, mentions } = event;
	const { configPath } = global.client;
	const { ADMINBOT } = global.config;
	const config = require(configPath);
	const content = args.slice(1);

	switch (args[0]?.toLowerCase()) {
		case "list":
		case "all":
		case "-a": {
			const listAdmin = ADMINBOT || config.ADMINBOT || [];
			if (listAdmin.length === 0) return api.sendMessage("No admins found.", threadID, messageID);
			const msg = await Promise.all(
				listAdmin
					.filter((id) => parseInt(id))
					.map(async (id) => {
						const name = await Users.getNameUser(id);
						return `- ${name} (https://facebook.com/${id})`;
					})
			);
			return api.sendMessage(getText("listAdmin", msg.join("\n")), threadID, messageID);
		}

		case "add": {
			if (permssion !== 2) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);
			if (content.length === 0) return api.sendMessage(getText("invalidUsage", this.config.name), threadID, messageID);

			const listAdd = [];
			if (mentions.length > 0) {
				for (const id of Object.keys(mentions)) {
					if (!config.ADMINBOT.includes(id)) {
						config.ADMINBOT.push(id);
						ADMINBOT.push(id);
						listAdd.push(`- ${mentions[id].replace(/@/g, "")} (${id})`);
					}
				}
			} else if (!isNaN(content[0])) {
				const id = content[0];
				if (!config.ADMINBOT.includes(id)) {
					config.ADMINBOT.push(id);
					ADMINBOT.push(id);
					const name = await Users.getNameUser(id);
					listAdd.push(`- ${name} (${id})`);
				}
			}

			if (listAdd.length === 0) return api.sendMessage("⚠️ No new admins added. User(s) may already be admins.", threadID, messageID);
			writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");
			return api.sendMessage(getText("addedNewAdmin", listAdd.length, listAdd.join("\n")), threadID, messageID);
		}

		case "remove":
		case "rm":
		case "delete": {
			if (permssion !== 2) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);
			if (content.length === 0) return api.sendMessage(getText("invalidUsage", this.config.name), threadID, messageID);

			const listRemove = [];
			if (mentions.length > 0) {
				for (const id of Object.keys(mentions)) {
					const index = config.ADMINBOT.indexOf(id);
					if (index !== -1) {
						config.ADMINBOT.splice(index, 1);
						ADMINBOT.splice(index, 1);
						listRemove.push(`- ${mentions[id].replace(/@/g, "")} (${id})`);
					}
				}
			} else if (!isNaN(content[0])) {
				const id = content[0];
				const index = config.ADMINBOT.indexOf(id);
				if (index !== -1) {
					config.ADMINBOT.splice(index, 1);
					ADMINBOT.splice(index, 1);
					const name = await Users.getNameUser(id);
					listRemove.push(`- ${name} (${id})`);
				}
			}

			if (listRemove.length === 0) return api.sendMessage("⚠️ No admins removed. User(s) may not be admins.", threadID, messageID);
			writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");
			return api.sendMessage(getText("removedAdmin", listRemove.length, listRemove.join("\n")), threadID, messageID);
		}

		default:
			return api.sendMessage(getText("invalidUsage", this.config.name), threadID, messageID);
	}
};
