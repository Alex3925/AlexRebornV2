const { writeFileSync, unlinkSync, readFileSync, readdirSync } = require("fs-extra");
const { join } = require("path");
const { execSync } = require("child_process");

module.exports.config = {
	name: "command",
	version: "1.0.3", // Updated version
	hasPermssion: 2, // Admin-only
	credits: "Alex Jhon Ponce", // Updated credits
	description: "Manage bot modules (load, unload, or view info)",
	commandCategory: "admin",
	usages: "[load/unload/loadAll/unloadAll/info] [module name]",
	cooldowns: 5,
	dependencies: {
		"fs-extra": "",
		"child_process": "",
		"path": ""
	}
};

module.exports.languages = {
	"en": {
		"nameExist": "Module name conflicts with another module.",
		"notFoundLanguage": "Module %1 does not support your language.",
		"notFoundPackage": "Package %1 not found for module %2. Installing...",
		"cantInstallPackage": "Failed to install package %1 for module %2. Error: %3",
		"loadedPackage": "Loaded packages for module %1.",
		"loadedConfig": "Loaded config for module %1.",
		"cantLoadConfig": "Failed to load config for module %1. Error: %2",
		"cantOnload": "Failed to run setup for module %1. Error: %2",
		"successLoadModule": "✅ Loaded module %1.",
		"failLoadModule": "❌ Failed to load module %1. Error: %2",
		"moduleError": "══✦ Module Load Errors ✦══\n%1\nPowered by AlexRebornV2",
		"unloadSuccess": "✅ Unloaded module %1.",
		"unloadedAll": "✅ Unloaded %1 module(s).",
		"missingInput": "⚠️ Module name cannot be empty.",
		"moduleNotExist": "⚠️ Module does not exist.",
		"user": "User",
		"adminGroup": "Group Admin",
		"adminBot": "Bot Admin",
		"dontHavePackage": "None",
		"infoModule": "══✦ Module Info ✦══\nName: %1\nAuthor: %2\nVersion: %3\nPermission: %4\nCooldown: %5 second(s)\nDependencies: %6\nPowered by AlexRebornV2"
	}
};

module.exports.loadCommand = async function ({ moduleList, threadID, messageID, getText }) {
	const { configPath, mainPath, api } = global.client;
	const logger = require(join(mainPath, "/utils/log"));
	const listPackage = JSON.parse(readFileSync(join(mainPath, "/package.json"))).dependencies;
	const listbuiltinModules = require("module").builtinModules;
	const errorList = [];

	delete require.cache[require.resolve(configPath)];
	let configValue = require(configPath);
	writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

	for (const nameModule of moduleList) {
		try {
			const dirModule = join(__dirname, nameModule + ".js");
			delete require.cache[require.resolve(dirModule)];
			const command = require(dirModule);

			if (!command.config?.name || !command.run) {
				throw new Error(getText("nameExist"));
			}

			if (!command.languages || typeof command.languages !== "object" || Object.keys(command.languages).length === 0) {
				logger(getText("notFoundLanguage", command.config.name), "warn");
			}

			global.client.eventRegistered = global.client.eventRegistered.filter((event) => event !== command.config.name);

			if (command.config.dependencies && typeof command.config.dependencies === "object") {
				for (const packageName in command.config.dependencies) {
					const moduleDir = join(mainPath, "nodemodules", "node_modules", packageName);
					try {
						if (!global.nodemodule.hasOwnProperty(packageName)) {
							if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) {
								global.nodemodule[packageName] = require(packageName);
							} else {
								global.nodemodule[packageName] = require(moduleDir);
							}
						}
					} catch {
						logger(getText("notFoundPackage", packageName, command.config.name), "warn");
						const version = command.config.dependencies[packageName] === "*" || command.config.dependencies[packageName] === "" ? "" : `@${command.config.dependencies[packageName]}`;
						execSync(`npm --package-lock false --save install ${packageName}${version}`, {
							stdio: "inherit",
							env: process.env,
							shell: true,
							cwd: join(mainPath, "nodemodules")
						});
						let loadSuccess = false;
						let error;
						for (let tryLoadCount = 0; tryLoadCount <= 2; tryLoadCount++) {
							try {
								require.cache = {};
								if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) {
									global.nodemodule[packageName] = require(packageName);
								} else {
									global.nodemodule[packageName] = require(moduleDir);
								}
								loadSuccess = true;
								break;
							} catch (err) {
								error = err;
							}
						}
						if (!loadSuccess || error) {
							throw new Error(getText("cantInstallPackage", packageName, command.config.name, error));
						}
					}
				}
				logger(getText("loadedPackage", command.config.name));
			}

			if (command.config.envConfig && typeof command.config.envConfig === "object") {
				try {
					for (const key in command.config.envConfig) {
						if (!global.configModule[command.config.name]) global.configModule[command.config.name] = {};
						if (!global.moduleData[command.config.name]) global.moduleData[command.config.name] = {};
						if (typeof global.moduleData[command.config.name][key] !== "undefined") {
							global.configModule[command.config.name][key] = global.moduleData[command.config.name][key];
						} else {
							global.configModule[command.config.name][key] = command.config.envConfig[key] || "";
						}
						if (typeof global.config[command.config.name][key] === "undefined") {
							global.config[command.config.name][key] = command.config.envConfig[key] || "";
						}
					}
					logger(getText("loadedConfig", command.config.name));
				} catch (error) {
					throw new Error(getText("cantLoadConfig", command.config.name, JSON.stringify(error)));
				}
			}

			if (command.onLoad) {
				try {
					await command.onLoad({ api });
				} catch (error) {
					throw new Error(getText("cantOnload", command.config.name, JSON.stringify(error)));
				}
			}

			if (command.handleEvent) {
				global.client.eventRegistered.push(command.config.name);
			}

			if (!global.client.commands.has(command.config.name)) {
				if (global.config.commandDisabled.includes(nameModule + ".js") || configValue.commandDisabled.includes(nameModule + ".js")) {
					configValue.commandDisabled.splice(configValue.commandDisabled.indexOf(nameModule + ".js"), 1);
					global.client.commandDisabled.splice(global.client.commandDisabled.indexOf(nameModule + ".js"), 1);
				}
				global.client.commands.set(command.config.name, command);
				logger(getText("successLoadModule", command.config.name));
			} else {
				throw new Error(getText("nameExist"));
			}
		} catch (error) {
			errorList.push(getText("failLoadModule", nameModule, error.message || error));
		}
	}

	writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
	unlinkSync(configPath + ".temp");

	if (errorList.length > 0) {
		api.sendMessage(getText("moduleError", errorList.join("\n\n")), threadID, messageID);
	} else {
		api.sendMessage(`══✦ Module Status ✦══\n✅ Loaded ${moduleList.length - errorList.length} module(s).\nPowered by AlexRebornV2`, threadID, messageID);
	}
};

module.exports.unloadModule = function ({ moduleList, threadID, messageID, getText }) {
	const { configPath, api } = global.client;
	const logger = require(join(global.client.mainPath, "/utils/log"));
	const configValue = require(configPath);

	writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

	for (const nameModule of moduleList) {
		global.client.commands.delete(nameModule);
		global.client.eventRegistered = global.client.eventRegistered.filter((event) => event !== nameModule);
		if (!configValue.commandDisabled.includes(nameModule + ".js")) {
			configValue.commandDisabled.push(nameModule + ".js");
		}
		if (!global.config.commandDisabled.includes(nameModule + ".js")) {
			global.config.commandDisabled.push(nameModule + ".js");
		}
		logger(getText("unloadSuccess", nameModule));
	}

	writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
	unlinkSync(configPath + ".temp");
	api.sendMessage(`══✦ Module Status ✦══\n${getText("unloadedAll", moduleList.length)}\nPowered by AlexRebornV2`, threadID, messageID);
};

module.exports.run = function ({ event, args, api, getText }) {
	const { threadID, messageID } = event;
	const moduleList = args.slice(1);

	switch (args[0]?.toLowerCase()) {
		case "load":
			if (!moduleList.length) return api.sendMessage(getText("missingInput"), threadID, messageID);
			return this.loadCommand({ moduleList, threadID, messageID, getText });

		case "unload":
			if (!moduleList.length) return api.sendMessage(getText("missingInput"), threadID, messageID);
			return this.unloadModule({ moduleList, threadID, messageID, getText });

		case "loadAll":
			moduleList.push(...readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes("example") && !file.includes("command")).map((item) => item.replace(/\.js/g, "")));
			return this.loadCommand({ moduleList, threadID, messageID, getText });

		case "unloadAll":
			moduleList.push(...readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes("example") && !file.includes("command")).map((item) => item.replace(/\.js/g, "")));
			return this.unloadModule({ moduleList, threadID, messageID, getText });

		case "info": {
			const command = global.client.commands.get(moduleList.join("") || "");
			if (!command) return api.sendMessage(getText("moduleNotExist"), threadID, messageID);
			const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;
			const permissionText = hasPermssion === 0 ? getText("user") : hasPermssion === 1 ? getText("adminGroup") : getText("adminBot");
			const dependenciesText = Object.keys(dependencies || {}).join(", ") || getText("dontHavePackage");
			return api.sendMessage(
				getText("infoModule", name.toUpperCase(), credits, version, permissionText, cooldowns, dependenciesText),
				threadID,
				messageID
			);
		}

		default:
			return api.sendMessage(
				`══✦ Command Usage ✦══\n⚠️ Invalid command. Use: ${this.config.name} [load/unload/loadAll/unloadAll/info] [module name]\nPowered by AlexRebornV2`,
				threadID,
				messageID
			);
	}
};
