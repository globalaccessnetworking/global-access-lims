const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\Global Access\\.gemini\\antigravity\\brain\\9ae03835-8fab-4a52-bfb9-aed5167e4cd0\\.system_generated\\logs\\transcript.jsonl';

async function searchLogs() {
    if (!fs.existsSync(logPath)) {
        console.error("Log file does not exist at path: " + logPath);
        return;
    }
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineNum = 0;
    for await (const line of rl) {
        lineNum++;
        if (line.includes('Stock_Image') || line.includes('ext_lab_stock')) {
            // Find any tool calls or content in the line
            try {
                const parsed = JSON.parse(line);
                console.log(`Line ${lineNum} (${parsed.type || 'unknown'}):`);
                if (parsed.content) {
                    console.log("CONTENT SNIPPET:", parsed.content.substring(0, 300));
                }
                if (parsed.tool_calls) {
                    console.log("TOOL CALLS:", JSON.stringify(parsed.tool_calls, null, 2));
                }
                console.log("-----------------------------------------");
            } catch (e) {
                // If not valid JSON, just print substring
                console.log(`Line ${lineNum} (raw):`, line.substring(0, 300));
            }
        }
    }
}

searchLogs().catch(console.error);
