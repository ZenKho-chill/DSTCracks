const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // Import body-parser
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https'); // Import https
const http = require('http'); // Import http
const WebSocket = require('ws'); // Import WebSocket
const os = require('os'); // Import os module
const disk = require('diskusage'); // Import diskusage module
const osUtils = require('os-utils'); // Import os-utils module
const multer = require('multer'); // Import multer for file uploads
const { Client, GatewayIntentBits } = require('discord.js'); // Import GatewayIntentBits

const {
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
  logNewReport,
  logCompletedReport,
  logAdminUpdatedUserInfo,
  logDownloadLinkError,
  logDeletedGame
} = require('./logger');

const app = express();
const server = http.createServer(app); // Create HTTP server
const wss = new WebSocket.Server({ server }); // Create WebSocket server

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const DISCORD_TOKEN = 'MTMyMzIwNDUwNDUzMDg0NTY5OQ.GPlOfl.CorkA9EMOjoSZJkpiWJgcO-LjT8c-V-LVbThp4';
const LOG_CHANNEL_ID = '1323203413437055051';

discordClient.once('ready', () => {
  console.log('Discord bot is ready!');
});

discordClient.login(DISCORD_TOKEN);

function logToDiscord(message) {
  const channel = discordClient.channels.cache.get(LOG_CHANNEL_ID);
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

const corsOptions = {
  origin: ['https://dstcracks.site', 'https://backend.dstcracks.site'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase the limit to 10mb
app.use(bodyParser.json({ limit: '10mb' })); // Increase the limit to 10mb
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // Increase the limit to 10mb
app.use('/image', express.static(path.join(__dirname, 'image'))); // Serve static files correctly

const allowedOrigins = ['https://dstcracks.site', 'https://www.dstcracks.site'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  } else {
    res.status(403).send('Access denied');
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'requireGameImage') {
      cb(null, 'image/require-game-image');
    } else {
      cb(null, 'image/reports');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter 
});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dstcracks'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database');
});

app.get('/games', (req, res) => {
  const query = `
    SELECT 
      games.id, games.name, games.image_url, games.updated_by, games.category 
    FROM games 
    LEFT JOIN users ON games.updated_by = users.username
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching games:', err);
      res.status(500).send('Lỗi máy chủ');
      return;
    }
    results.forEach(game => {
      game.category = game.category ? game.category.split(',') : [];
    });
    res.json(results);
  });
});

function boldKeywords(text) {
  const keywords = ['OS', 'Processor', 'Memory', 'Graphics', 'DirectX', 'Network', 'Storage', 'Additional Notes'];
  let firstLine = true;
  return text.split('<br>').map(line => {
    if (firstLine) {
      firstLine = false;
      return line; // Do not bold keywords in the first line except for "OS"
    }
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      line = line.replace(regex, '<strong>$1</strong>');
    });
    return line;
  }).join('<br>');
}

app.get('/games/:id', (req, res) => {
  const gameId = req.params.id;
  const query = `
    SELECT 
      name, image_url, description, minimum_requirements, recommended_requirements, 
      updated_by, release_date, update_date, latest_download_links, update_links, 
      old_download_links, vietnamese_link, notes, version, category
    FROM games 
    WHERE id = ?
  `;
  db.query(query, [gameId], (err, results) => {
    if (err) {
      console.error('Error fetching game details:', err);
      res.status(500).send('Lỗi máy chủ');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Không tìm thấy trò chơi');
      return;
    }
    const game = results[0];
    try {
      game.latest_download_links = game.latest_download_links ? JSON.parse(game.latest_download_links) : [];
      game.update_links = game.update_links ? JSON.parse(game.update_links) : [];
      game.old_download_links = game.old_download_links ? JSON.parse(game.old_download_links) : [];
      game.vietnamese_link = game.vietnamese_link ? JSON.parse(game.vietnamese_link) : [];
      game.description = game.description ? game.description.replace(/\n/g, '<br>') : ''; // Replace newlines with <br> tags
      game.minimum_requirements = game.minimum_requirements ? boldKeywords(game.minimum_requirements.replace(/\n/g, '<br>')) : ''; // Replace newlines with <br> tags and bold keywords
      game.recommended_requirements = game.recommended_requirements ? boldKeywords(game.recommended_requirements.replace(/\n/g, '<br>')) : ''; // Replace newlines with <br> tags and bold keywords
      game.notes = game.notes ? game.notes.replace(/\n/g, '<br>') : ''; // Replace newlines with <br> tags
      game.category = game.category ? game.category.split(',') : [];
      game.image_url = game.image_url ? `https://backend.dstcracks.site/${game.image_url}` : ''; // Ensure full URL
    } catch (parseError) {
      console.error('Error parsing JSON columns:', parseError);
      res.status(500).send('Lỗi máy chủ');
      return;
    }
    res.json(game);
  });
});

app.post('/upload-image', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).send({ success: false, message: 'Không có hình ảnh được cung cấp' });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const extension = image.split(';')[0].split('/')[1];
  const newImageFilename = `${Date.now()}.${extension}`;
  const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);

  fs.writeFile(newImagePath, base64Data, { encoding: 'base64' }, (err) => {
    if (err) {
      console.error('Error saving image:', err);
      return res.status(500).send({ success: false, message: 'Lỗi máy chủ' });
    }
    res.status(200).send({ success: true, imageUrl: image });
  });
});

app.get('/reports', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT * FROM report';

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching reports:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.get('/reports/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const reportId = req.params.id;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT * FROM report WHERE ID = ?';

    db.query(query, [reportId], (err, results) => {
      if (err) {
        console.error('Error fetching report:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Không tìm thấy báo cáo' });
        return;
      }
      res.json(results[0]);
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

// Add route to handle completing a report
app.post('/reports/complete/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const reportId = req.params.id;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'UPDATE report SET status = "completed" WHERE ID = ?';

    db.query(query, [reportId], (err, results) => {
      if (err) {
        console.error('Error completing report:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.affectedRowss === 0) {
        res.status(404).send({ message: 'Không tìm thấy báo cáo' });
        return;
      }
      const getUserQuery = 'SELECT username FROM report WHERE ID = ?'; // Change user_id to username
      db.query(getUserQuery, [reportId], (err, results) => {
        if (err) {
          console.error('Error fetching username:', err);
          return res.status(500).send({ message: 'Lỗi máy chủ' });
        }
        const username = results[0].username;
        notifyUserReportCompletion(username, reportId); // Pass username instead of user_id
        logCompletedReport(username, reportId);
        res.status(200).send({ message: 'Báo cáo đã được đánh dấu là hoàn thành' });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

function sanitizeFilename(name) {
  return name.replace(/[<>:"\/\\|?*@!]/g, '_').replace(/\s+/g, '_').replace(/:/g, '_'); // Replace special characters, spaces, and colons with underscores
}

app.post('/games', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { name, image_url, description, minimum_requirements, recommended_requirements, latest_download_links, update_links, old_download_links, vietnamese_link, notes, version, category } = req.body;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT username, role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const username = results[0].username;
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date in MySQL datetime format

      // Add "vietnamese" to category if vietnamese_link is enabled
      if (vietnamese_link.length > 0 && !category.includes('vietnamese')) {
        category.push('vietnamese');
      }

      const sanitizedFilename = sanitizeFilename(name);

      const insertQuery = `
        INSERT INTO games (name, image_url, description, minimum_requirements, recommended_requirements, latest_download_links, update_links, old_download_links, vietnamese_link, notes, version, category, updated_by, update_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [name, image_url, description, minimum_requirements, recommended_requirements, JSON.stringify(latest_download_links), JSON.stringify(update_links), JSON.stringify(old_download_links), JSON.stringify(vietnamese_link), notes, version, category.join(','), username, currentDate], (err, result) => {
        if (err) {
          console.error('Error creating game:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }

        // Handle image saving
        if (image_url && image_url.startsWith('data:image/')) {
          const extension = image_url.split(';')[0].split('/')[1];
          const newImageFilename = `${sanitizedFilename}.${extension}`;
          const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);

          // Save the new image
          const base64Data = image_url.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFile(newImagePath, base64Data, { encoding: 'base64' }, (err) => {
            if (err) {
              console.error('Error saving new image:', err);
              res.status(500).send({ message: 'Lỗi máy chủ' });
              return;
            }

            // Update the image URL in the database
            const updateImageQuery = 'UPDATE games SET image_url = ? WHERE id = ?';
            db.query(updateImageQuery, [`image/games-image/${newImageFilename}`, result.insertId], (err) => {
              if (err) {
                console.error('Error updating image URL:', err);
                res.status(500).send({ message: 'Lỗi máy chủ' });
                return;
              }
              logAddedGame(username, name, `image/games-image/${newImageFilename}`);
              res.status(201).send({ message: 'Tạo trò chơi thành công', imageUrl: `image/games-image/${newImageFilename}` });
            });
          });
        } else {
          logAddedGame(username, name);
          res.status(201).send({ message: 'Tạo trò chơi thành công' });
        }
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.put('/games/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const gameId = req.params.id;
  const { name, image_url, description, minimum_requirements, recommended_requirements, latest_download_links, update_links, old_download_links, vietnamese_link, notes, version, category, release_date } = req.body;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT username, role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Lỗi máy chủ');
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send('Không được phép');
        return;
      }

      const username = results[0].username;
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date in MySQL datetime format

      // Add "vietnamese" to category if vietnamese_link is enabled
      if (vietnamese_link.length > 0 && !category.includes('vietnamese')) {
        category.push('vietnamese');
      }

      const sanitizedFilename = sanitizeFilename(name);

      // Handle image saving and renaming
      let imagePath = image_url;
      if (image_url && image_url.startsWith('data:image/')) {
        const base64Data = image_url.replace(/^data:image\/\w+;base64,/, '');
        const extension = image_url.split(';')[0].split('/')[1];
        const newImageFilename = `${sanitizedFilename}.${extension}`;
        const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);

        fs.writeFile(newImagePath, base64Data, { encoding: 'base64' }, (err) => {
          if (err) {
            console.error('Error saving image:', err);
            res.status(500).send('Lỗi máy chủ');
            return;
          }
          imagePath = `image/games-image/${newImageFilename}`;
          updateGame();
        });
      } else if (image_url && !image_url.startsWith('data:image/')) {
        const extension = image_url.split('.').pop();
        const newImageFilename = `${sanitizedFilename}.${extension}`;
        const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);
        const oldImagePath = path.join(__dirname, image_url.replace('https://backend.dstcracks.site/', ''));

        fs.rename(oldImagePath, newImagePath, (err) => {
          if (err) {
            console.error('Error renaming image:', err);
            res.status(500).send('Lỗi máy chủ');
            return;
          }
          imagePath = `image/games-image/${newImageFilename}`;
          updateGame();
        });
      } else {
        updateGame();
      }

      function updateGame() {
        const updateQuery = `
          UPDATE games 
          SET name = ?, image_url = ?, description = ?, minimum_requirements = ?, recommended_requirements = ?, latest_download_links = ?, update_links = ?, old_download_links = ?, vietnamese_link = ?, notes = ?, version = ?, category = ?, updated_by = ?, update_date = ?, release_date = ?
          WHERE id = ?
        `;
        db.query(updateQuery, [name, imagePath, description, minimum_requirements, recommended_requirements, JSON.stringify(latest_download_links), JSON.stringify(update_links), JSON.stringify(old_download_links), JSON.stringify(vietnamese_link), notes, version, category.join(','), username, currentDate, release_date, gameId], (err) => {
          if (err) {
            console.error('Error updating game:', err);
            res.status(500).send('Lỗi máy chủ');
            return;
          }
          logUpdatedGame(username, name); // Log the updated game
          res.status(200).send('Cập nhật trò chơi thành công');
        });
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

const CLIENT_ID = '853911447752-m5tol97sbu11gjitb23kktq3dnnviqmh.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04KGoFIEZxky1CgYIARAAGAQSNwF-L9Ir_vkb3zjNaDouqTDBzE5obtI7yuZYQZnV56OxZZebS33UVeBsirAodTRpT-ilS9IzcaM';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendVerificationEmail(email, verificationToken) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'deathsquadteam98@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: 'deathsquadteam98.com',
      to: email,
      subject: 'Kích hoạt tài khoản',
      text: `Vui lòng kích hoạt tài khoản: https://dstcracks.site/verify/${verificationToken}`
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending verification email');
  }
}

async function sendResetPasswordEmail(email, username, tempPassword) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'deathsquadteam98@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: 'deathsquadteam98.com',
      to: email,
      subject: 'Đặt lại mật khẩu',
      text: `Tên đăng nhập của bạn là: ${username}\nMật khẩu tạm thời của bạn là: ${tempPassword}\nVui lòng đăng nhập và đổi mật khẩu ngay lập tức.`
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending reset password email');
  }
}

async function sendEmailChangeNotification(oldEmail, newEmail, recoveryToken) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'deathsquadteam98@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: 'deathsquadteam98@gmail.com', // Ensure the sender email is correct
      to: oldEmail, // Correctly set the recipient email
      subject: 'Email đã được thay đổi',
      text: `Email của bạn đã được thay đổi thành: ${newEmail}. Nếu bạn không thực hiện thay đổi này, vui lòng sử dụng liên kết sau để khôi phục tài khoản của bạn: https://dstcracks.site/recover/${recoveryToken}`
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending email change notification:', error);
    throw new Error('Error sending email change notification');
  }
}

async function sendAccountRecoveryEmail(email, recoveryToken) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'deathsquadteam98@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: 'deathsquadteam98@gmail.com',
      to: email,
      subject: 'Account Recovery',
      text: `Please use the following link to recover your account: https://dstcracks.site/recover/${recoveryToken}`
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending account recovery email:', error);
    throw new Error('Error sending account recovery email');
  }
}

async function sendProfileChangeNotification(email, changes) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'deathsquadteam98@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: 'deathsquadteam98@gmail.com',
      to: email,
      subject: 'Profile Changes Notification',
      text: `Your profile has been updated with the following changes: ${changes.join(', ')}`
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending profile change notification:', error);
    throw new Error('Error sending profile change notification');
  }
}

function generateTempPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const notifyUserReportCompletion = (username, reportId) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.username === username) {
      client.send(JSON.stringify({ type: 'reportCompletion', reportId }));
    }
  });
};

wss.on('connection', (wss, req) => {
  const token = req.url.split('token=')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      wss.username = decoded.username; // Use username instead of user_id

      // Check for completed reports and notify the user
      const checkReportsQuery = 'SELECT ID FROM report WHERE username = ? AND status = "completed"';
      db.query(checkReportsQuery, [wss.username], (err, results) => {
        if (err) {
          console.error('Error checking completed reports:', err);
          return;
        }
        results.forEach(report => {
          wss.send(JSON.stringify({ type: 'reportCompletion', reportId: report.ID }));
        });
      });
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  }

  const sendSystemUsage = async () => {
    osUtils.cpuUsage(async (cpuUsage) => {
      cpuUsage = Math.round(cpuUsage * 100); // Calculate CPU usage percentage and round to the nearest integer
      const totalMemory = Math.round(os.totalmem() / (1024 ** 3)); // Total memory in GB
      const usedMemory = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2); // Used memory in GB with two decimal places
      const memoryUsage = Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100); // Calculate memory usage percentage and round to the nearest integer
      const cpuCores = os.cpus().length; // Get the number of CPU cores
      const cpuSpeed = os.cpus()[0].speed; // Get the CPU speed in MHz

      let diskUsage = 0;
      let totalDisk = 0;
      let usedDisk = 0;
      try {
        const { total, free } = await disk.check('/');
        totalDisk = Math.round(total / (1024 ** 3)); // Total disk space in GB
        usedDisk = ((total - free) / (1024 ** 3)).toFixed(2); // Used disk space in GB with two decimal places
        diskUsage = Math.round((total - free) / total * 100); // Calculate disk usage percentage and round to the nearest integer
      } catch (err) {
        console.error('Error getting disk usage:', err);
      }

      wss.send(JSON.stringify({
        type: 'systemUsage',
        cpuUsage,
        memoryUsage,
        diskUsage,
        cpuCores,
        cpuSpeed,
        totalMemory,
        usedMemory,
        totalDisk,
        usedDisk
      }));
    });
  };

  const interval = setInterval(sendSystemUsage, 1000); // Send system usage every 1 second

  wss.on('close', () => {
    clearInterval(interval); // Clear the interval when the client disconnects
  });
});

function notifyEmailUpdate(newEmail) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'emailUpdate', newEmail }));
    }
  });
}

function notifyUserUpdate() {
  const usersQuery = 'SELECT id, username, email, role, banned FROM users';
  db.query(usersQuery, (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'userUpdate', users }));
      }
    });
  });
}

function notifyGameUpdate() {
  const gamesQuery = `
    SELECT 
      games.id, games.name, games.image_url, games.updated_by, games.category 
    FROM games 
    LEFT JOIN users ON games.updated_by = users.username
  `;
  db.query(gamesQuery, (err, games) => {
    if (err) {
      console.error('Error fetching games:', err);
      return;
    }
    games.forEach(game => {
      game.category = game.category ? game.category.split(',') : [];
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'gameUpdate', games }));
      }
    });
  });
}

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    // Check if email or username already exists
    const checkQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(checkQuery, [email, username], async (err, results) => {
      if (err) {
        console.error('Error checking user:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length > 0) {
        res.status(400).send({ message: 'Email hoặc tên đăng nhập đã tồn tại' });
        return;
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const defaultAvatarUrl = 'image/users-avatar/default-avatar.jpg';
      const query = 'INSERT INTO users (email, username, password_hash, verification_token, avatar_url) VALUES (?, ?, ?, ?, ?)';
      db.query(query, [email, username, password, verificationToken, defaultAvatarUrl], async (err, results) => {
        if (err) {
          console.error('Error registering user:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }

        try {
          await sendVerificationEmail(email, verificationToken);
          logUserRegistration(username, email);
          res.status(201).send({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.' });
        } catch (error) {
          res.status(500).send({ message: 'Lỗi gửi email xác minh' });
        }
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Lỗi máy chủ' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  // Verify reCAPTCHA token
  const recaptchaSecret = '6LcWM5EqAAAAAEhzy8LXcnwBF7H-fK3OspAdZHYw';
  try {
    const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`);
    if (!recaptchaResponse.data.success) {
      console.error('Xác minh reCAPTCHA thất bại:', recaptchaResponse.data['error-codes']);
      if (recaptchaResponse.data['error-codes'].includes('timeout-or-duplicate')) {
        return res.status(400).send({ message: 'Xác minh reCAPTCHA thất bại: hết thời gian hoặc trùng lặp' });
      }
      return res.status(400).send({ message: 'Xác minh reCAPTCHA thất bại' });
    }
  } catch (error) {
    console.error('Lỗi xác minh reCAPTCHA:', error);
    return res.status(500).send({ message: 'Lỗi máy chủ trong quá trình xác minh reCAPTCHA' });
  }

  const query = 'SELECT * FROM users WHERE email = ? OR username = ?';
  db.query(query, [email, email], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).send({ message: 'Lỗi máy chủ' });
      return;
    }
    if (results.length === 0) {
      res.status(400).send({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }
    const user = results[0];
    if (!user.verified) {
      res.status(400).send({ message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.' });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(400).send({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }
    const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '7d' });
    logUserLogin(user.username, user.email);
    if (user.reset_password) {
      res.status(200).send({ message: 'Phát hiện mật khẩu tạm thời. Đang chuyển hướng đến trang đặt lại mật khẩu.', token, reset_password: true });
    } else {
      res.status(200).send({ message: 'Đăng nhập thành công', token, reset_password: false });
    }
  });
});

app.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  const query = 'SELECT * FROM users WHERE verification_token = ?';
  db.query(query, [token], (err, results) => {
    if (err) {
      console.error('Error verifying user:', err);
      res.status(500).send({ message: 'Lỗi máy chủ', verified: false });
      return;
    }
    if (results.length === 0) {
      res.status(400).send({ message: 'Token không hợp lệ hoặc đã hết hạn', verified: false });
      return;
    }

    const user = results[0];
    if (user.email_request_change) {
      // Update email if it's an email change verification
      const updateQuery = 'UPDATE users SET email = ?, verification_token = NULL, email_request_change = NULL WHERE id = ?';
      db.query(updateQuery, [user.email_request_change, user.id], (err) => {
        if (err) {
          console.error('Error updating email:', err);
          res.status(500).send({ message: 'Lỗi máy chủ', verified: false });
          return;
        }
        notifyEmailUpdate(user.email_request_change); // Notify clients about the email update
        res.status(200).send({ message: 'Xác minh email và cập nhật thành công', verified: true, newEmail: user.email_request_change });
      });
    } else {
      // Regular account verification
      const updateQuery = 'UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?';
      db.query(updateQuery, [user.id], (err) => {
        if (err) {
          console.error('Error verifying user:', err);
          res.status(500).send({ message: 'Lỗi máy chủ', verified: false });
          return;
        }
        res.status(200).send({ message: 'Xác minh tài khoản thành công', verified: true });
      });
    }
  });
});

app.get('/check-verification/:email', (req, res) => {
  const { email } = req.params;
  const query = 'SELECT verified FROM users WHERE email = ? OR username = ?';
  db.query(query, [email, email], (err, results) => {
    if (err) {
      console.error('Error checking verification status:', err);
      res.status(500).send({ message: 'Lỗi máy chủ' });
      return;
    }
    if (results.length > 0) {
      res.json({ verified: results[0].verified });
    } else {
      res.status(404).send({ message: 'Không tìm thấy người dùng' });
    }
  });
});

app.post('/resend-verification', (req, res) => {
  const { email } = req.body;
  const query = 'SELECT email, verification_token, verified FROM users WHERE email = ? OR username = ?';
  db.query(query, [email, email], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).send({ message: 'Lỗi máy chủ' });
      return;
    }
    if (results.length === 0) {
      res.status(404).send({ message: 'Không tìm thấy người dùng' });
      return;
    }
    const user = results[0];
    if (user.verified) {
      res.status(400).send({ message: 'Tài khoản đã được kích hoạt.' });
      return;
    }
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const updateQuery = 'UPDATE users SET verification_token = ? WHERE email = ? OR username = ?';
    db.query(updateQuery, [newVerificationToken, email, email], async (err) => {
      if (err) {
        console.error('Error updating verification token:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      try {
        await sendVerificationEmail(user.email, newVerificationToken);
        res.status(200).send({ message: 'Gửi email xác minh thành công.' });
      } catch (error) {
        res.status(500).send({ message: 'Lỗi gửi email xác minh' });
      }
    });
  });
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).send({ message: 'Lỗi máy chủ' });
      return;
    }
    if (results.length === 0) {
      res.status(404).send({ message: 'Email không tồn tại' });
      return;
    }

    const user = results[0];
    const tempPassword = generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    const updateQuery = 'UPDATE users SET password_hash = ?, reset_password = TRUE WHERE email = ?';
    db.query(updateQuery, [hashedTempPassword, email], async (err) => {
      if (err) {
        console.error('Error updating password:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      try {
        await sendResetPasswordEmail(email, user.username, tempPassword);
        logForgotPassword(user.username, email);
        res.status(200).send({ message: 'Gửi email đặt lại mật khẩu thành công.' });
      } catch (error) {
        res.status(500).send({ message: 'Lỗi gửi email đặt lại mật khẩu' });
      }
    });
  });
});

app.post('/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Không được phép' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password_hash = ?, reset_password = FALSE WHERE id = ?';
    db.query(query, [hashedPassword, decoded.id], (err) => {
      if (err) {
        console.error('Error updating password:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      logResetPassword(decoded.username, decoded.id);
      res.status(200).send({ message: 'Đặt lại mật khẩu thành công' });
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send({ message: 'Lỗi máy chủ' });
  }
});

app.post('/recover-account', async (req, res) => {
  const { email } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).send({ message: 'Lỗi máy chủ' });
      return;
    }
    if (results.length === 0) {
      res.status(404).send({ message: 'Không tìm thấy email' });
      return;
    }

    const user = results[0];
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const updateQuery = 'UPDATE users SET recovery_token = ? WHERE email = ?';
    db.query(updateQuery, [recoveryToken, email], async (err) => {
      if (err) {
        console.error('Error updating recovery token:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      try {
        await sendAccountRecoveryEmail(email, recoveryToken);
        res.status(200).send({ message: 'Gửi email khôi phục tài khoản thành công.' });
      } catch (error) {
        res.status(500).send({ message: 'Lỗi gửi email khôi phục tài khoản' });
      }
    });
  });
});

app.post('/reset-recovered-password', async (req, res) => {
  const { recoveryToken, username, email, newPassword } = req.body;
  const query = 'SELECT * FROM users WHERE recovery_token = ?';
  db.query(query, [recoveryToken], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).send({ message: 'Lỗi máy chủ' });
      return;
    }
    if (results.length === 0) {
      res.status(400).send({ message: 'Token khôi phục không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const user = results[0];

    // Check if the new username or email already exists
    const checkQuery = 'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?';
    db.query(checkQuery, [username, email, user.id], async (err, results) => {
      if (err) {
        console.error('Error checking username or email:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length > 0) {
        res.status(400).send({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = 'UPDATE users SET username = ?, email = ?, password_hash = ?, recovery_token = NULL WHERE id = ?';
      db.query(updateQuery, [username, email, hashedNewPassword, user.id], (err) => {
        if (err) {
          console.error('Error updating user info:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        res.status(200).send({ message: 'Khôi phục và cập nhật tài khoản thành công' });
      });
    });
  });
});

app.get('/recaptcha-site-key', (req, res) => {
  const recaptchaSiteKey = '6LcWM5EqAAAAALjZNid2ubwYteboafM8T6cD-mI9';
  res.json({ siteKey: recaptchaSiteKey });
});

app.get('/user-info', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT id, avatar_url, username, email, role, created_at FROM users WHERE id = ?'; // Include id in the query
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user info:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length > 0) {
        res.json(results[0]); // Return id, avatar_url, username, email, role, and created_at
      } else {
        res.status(404).send({ message: 'Không tìm thấy người dùng' });
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/update-avatar', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { image } = req.body;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT username, avatar_url FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user info:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Không tìm thấy người dùng' });
        return;
      }

      const user = results[0];
      const oldAvatarPath = path.join(__dirname, user.avatar_url); // Correct the path construction
      const isDefaultAvatar = user.avatar_url === 'image/users-avatar/default-avatar.jpg';
      const extension = image.split(';')[0].split('/')[1];
      const newAvatarFilename = `${user.username}.${extension}`;
      const newAvatarPath = path.join(__dirname, 'image/users-avatar', newAvatarFilename);

      // Save the new image
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFile(newAvatarPath, base64Data, { encoding: 'base64' }, (err) => {
        if (err) {
          console.error('Error saving new avatar:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }

        // Update the user's avatar URL in the database
        const updateQuery = 'UPDATE users SET avatar_url = ? WHERE id = ?';
        db.query(updateQuery, [`image/users-avatar/${newAvatarFilename}`, decoded.id], (err) => {
          if (err) {
            console.error('Error updating avatar URL:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }

          // Delete the old avatar if it's not the default avatar
          if (!isDefaultAvatar) {
            fs.unlink(oldAvatarPath, (err) => {
              if (err) {
                console.error('Error deleting old avatar:', err);
              }
            });
          }

          logUpdatedAvatar(user.username, decoded.id);
          res.status(200).send({ message: 'Cập nhật ảnh đại diện thành công', avatar_url: `image/users-avatar/${newAvatarFilename}` });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/update-user-info', async (req, res) => {
  const { currentPassword, username, email, newPassword } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!currentPassword || !username || !email || !newPassword) {
    return res.status(400).send({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT email, password_hash FROM users WHERE id = ?';
    db.query(query, [decoded.id], async (err, results) => {
      if (err) {
        console.error('Error fetching user info:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Không tìm thấy người dùng' });
        return;
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        res.status(400).send({ message: 'Mật khẩu hiện tại không đúng' });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = 'UPDATE users SET username = ?, email = ?, password_hash = ? WHERE id = ?';
      db.query(updateQuery, [username, email, hashedNewPassword, decoded.id], async (err) => {
        if (err) {
          console.error('Error updating user info:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }

        const changes = [];
        if (username !== user.username) changes.push('username');
        if (email !== user.email) changes.push('email');
        if (newPassword) changes.push('password');

        try {
          if (changes.includes('email')) {
            await sendProfileChangeNotification(user.email, changes);
          } else {
            await sendProfileChangeNotification(email, changes);
          }
          logUpdatedUserInfo(username, decoded.id);
          res.status(200).send({ message: 'Cập nhật thông tin người dùng thành công' });
        } catch (error) {
          res.status(500).send({ message: 'Lỗi gửi thông báo thay đổi hồ sơ' });
        }
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/change-username', async (req, res) => {
  const { newUsername } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    
    // Check if the new username already exists
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [newUsername], (err, results) => {
      if (err) {
        console.error('Error checking username:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length > 0) {
        res.status(400).send({ message: 'Tên đăng nhập đã tồn tại' });
        return;
      }

      // Update the username
      const updateQuery = 'UPDATE users SET username = ? WHERE id = ?';
      db.query(updateQuery, [newUsername, decoded.id], (err) => {
        if (err) {
          console.error('Error updating username:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        logChangedUsername(decoded.username, newUsername);
        res.status(200).send({ message: 'Tên đăng nhập đã được thay đổi thành công' });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/change-email', async (req, res) => {
  const { newEmail } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    
    // Retrieve the old email
    const getEmailQuery = 'SELECT email FROM users WHERE id = ?';
    db.query(getEmailQuery, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching old email:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Không tìm thấy người dùng' });
        return;
      }

      const oldEmail = results[0].email;

      // Check if the new email already exists
      const checkQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(checkQuery, [newEmail], (err, results) => {
        if (err) {
          console.error('Error checking email:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (results.length > 0) {
          res.status(400).send({ message: 'Email đã tồn tại' });
          return;
        }

        // Generate a new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const recoveryToken = crypto.randomBytes(32).toString('hex');
        const updateQuery = 'UPDATE users SET verification_token = ?, email_request_change = ?, recovery_token = ? WHERE id = ?';
        db.query(updateQuery, [verificationToken, newEmail, recoveryToken, decoded.id], async (err) => {
          if (err) {
            console.error('Error updating email:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }

          try {
            await sendVerificationEmail(newEmail, verificationToken);
            await sendEmailChangeNotification(oldEmail, newEmail, recoveryToken);
            logChangedEmail(decoded.username, newEmail);
            res.status(200).send({ message: 'Email đã được thay đổi. Vui lòng kiểm tra email mới để xác nhận.' });
          } catch (error) {
            res.status(500).send({ message: 'Lỗi gửi email xác minh' });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (newPassword !== confirmNewPassword) {
    return res.status(400).send({ message: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT password_hash FROM users WHERE id = ?';
    db.query(query, [decoded.id], async (err, results) => {
      if (err) {
        console.error('Error fetching user info:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Không tìm thấy người dùng' });
        return;
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        res.status(400).send({ message: 'Mật khẩu hiện tại không đúng' });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
      db.query(updateQuery, [hashedNewPassword, decoded.id], (err) => {
        if (err) {
          console.error('Error updating password:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        logChangedPassword(decoded.username, decoded.id);
        res.status(200).send({ message: 'Mật khẩu đã được thay đổi thành công' });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.get('/admin/users', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { page = 1, limit = 9999999999 } = req.query; // Default to page 1 and limit 10
  const offset = (page - 1) * limit;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const usersQuery = 'SELECT id, username, email, role, banned FROM users LIMIT ? OFFSET ?';
      db.query(usersQuery, [parseInt(limit), parseInt(offset)], (err, users) => {
        if (err) {
          console.error('Error fetching users:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        res.json(users);
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.delete('/admin/users/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const currentUserRole = results[0].role;

      const targetUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(targetUserQuery, [userId], (err, targetResults) => {
        if (err) {
          console.error('Error fetching target user role:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (targetResults.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }

        const targetUserRole = targetResults[0].role;

        if ((currentUserRole === 'owner' && targetUserRole === 'owner') || 
            (currentUserRole === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'owner'))) {
          res.status(403).send({ message: 'Không được phép' });
          return;
        }

        const deleteQuery = 'DELETE FROM users WHERE id = ?';
        db.query(deleteQuery, [userId], (err) => {
          if (err) {
            console.error('Error deleting user:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }
          notifyUserUpdate(); // Notify clients about the user update
          res.status(200).send({ message: 'Xóa người dùng thành công' });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/admin/users/ban/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const currentUserRole = results[0].role;

      const targetUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(targetUserQuery, [userId], (err, targetResults) => {
        if (err) {
          console.error('Error fetching target user role:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (targetResults.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }

        const targetUserRole = targetResults[0].role;

        if ((currentUserRole === 'owner' && targetUserRole === 'owner') || 
            (currentUserRole === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'owner'))) {
          res.status(403).send({ message: 'Không được phép' });
          return;
        }

        const banQuery = 'UPDATE users SET banned = TRUE WHERE id = ?';
        db.query(banQuery, [userId], (err) => {
          if (err) {
            console.error('Error banning user:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }
          notifyUserUpdate(); // Notify clients about the user update
          res.status(200).send({ message: 'Cấm người dùng thành công' });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/admin/users/unban/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const currentUserRole = results[0].role;

      const targetUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(targetUserQuery, [userId], (err, targetResults) => {
        if (err) {
          console.error('Error fetching target user role:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (targetResults.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }

        const targetUserRole = targetResults[0].role;

        if ((currentUserRole === 'owner' && targetUserRole === 'owner') || 
            (currentUserRole === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'owner'))) {
          res.status(403).send({ message: 'Không được phép' });
          return;
        }

        const unbanQuery = 'UPDATE users SET banned = FALSE WHERE id = ?';
        db.query(unbanQuery, [userId], (err) => {
          if (err) {
            console.error('Error unbanning user:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }
          notifyUserUpdate(); // Notify clients about the user update
          res.status(200).send({ message: 'Bỏ cấm người dùng thành công' });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.get('/admin/users/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const userQuery = 'SELECT id, username, email, role FROM users WHERE id = ?'; // Exclude password_hash
      db.query(userQuery, [userId], (err, user) => {
        if (err) {
          console.error('Error fetching user info:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (user.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }
        res.json(user[0]);
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.put('/admin/users/role/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  const { role } = req.body;
  const validRoles = ['member', 'admin', 'owner'];

  if (!validRoles.includes(role)) {
    return res.status(400).send({ message: 'Vai trò không hợp lệ' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const currentUserRole = results[0].role;

      const targetUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(targetUserQuery, [userId], (err, targetResults) => {
        if (err) {
          console.error('Error fetching target user role:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (targetResults.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }

        const targetUserRole = targetResults[0].role;

        if ((currentUserRole === 'owner' && targetUserRole === 'owner') || 
            (currentUserRole === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'owner'))) {
          res.status(403).send({ message: 'Không được phép' });
          return;
        }

        const updateRoleQuery = 'UPDATE users SET role = ? WHERE id = ?';
        db.query(updateRoleQuery, [role, userId], (err) => {
          if (err) {
            console.error('Error updating user role:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }
          res.status(200).send({ message: 'Cập nhật vai trò người dùng thành công' });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.put('/admin/users/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  const { email, username, password } = req.body;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const currentUserRole = results[0].role;

      const targetUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(targetUserQuery, async (err, targetResults) => {
        if (err) {
          console.error('Error fetching target user role:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (targetResults.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }

        let updateQuery = 'UPDATE users SET email = ?, username = ? WHERE id = ?';
        let queryParams = [email, username, userId];

        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateQuery = 'UPDATE users SET email = ?, username = ?, password_hash = ? WHERE id = ?';
          queryParams = [email, username, hashedPassword, userId];
        }

        db.query(updateQuery, queryParams, (err) => {
          if (err) {
            console.error('Error updating user info:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }
          logAdminUpdatedUserInfo(decoded.username, userId);
          res.status(200).send({ message: 'Cập nhật thông tin người dùng thành công' });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

// Add CORS headers to responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, PATCH,  POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.delete('/games/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const gameId = req.params.id;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      // Fetch the image URL and game name before deleting the game
      const fetchGameQuery = 'SELECT image_url, name FROM games WHERE id = ?';
      db.query(fetchGameQuery, [gameId], (err, results) => {
        if (err) {
          console.error('Error fetching game details:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (results.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy trò chơi' });
          return;
        }

        const { imageUrl, name: gameName } = results[0];

        const deleteQuery = 'DELETE FROM games WHERE id = ?';
        db.query(deleteQuery, [gameId], (err) => {
          if (err) {
            console.error('Error deleting game:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }

          // Delete the image file if it exists
          if (imageUrl) {
            const imagePath = path.join(__dirname, imageUrl);
            fs.unlink(imagePath, (err) => {
              if (err) {
                console.error('Error deleting game image:', err);
              }
            });
          }

          logDeletedGame(decoded.username, gameName); // Log the deleted game
          notifyGameUpdate(); // Notify clients about the game update
          res.status(200).send({ message: 'Xóa trò chơi thành công' });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/games/new', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { name, image_url, description, minimum_requirements, recommended_requirements, latest_download_links, update_links, old_download_links, vietnamese_link, notes, version, category, release_date } = req.body;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT username, role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const username = results[0].username;
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date in MySQL datetime format

      // Add "vietnamese" to category if vietnamese_link is enabled
      if (vietnamese_link.length > 0 && !category.includes('vietnamese')) {
        category.push('vietnamese');
      }

      const sanitizedFilename = sanitizeFilename(name);

      // Handle image saving
      let imagePath = '';
      if (image_url && image_url.startsWith('data:image/')) {
        const extension = image_url.split(';')[0].split('/')[1];
        const newImageFilename = `${name.replace(/\s+/g, '_')}.${extension}`;
        const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);

        // Save the new image
        const base64Data = image_url.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(newImagePath, base64Data, { encoding: 'base64' });
        imagePath = `image/games-image/${newImageFilename}`;
      }

      const insertQuery = `
        INSERT INTO games (name, image_url, description, minimum_requirements, recommended_requirements, latest_download_links, update_links, old_download_links, vietnamese_link, notes, version, category, updated_by, update_date, release_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [name, imagePath, description, minimum_requirements, recommended_requirements, JSON.stringify(latest_download_links), JSON.stringify(update_links), JSON.stringify(old_download_links), JSON.stringify(vietnamese_link), notes, version, category.join(','), username, currentDate, release_date], (err, result) => {
        if (err) {
          console.error('Error creating game:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }

        logAddedGame(username, name, imagePath); // Log the added game with image URL

        notifyGameUpdate(); // Notify clients about the game update
        res.status(201).send({ message: 'Tạo trò chơi thành công', imageUrl: imagePath });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.put('/games/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const gameId = req.params.id;
  const { name, image_url, description, minimum_requirements, recommended_requirements, latest_download_links, update_links, old_download_links, vietnamese_link, notes, version, category, release_date } = req.body;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT username, role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Lỗi máy chủ');
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send('Không được phép');
        return;
      }

      const username = results[0].username;
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date in MySQL datetime format

      // Add "vietnamese" to category if vietnamese_link is enabled
      if (vietnamese_link.length > 0 && !category.includes('vietnamese')) {
        category.push('vietnamese');
      }

      const sanitizedFilename = sanitizeFilename(name);

      // Handle image saving and renaming
      let imagePath = image_url;
      if (image_url && image_url.startsWith('data:image/')) {
        const base64Data = image_url.replace(/^data:image\/\w+;base64,/, '');
        const extension = image_url.split(';')[0].split('/')[1];
        const newImageFilename = `${sanitizedFilename}.${extension}`;
        const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);

        fs.writeFile(newImagePath, base64Data, { encoding: 'base64' }, (err) => {
          if (err) {
            console.error('Error saving image:', err);
            res.status(500).send('Lỗi máy chủ');
            return;
          }
          imagePath = `image/games-image/${newImageFilename}`;
          updateGame();
        });
      } else if (image_url && !image_url.startsWith('data:image/')) {
        const extension = image_url.split('.').pop();
        const newImageFilename = `${sanitizedFilename}.${extension}`;
        const newImagePath = path.join(__dirname, 'image/games-image', newImageFilename);
        const oldImagePath = path.join(__dirname, image_url.replace('https://backend.dstcracks.site/', ''));

        fs.rename(oldImagePath, newImagePath, (err) => {
          if (err) {
            console.error('Error renaming image:', err);
            res.status(500).send('Lỗi máy chủ');
            return;
          }
          imagePath = `image/games-image/${newImageFilename}`;
          updateGame();
        });
      } else {
        updateGame();
      }

      function updateGame() {
        const updateQuery = `
          UPDATE games 
          SET name = ?, image_url = ?, description = ?, minimum_requirements = ?, recommended_requirements = ?, latest_download_links = ?, update_links = ?, old_download_links = ?, vietnamese_link = ?, notes = ?, version = ?, category = ?, updated_by = ?, update_date = ?, release_date = ?
          WHERE id = ?
        `;
        db.query(updateQuery, [name, imagePath, description, minimum_requirements, recommended_requirements, JSON.stringify(latest_download_links), JSON.stringify(update_links), JSON.stringify(old_download_links), JSON.stringify(vietnamese_link), notes, version, category.join(','), username, currentDate, release_date, gameId], (err) => {
          if (err) {
            console.error('Error updating game:', err);
            res.status(500).send('Lỗi máy chủ');
            return;
          }
          logUpdatedGame(username, name); // Log the updated game
          res.status(200).send('Cập nhật trò chơi thành công');
        });
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

app.post('/report', upload.single('file'), (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { reportType, description } = req.body;
  const file = req.file;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'INSERT INTO report (username, report_type, detail, image_videos, created_at) VALUES (?, ?, ?, ?, ?)';
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date in MySQL datetime format

    db.query('SELECT username FROM users WHERE id = ?', [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching username:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Không tìm thấy người dùng' });
        return;
      }

      const username = results[0].username;

      db.query(query, [username, reportType, description, file ? file.path : '', createdAt], (err, results) => {
        if (err) {
          console.error('Error submitting report:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        const mediaUrl = file ? `https://backend.dstcracks.site/${file.path}` : null;
        logNewReport(username, reportType, description, mediaUrl);
        res.status(200).send({ message: 'Gửi báo cáo thành công' });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});

async function checkDownloadLinks() {
  const query = 'SELECT id, name, latest_download_links, update_links, old_download_links, vietnamese_link FROM games';
  db.query(query, async (err, results) => {
    if (err) {
      console.error('Error fetching games:', err);
      return;
    }
    for (const game of results) {
      const allLinks = [
        ...JSON.parse(game.latest_download_links || '[]'),
        ...JSON.parse(game.update_links || '[]'),
        ...JSON.parse(game.old_download_links || '[]'),
        ...JSON.parse(game.vietnamese_link || '[]')
      ];
      for (const linkObj of allLinks) {
        const linkName = linkObj.name || 'Unknown';
        const link = linkObj.url || linkObj;
        try {
          const response = await axios.head(link);
          if (response.status !== 200) {
            logDownloadLinkError(game.name, linkName, link);
          }
        } catch (error) {
          logDownloadLinkError(game.name, linkName, link);
        }
      }
    }
  });
}

// Schedule the download link check to run every 3 hour
setInterval(checkDownloadLinks, 3 * 60 * 60 * 1000); // 3 hour in milliseconds

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post('/admin/change-avatar/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const userId = req.params.id;
  const { image } = req.body;

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error fetching user role:', err);
        res.status(500).send({ message: 'Lỗi máy chủ' });
        return;
      }
      if (results.length === 0 || (results[0].role !== 'admin' && results[0].role !== 'owner')) {
        res.status(403).send({ message: 'Không được phép' });
        return;
      }

      const targetUserQuery = 'SELECT username, avatar_url FROM users WHERE id = ?';
      db.query(targetUserQuery, [userId], (err, targetResults) => {
        if (err) {
          console.error('Error fetching target user info:', err);
          res.status(500).send({ message: 'Lỗi máy chủ' });
          return;
        }
        if (targetResults.length === 0) {
          res.status(404).send({ message: 'Không tìm thấy người dùng' });
          return;
        }

        const user = targetResults[0];
        const oldAvatarPath = path.join(__dirname, user.avatar_url); // Correct the path construction
        const isDefaultAvatar = user.avatar_url === 'image/users-avatar/default-avatar.jpg';
        const extension = image.split(';')[0].split('/')[1];
        const newAvatarFilename = `${user.username}.${extension}`;
        const newAvatarPath = path.join(__dirname, 'image/users-avatar', newAvatarFilename);

        // Save the new image
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFile(newAvatarPath, base64Data, { encoding: 'base64' }, (err) => {
          if (err) {
            console.error('Error saving new avatar:', err);
            res.status(500).send({ message: 'Lỗi máy chủ' });
            return;
          }

          // Update the user's avatar URL in the database
          const updateQuery = 'UPDATE users SET avatar_url = ? WHERE id = ?';
          db.query(updateQuery, [`image/users-avatar/${newAvatarFilename}`, userId], (err) => {
            if (err) {
              console.error('Error updating avatar URL:', err);
              res.status(500).send({ message: 'Lỗi máy chủ' });
              return;
            }

            // Delete the old avatar if it's not the default avatar
            if (!isDefaultAvatar) {
              fs.unlink(oldAvatarPath, (err) => {
                if (err) {
                  console.error('Error deleting old avatar:', err);
                }
              });
            }

            res.status(200).send({ message: 'Cập nhật ảnh đại diện thành công', avatar_url: `image/users-avatar/${newAvatarFilename}` });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Không được phép' });
  }
});