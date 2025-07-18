const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
	name: "math",
	version: "1.0.2",
	hasPermssion: 0,
	credits: "Alex Jhon Ponce", // Replace with your name
	description: "Solve math expressions, integrals, plot graphs, or compute vectors via WolframAlpha",
	commandCategory: "study",
	usages: "[expression | -p integral | -g graph | -v vector]",
	cooldowns: 5,
	dependencies: {
		"axios": "",
		"fs-extra": ""
	},
	info: [
		{ key: "none", prompt: "Solve", type: "Expression", example: "math x+1=2" },
		{ key: "-p", prompt: "Indefinite Integral", type: "Equation", example: "math -p x dx" },
		{ key: "-p", prompt: "Definite Integral", type: "Equation", example: "math -p x dx from 0 to 2" },
		{ key: "-g", prompt: "Graph", type: "Equation", example: "math -g y = x^3 - 9" },
		{ key: "-v", prompt: "Vector", type: "Vector Coordinates", example: "math -v (1, 2, 3) - (5, 6, 7)" }
	],
	envConfig: {
		"WOLFRAM": "T8J8YV-H265UQ762K"
	}
};

module.exports.languages = {
	"en": {
		"noInput": "❌ Please enter a math expression!",
		"error": "⚠️ An error occurred while processing your request.",
		"fetching": "🧮 Processing your math request..."
	}
};

module.exports.run = async function ({ api, event, args, getText }) {
	const { threadID, messageID, type, messageReply } = event;
	const out = (msg, err = null) => {
		if (err) console.error(err);
		return api.sendMessage(msg, threadID, messageID);
	};
	const key = global.configModule.math.WOLFRAM;

	// Get input from args or reply message
	let content = (type === "message_reply") ? messageReply.body : args.join(" ");
	if (!content) return out(getText("noInput"));

	// Send fetching message
	out(getText("fetching"));

	// Handle -p (integral: indefinite or definite)
	if (content.startsWith("-p")) {
		try {
			content = "primitive " + content.slice(3).trim();
			const { data } = await axios.get(`http://api.wolframalpha.com/v2/query`, {
				params: {
					appid: key,
					input: content,
					output: "json"
				}
			});

			if (!data.queryresult.success) return out(getText("error"));

			const pods = data.queryresult.pods;
			if (content.includes("from") && content.includes("to")) {
				const value = pods.find(e => e.id === "Input")?.subpods[0].plaintext;
				if (!value) return out(getText("error"));
				if (value.includes("≈")) {
					const [fractionalPart, decimalPart] = value.split("≈");
					const frac = fractionalPart.split(" = ")[1]?.trim() || "N/A";
					const dec = decimalPart?.trim() || "N/A";
					return out(`📐 Fractional: ${frac}\n🔢 Decimal: ${dec}`);
				}
				return out("📐 Result: " + (value.split(" = ")[1] || "N/A"));
			} else {
				const result = pods.find(e => e.id === "IndefiniteIntegral")?.subpods[0].plaintext;
				if (!result) return out(getText("error"));
				return out("∫ Indefinite Integral: " + result.split(" = ")[1]?.replace("+ constant", "").trim() || "N/A");
			}
		} catch (err) {
			return out(getText("error"), err);
		}
	}

	// Handle -g (graph)
	else if (content.startsWith("-g")) {
		try {
			content = "plot " + content.slice(3).trim();
			const { data } = await axios.get(`http://api.wolframalpha.com/v2/query`, {
				params: {
					appid: key,
					input: content,
					output: "json"
				}
			});

			if (!data.queryresult.success) return out(getText("error"));

			const pods = data.queryresult.pods;
			const plotPod = pods.find(e => e.id === "Plot") || pods.find(e => e.id === "ImplicitPlot");
			if (!plotPod) return out(getText("error"));

			const imgSrc = plotPod.subpods[0].img.src;
			const img = (await axios.get(imgSrc, { responseType: "stream" })).data;
			const path = "./cache/graph.png";
			await fs.ensureDir("./cache");
			img.pipe(fs.createWriteStream(path)).on("close", () => {
				api.sendMessage({ attachment: fs.createReadStream(path) }, threadID, () => fs.unlinkSync(path), messageID);
			});
		} catch (err) {
			return out(getText("error"), err);
		}
	}

	// Handle -v (vector)
	else if (content.startsWith("-v")) {
		try {
			content = "vector " + content.slice(3).trim().replace(/\(/g, "<").replace(/\)/g, ">");
			const { data } = await axios.get(`http://api.wolframalpha.com/v2/query`, {
				params: {
					appid: key,
					input: content,
					output: "json"
				}
			});

			if (!data.queryresult.success) return out(getText("error"));

			const pods = data.queryresult.pods;
			const imgSrc = pods.find(e => e.id === "VectorPlot")?.subpods[0].img.src;
			const length = pods.find(e => e.id === "VectorLength")?.subpods[0].plaintext || "N/A";
			const result = pods.find(e => e.id === "Result")?.subpods[0].plaintext || "N/A";
			if (!imgSrc) return out(getText("error"));

			const img = (await axios.get(imgSrc, { responseType: "stream" })).data;
			const path = "./cache/vector.png";
			await fs.ensureDir("./cache");
			img.pipe(fs.createWriteStream(path)).on("close", () => {
				api.sendMessage({
					body: `📏 Vector Result: ${result}\n📐 Vector Length: ${length}`,
					attachment: fs.createReadStream(path)
				}, threadID, () => fs.unlinkSync(path), messageID);
			});
		} catch (err) {
			return out(getText("error"), err);
		}
	}

	// Handle default: solve equations or expressions
	else {
		try {
			const { data } = await axios.get(`http://api.wolframalpha.com/v2/query`, {
				params: {
					appid: key,
					input: content,
					output: "json"
				}
			});

			if (!data.queryresult.success) return out(getText("error"));

			const pods = data.queryresult.pods;
			let output = "";

			if (pods.some(e => e.id === "Solution")) {
				const pod = pods.find(e => e.id === "Solution");
				output = pod.subpods.map(e => "🧮 Solution: " + e.plaintext).join("\n");
			} else if (pods.some(e => e.id === "ComplexSolution")) {
				const pod = pods.find(e => e.id === "ComplexSolution");
				output = pod.subpods.map(e => "🔮 Complex Solution: " + e.plaintext).join("\n");
			} else if (pods.some(e => e.id === "Result")) {
				output = "✅ Result: " + pods.find(e => e.id === "Result").subpods[0].plaintext;
			} else {
				output = getText("error");
			}

			return out(output);
		} catch (err) {
			return out(getText("error"), err);
		}
	}
};
