const { Client, GatewayIntentBits } = require('discord.js');

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const DISCORD_TOKEN = 'MTM5NzU3MzM2MzUwOTEwMDc1NQ.G3QaJF.OQ5eCUXyCsK9fhwhMdASxt_2YquP7EPcf2QaUI';

// Define different channel IDs for different log types
const LOG_CHANNELS = {
  userRegistration: '1323208394315792404',
  userLogin: '1323208408727289877',
  forgotPassword: '1323208442177126430',
  resetPassword: '1323208480135450664',
  updatedAvatar: '1323219913153712170',
  updatedUserInfo: '1323219966568173578',
  changedUsername: '1323220030057615482',
  changedEmail: '1323220078744829972',
  changedPassword: '1323220162718994523',
  addedGame: '1323208228154376283',
  updatedGame: '1323208253613801542',
  deletedGame: '1323260174919663616',
  newReport: '1323208309620080667',
  completedReport: '1323208331162292224',
  adminUpdatedUserInfo: '1323221036887441501',
  downloadLinkError: '1323226007494459423', // Add a new channel ID for download link errors
  botError: '1323227008494459424', // Add a new channel ID for bot errors
};

discordClient.login(DISCORD_TOKEN);

function logToDiscord(channelId, message) {
  const channel = discordClient.channels.cache.get(channelId);
  if (channel) {
    channel.send(message);
  } else {
    console.error('Log channel not found');
  }
}

function formatTimestamp(date) {
  const pad = (num) => num.toString().padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function logUserRegistration(username, email) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**User Registration**\n**Username:** ${username}\n**Email:** ${email}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.userRegistration, logMessage);
}

function logUserLogin(username, email) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**User Login**\n**Username:** ${username}\n**Email:** ${email}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.userLogin, logMessage);
}

function logForgotPassword(username, email) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Forgot Password**\n**Username:** ${username}\n**Email:** ${email}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.forgotPassword, logMessage);
}

function logResetPassword(username, userId) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Reset Password**\n**Username:** ${username}\n**User ID:** ${userId}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.resetPassword, logMessage);
}

function logUpdatedAvatar(username, userId) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Updated Avatar**\n**Username:** ${username}\n**User ID:** ${userId}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.updatedAvatar, logMessage);
}

function logUpdatedUserInfo(username, userId) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Updated User Info**\n**Username:** ${username}\n**User ID:** ${userId}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.updatedUserInfo, logMessage);
}

function logChangedUsername(oldUsername, newUsername) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Changed Username**\n**Old Username:** ${oldUsername}\n**New Username:** ${newUsername}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.changedUsername, logMessage);
}

function logChangedEmail(username, newEmail) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Changed Email**\n**Username:** ${username}\n**New Email:** ${newEmail}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.changedEmail, logMessage);
}

function logChangedPassword(username, userId) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Changed Password**\n**Username:** ${username}\n**User ID:** ${userId}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.changedPassword, logMessage);
}

function logAddedGame(username, gameName, gameImageUrl) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Added Game**\n**Username:** ${username}\n**Game Name:** ${gameName}\n**Timestamp:** ${timestamp}\n**Image:**\nhttp://localhost:5000/${gameImageUrl}`;
  logToDiscord(LOG_CHANNELS.addedGame, logMessage);
  // Log an error if the bot does not notify
  setTimeout(() => {
    const channel = discordClient.channels.cache.get(LOG_CHANNELS.addedGame);
    if (!channel.lastMessage || channel.lastMessage.content !== logMessage) {
      logBotError(`Failed to notify about added game: ${gameName} by ${username}`);
    }
  }, 5000); // Check after 5 seconds
}

function logUpdatedGame(username, gameName, changes) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Updated Game**\n**Username:** ${username}\n**Game Name:** ${gameName}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.updatedGame, logMessage);
}

function logDeletedGame(username, gameName) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Deleted Game**\n**Username:** ${username}\n**Game Name:** ${gameName}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.deletedGame, logMessage);
}

function logNewReport(username, reportType, description, mediaUrl = null) {
  const timestamp = formatTimestamp(new Date());
  let logMessage = `**New Report**\n**Username:** ${username}\n**Report Type:** ${reportType}\n**Description:** ${description}\n**Timestamp:** ${timestamp}`;
  if (mediaUrl) {
    logMessage += `\n**Media:** [View Media](${mediaUrl})`;
  }
  logToDiscord(LOG_CHANNELS.newReport, logMessage);
}

function logCompletedReport(username, reportId) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Completed Report**\n**Username:** ${username}\n**Report ID:** ${reportId}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.completedReport, logMessage);
}

function logAdminUpdatedUserInfo(adminUsername, userId) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Admin Updated User Info**\n**Admin Username:** ${adminUsername}\n**User ID:** ${userId}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.adminUpdatedUserInfo, logMessage);
}

function logDownloadLinkError(gameName, linkName, link) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Download Link Error**\n**Game Name:** ${gameName}\n**Link Name:** ${linkName}\n**Link:** ${link}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.downloadLinkError, logMessage);
}

function logBotError(errorMessage) {
  const timestamp = formatTimestamp(new Date());
  const logMessage = `**Bot Error**\n**Error Message:** ${errorMessage}\n**Timestamp:** ${timestamp}`;
  logToDiscord(LOG_CHANNELS.botError, logMessage);
}

module.exports = {
  logUserRegistration,
  logUserLogin,
  logForgotPassword,
  logResetPassword,
  logUpdatedAvatar,
  logUpdatedUserInfo,
  logChangedUsername,
  logChangedEmail,
  logChangedPassword,
  logAddedGame,
  logUpdatedGame,
  logDeletedGame,
  logNewReport,
  logCompletedReport,
  logAdminUpdatedUserInfo,
  logDownloadLinkError,
  logBotError,
};
