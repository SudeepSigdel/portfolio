const NEPSE_API = "https://fyp-api.sudeepsigdel.com.np";
const CRISIS_CARE_API = "https://crisis-care.onrender.com";

const overlay = document.getElementById("terminalOverlay");
const body = document.getElementById("terminalBody");
const input = document.getElementById("terminalInput");
const closeBtn = document.getElementById("terminalClose");
const aboutMeBtn = document.getElementById("aboutme");

const history = [];
let historyIndex = -1;

function openTerminal() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    if (body.childElementCount === 0) {
        printLine("hi, i'm sudeep — backend engineer. this terminal talks to my real, deployed APIs, not mock data.", "system");
        printLine("type help to see what's live.", "muted");
    }
    input.focus();
}

function closeTerminal() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    aboutMeBtn.focus();
}

function trapFocus(e) {
    if (e.key !== "Tab") return;
    const focusables = Array.from(overlay.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])"));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

overlay.addEventListener("keydown", trapFocus);

function printLine(text, variant) {
    const line = document.createElement("div");
    line.className = "terminal-line" + (variant ? " " + variant : "");
    line.textContent = text;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
}

function printPrompt(command) {
    const line = document.createElement("div");
    line.className = "terminal-line";
    line.innerHTML = '<span class="prompt">sudeep@api:~$</span> <span class="cmd"></span>';
    line.querySelector(".cmd").textContent = command;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
}

function printJSON(data) {
    const pre = document.createElement("pre");
    pre.className = "terminal-line";
    pre.style.margin = "0 0 6px 0";
    pre.textContent = JSON.stringify(data, null, 2);
    body.appendChild(pre);
    body.scrollTop = body.scrollHeight;
}

const COMMANDS = {
    help() {
        printLine("available commands:", "muted");
        printLine("  whoami                 short bio");
        printLine("  projects               what I've built");
        printLine("  curl nepse [path]      hit my live NEPSE Signal Desk API (default: /api/summary)");
        printLine("  curl crisis-care [path] hit my live disaster-relief API (default: /resources)");
        printLine("  clear                  clear the screen");
        printLine("  exit                   close this terminal");
    },
    whoami() {
        printLine("Sudeep Sigdel — backend engineer based in Nepal.");
        printLine("I build APIs, ML-backed systems, and the odd security tool. FastAPI, Go, PostgreSQL, Docker.");
    },
    projects() {
        printLine("NEPSE Signal Desk  — ML stock-signal platform (FastAPI + XGBoost + React). try: curl nepse");
        printLine("crisis-care        — disaster relief backend, built in a 36hr hackathon. try: curl crisis-care");
        printLine("WebGuard           — web vulnerability scanner (FastAPI + SQLModel).");
        printLine("github: https://github.com/SudeepSigdel", "muted");
    },
    clear() {
        body.innerHTML = "";
    },
    exit() {
        closeTerminal();
    },
    async curl(args) {
        const target = (args[0] || "").toLowerCase();
        if (target === "nepse") {
            await runFetch(NEPSE_API, args[1] || "/api/summary");
        } else if (target === "crisis-care" || target === "crisiscare") {
            await runFetch(CRISIS_CARE_API, args[1] || "/resources");
        } else {
            printLine("usage: curl nepse [path] | curl crisis-care [path]", "error");
        }
    },
};

async function runFetch(base, path) {
    const url = base + path;
    printLine("connecting to " + url + " ...", "muted");
    const controller = new AbortController();
    // crisis-care runs on Render's free tier, which cold-starts after idling — give it real time to wake up.
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        const data = await res.json();
        printLine("HTTP " + res.status, res.ok ? "system" : "error");
        printJSON(data);
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
            printLine("timed out — free-tier backends cold-start after idling, try again in a few seconds.", "error");
        } else {
            printLine("request failed: " + err.message, "error");
        }
    }
}

async function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    printPrompt(trimmed);
    history.push(trimmed);
    historyIndex = history.length;

    const [name, ...args] = trimmed.split(/\s+/);
    const handler = COMMANDS[name.toLowerCase()];
    if (!handler) {
        printLine(name + ": command not found. type help for a list.", "error");
        return;
    }
    await handler(args);
}

input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        const value = input.value;
        input.value = "";
        await runCommand(value);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex] || "";
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
            historyIndex++;
            input.value = history[historyIndex] || "";
        } else {
            historyIndex = history.length;
            input.value = "";
        }
    } else if (e.key === "Escape") {
        closeTerminal();
    }
});

closeBtn.addEventListener("click", closeTerminal);
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeTerminal();
});
