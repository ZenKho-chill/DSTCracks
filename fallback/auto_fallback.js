const { exec } = require("child_process");
const axios = require("axios");
const { spawn } = require("child_process");

const CHECK_URLS = [
    "https://backend.dstcracks.site/games",
    "https://dstcracks.site"
];

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4/zones/a3c9e25af30b8fc3d7e978637784b789/dns_records";
const API_KEY = "uKXktRxqr1YKKzQlViq8YBmLCorz7D1hC9XgCKLv";

const DOMAINS = [
    { name: "dstcracks.site", backupIP: "198.46.245.180" },
    { name: "backend.dstcracks.site", backupIP: "198.46.245.180" }
];

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5 * 60 * 1000;
const TUNNEL_CNAME = "7d2fd121-1ef0-4d3d-9c85-093e2c9a77e6.cfargotunnel.com";

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1345575847431503995/ZnoNQGWQe241ZQrmnkP3K28pC1rj1F4uP2lTqHh3MYyURDLYTdoTgzg-15t6mSwU84WA";

async function sendDiscordMessage(content) {
    try {
        await axios.post(DISCORD_WEBHOOK, { content });
        console.log("📩 Đã gửi thông báo lên Discord.");
    } catch (error) {
        console.log("❌ Lỗi khi gửi thông báo Discord:", error.message);
    }
}

async function isTunnelActive() {
    try {
        const response = await axios.get("http://localhost:3333/metrics", { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

async function updateDNS(domain, recordType, value) {
    try {
        const response = await axios.get(CLOUDFLARE_API, {
            headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }
        });
        if (!response.data.success) {
            console.log(`❌ Lỗi lấy danh sách DNS (${domain}):`, response.data.errors);
            return;
        }
        const dnsRecord = response.data.result.find(r => r.name === domain);
        if (!dnsRecord) {
            console.log(`❌ Không tìm thấy bản ghi DNS (${domain})!`);
            return;
        }
        const updateResponse = await axios.put(`${CLOUDFLARE_API}/${dnsRecord.id}`, {
            type: recordType,
            name: domain,
            content: value,
            ttl: 1,
            proxied: (recordType === "CNAME")
        }, {
            headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }
        });
        if (updateResponse.data.success) {
            console.log(`✅ Đã cập nhật DNS: ${domain} → ${value}`);
            sendDiscordMessage(`✅ Đã cập nhật DNS: ${domain} → ${value}`);
        } else {
            console.log(`❌ Lỗi khi cập nhật DNS (${domain}):`, updateResponse.data.errors);
        }
    } catch (error) {
        console.log(`❌ Lỗi gọi API Cloudflare (${domain}):`, error.message);
    }
}

async function fallbackToARecords() {
    console.log("⚠️ Chuyển DNS về A Record...");
    for (const domain of DOMAINS) {
        await updateDNS(domain.name, "A", domain.backupIP);
    }
    setTimeout(() => restartTunnel(), RETRY_INTERVAL);
}

function restartTunnel(retries = 0) {
    console.log(`🔄 Thử restart tunnel (${retries + 1}/${MAX_RETRIES})...`);
    sendDiscordMessage(`⚠️ Tunnel gặp sự cố! Đang thử restart (${retries + 1}/${MAX_RETRIES})...`);
    exec("taskkill /IM cloudflared.exe /F", (error, stdout, stderr) => {
        console.log("✅ Đã dừng Tunnel, khởi động lại...");
        spawn("cmd", ["/c", "start", "cmd", "/k", "cloudflared tunnel --config C:\\Users\\l9xphucvps\\.cloudflared\\dstcracks.yml run dstcracks"]);
        setTimeout(async () => {
            if (await isTunnelActive()) {
                console.log("🚀 Tunnel đã hoạt động trở lại! Chuyển DNS về CNAME...");
                sendDiscordMessage("✅ Tunnel đã hoạt động! Khôi phục CNAME...");
                for (const domain of DOMAINS) {
                    await updateDNS(domain.name, "CNAME", TUNNEL_CNAME);
                }
                setTimeout(() => process.exit(0), 5000);
            } else if (retries < MAX_RETRIES - 1) {
                setTimeout(() => restartTunnel(retries + 1), RETRY_INTERVAL);
            } else {
                console.log("⚠️ Không thể khởi động lại Tunnel, kích hoạt fallback...");
                sendDiscordMessage("❌ Không thể restart Tunnel. Chuyển sang fallback (A Record). ");
                fallbackToARecords();
            }
        }, 30000);
    });
}

async function main() {
    if (await isTunnelActive()) {
        console.log("✅ Tunnel đang hoạt động, thoát script...");
        process.exit(0);
    }
    console.log("⚠️ Tunnel gặp sự cố, thử restart...");
    sendDiscordMessage("⚠️ Tunnel gặp sự cố! Bắt đầu thử restart...");
    restartTunnel();
}

main();
