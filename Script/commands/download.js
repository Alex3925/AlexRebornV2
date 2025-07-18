const axios = require("axios");
const fs = require("fs");
const request = require("request");
const path = require("path");

module.exports.config = {
  name: "download",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Alex Jhon Ponce - Powered by AlexRebornV2",
  description: "Automatically detect link in command and download video",
  commandCategory: "media",
  usages: "[any text containing link]",
  cooldowns: 5,
  dependencies: {
    axios: "",
    request: ""
  }
};

module.exports.languages = {
  en: {
    wait: "⏳ Please wait... fetching video link.",
    noLink: "⚠️ Please provide a valid video link.",
    unsupported: "❌ Unsupported link or video not found.",
    error: "🚫 Error downloading video. Please try again later."
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const { threadID, messageID } = event;
  const input = args.join(" ");

  // Find the first link in input
  const linkMatch = input.match(/(https?:\/\/[^\s]+)/);
  if (!linkMatch) {
    return api.sendMessage(getText("noLink"), threadID, messageID);
  }

  const url = linkMatch[0];
  api.sendMessage(getText("wait"), threadID, messageID);
  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    // Call API to get video data
    const res = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`);
    const data = res.data?.data;

    if (!data || (!data.high && !data.low)) {
      return api.sendMessage(getText("unsupported"), threadID, messageID);
    }

    const { title, high, low } = data;
    const videoUrl = high || low;

    // Create cache folder if not exists
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `video_${Date.now()}.mp4`);
    const caption = `🎬 Title: ${title}\n\nPowered by AlexRebornV2`;

    // Download and send video
    request(videoUrl)
      .pipe(fs.createWriteStream(filePath))
      .on("close", () => {
        api.sendMessage(
          { body: caption, attachment: fs.createReadStream(filePath) },
          threadID,
          () => {
            fs.unlinkSync(filePath);
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
        );
      });
  } catch (err) {
    console.error("❌ Error downloading video:", err);
    api.sendMessage(getText("error"), threadID, messageID);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
