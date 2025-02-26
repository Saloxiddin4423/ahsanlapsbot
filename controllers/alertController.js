const bot = require("../services/telegramService");
const db = require("../config/firebase");
const escapeMarkdownV2 = require("../utils/markdownUtils");

db.collection("analysis").orderBy("created_at", "desc").limit(10).onSnapshot(async (snapshot) => {
  console.log("🔄 Yangi analysis tekshirilmoqda...");

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  snapshot.forEach(async (doc) => {
    const analysisData = doc.data();
    const createdAt = analysisData.created_at.toDate();

    if (createdAt < fifteenMinutesAgo) return;

    const symbol = escapeMarkdownV2(analysisData.symbol);
    const timeframe = escapeMarkdownV2(analysisData.timeframe_id);

    console.log(`📜 Analysis: Symbol: ${symbol}, Timeframe: ${timeframe}`);

    const alertsSnapshot = await db.collection("alerts")
      .where("symbols", "array-contains", symbol)
      .get();

    let userIds = new Set();
    
    alertsSnapshot.forEach(alertDoc => {
      
      userIds.add(alertDoc.data().user_id);
    });

    if (userIds.size > 0) {
      const usersSnapshot = await db.collection("user")
        .where("user_id", "in", Array.from(userIds))
        .get();

      let chatIds = [];
      usersSnapshot.forEach(userDoc => {
        if (userDoc.data().chatId) {
          chatIds.push(userDoc.data().chatId);
        }
      });

      const message = `📊 *Yangi Analiz Qo‘shildi\\!* \n\n` +
        `🔹 *Symbol:* ${symbol} \n` +
        `⏳ *Timeframe:* ${timeframe}`;

      chatIds.forEach(chatId => {
        bot.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
      });
    }
  });
});
