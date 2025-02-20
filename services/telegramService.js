const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN } = require("../config/dotenv");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

module.exports = bot;
