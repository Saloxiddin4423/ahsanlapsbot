function escapeMarkdownV2(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
  }
  
  module.exports = escapeMarkdownV2;
  