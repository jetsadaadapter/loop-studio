const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const BRIDGE_FILE = path.join(process.cwd(), ".antigravity", "bridge.json");
let lastTaskId = "";

console.log("🚀 Loop DevStudio Bridge Watcher started.");
console.log(`Watching for pending requests in: ${BRIDGE_FILE}`);
console.log("Press Ctrl+C to stop.");

setInterval(() => {
    if (!fs.existsSync(BRIDGE_FILE)) return;

    try {
        const content = fs.readFileSync(BRIDGE_FILE, "utf8");
        const data = JSON.parse(content);

        if (data.status === "pending" && data.taskId !== lastTaskId) {
            lastTaskId = data.taskId;
            
            // Clean message text to avoid shell syntax errors
            const msg = `New ${data.requestType} request. Type run bridge in IDE Chat to process.`;
            const title = "Loop DevStudio";
            
            // Safe double-quoted shell escaping
            const script = `display notification "${msg}" with title "${title}" sound name "Glass"`;
            const command = `osascript -e ${JSON.stringify(script)}`;
            
            exec(command, (err) => {
                if (err) {
                    console.error("Failed to trigger macOS notification:", err);
                } else {
                    console.log(`🔔 Notified: [${data.requestType}] ${data.prompt || "(No prompt)"}`);
                }
            });
        }
    } catch (e) {
        // Ignore JSON parse errors
    }
}, 1500);
