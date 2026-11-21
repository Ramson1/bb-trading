const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const os = require('os');
const { spawn } = require('child_process');
const readline = require('readline');
require('dotenv').config();

/* ================= BASIC SETUP ================= */

const app = express();
const PORT = Number(process.env.PORT) || 1004;

const argv = new Set(process.argv.slice(2));
const AUTO_START = process.env.AUTO_START !== '0' && !argv.has('--no-auto');
const FORCE_DRY = process.env.DRY_RUN === '1' || argv.has('--dry-run');
const START_LIVE = (process.env.LIVE === '1' || argv.has('--live')) && !FORCE_DRY;
const KEEP_BROWSER_OPEN = process.env.KEEP_BROWSER_OPEN === '1';

const CHROME_PATH = process.env.CHROME_PATH || findChromePath();
const BOT_PROFILE = process.env.BOT_PROFILE || path.join(__dirname, 'chrome-profile');
const DEBUG_PORT = Number(process.env.DEBUG_PORT) || 9223;

const GAME_URL = process.env.GAME_URL || 'https://www.ilotbet.com/aviator/?lang=en&country_code=ng&content=7BFB3775DEAC8CE98CAF5FAD6F4B26AB5C866132796F907FEF6521CA546E9BAF098E197E67F96BC32564142B097304D8407DE76DBB8A4D29BC245825F633D8DDF25461D71B1876A561871AE856CF2815B6F3FDC69E8C1D0FEB0B7A77974DC0BFC7E521F611C7B7BE45F5A1AFC758F6A4F0F63142EA908499B3AB808E';
const WRAPPER_URL = process.env.WRAPPER_URL || 'https://www.ilotbet.com/pc/iframe?url=https%3A%2F%2Fwww.ilotbet.com%2Faviator%2F%3Flang%3Den%26country_code%3Dng%26content%3D7BFB3775DEAC8CE98CAF5FAD6F4B26AB5C866132796F907FEF6521CA546E9BAF098E197E67F96BC32564142B097304D8407DE76DBB8A4D29BC245825F633D8DDF25461D71B1876A561871AE856CF2815B6F3FDC69E8C1D0FEB0B7A77974DC0BFC7E521F611C7B7BE45F5A1AFC758F6A4F0F63142EA908499B3AB808E&title=BEST%20AVIATOR&size=small&iframeType=casino';

const LOG_DIR = path.join(__dirname, 'logs');
const DEBUG_DIR = path.join(__dirname, 'debug');
const LOG_FILE = path.join(LOG_DIR, 'bcbot.log');

/* ================= CONFIG ================= */
// Set via dashboard or environment
let BASE_BET = Number(process.env.BASE_BET) || 50;
let RECOVERY_STEP_INC = Number(process.env.RECOVERY_STEP_INC) || 300;
let NORMAL_PAYOUT = Number(process.env.PAYOUT) || 1.1;
let RECOVERY_PAYOUT = Number(process.env.RECOVERY_PAYOUT) || 1.1;
let MAX_LOSSES = Number(process.env.MAX_LOSSES) || 15;
const TARGET_PERCENT = Number(process.env.TARGET_PERCENT) || 3;
const AUTO_RESTART = process.env.AUTO_RESTART !== '0';
const MAX_SESSION_LOSS = Number(process.env.MAX_SESSION_LOSS) || 0;
const MIN_BET = 50;

const NOTIFY_ENABLED = process.env.NOTIFY_ENABLED !== '0';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyQC3B85Mhk1GFCNo4fd9HIawRlnWe8ALOTKez4zF8Q--6Rr7H_J8YEA6dPsTIoKgKq_w/exec';

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'round-history.json');
const MAX_HISTORY = 5000;

/* ================= STATE ================= */

let browser = null;
let page = null;
let frame = null;
let loginPage = null;
let loginTabOpened = false;

let starting = false;
let puppeteerRunning = false;
let stopRequested = false;
let stopReason = null;
let finished = false;
let status = 'idle';
let lastError = null;
let liveMode = START_LIVE;

let startBal = 0;
let targetProfit = 0;
let base = BASE_BET;
let progressionStart = RECOVERY_START;
let bet = BASE_BET;
let payout = NORMAL_PAYOUT;

let wins = 0;
let losses = 0;
let winStreak = 0;
let lossStreak = 0;
let recoveryRemaining = 0;
let recoveryBet = 0;
let inRecovery = false;
let currentCalcBal = 0;
let lastFlight = '';
let lastHistorySeen = null;
let dryRunRounds = 0;
let sessionNumber = 0;
let autoRestarts = 0;

let betActive = false;
let activeBet = null;
let stopDeadline = 0;
let webhookSent = false;

/* ================= UTILITIES ================= */

function ensureDirs() {
  for (const dir of [LOG_DIR, DEBUG_DIR]) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  }
}

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map(a => (a instanceof Error ? (a.stack || a.message) : String(a))).join(' ')}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (_) {}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseBalanceText(text) {
  if (text === null || text === undefined) return null;
  const raw = String(text).trim();
  if (!raw || raw.includes('--')) return null;
  const cleaned = raw.replace(/,/g, '').replace(/[^0-9.-]+/g, '');
  if (!cleaned || cleaned === '.' || cleaned === '-') return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseMultiplier(text) {
  if (!text) return null;
  const value = Number.parseFloat(String(text).replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) ? value : null;
}

function getTimestamp() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 1));
  const f = n => (n < 10 ? '0' + n : n);
  return `${f(nd.getHours())}:${f(nd.getMinutes())}:${f(nd.getSeconds())} || ${nd.getFullYear()}-${f(nd.getMonth() + 1)}-${f(nd.getDate())}`;
}

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { if (fs.existsSync(candidate)) return candidate; } catch (_) {}
  }
  return 'chrome.exe';
}

async function saveFailureScreenshot(label) {
  if (!page || page.isClosed()) return;
  try {
    const file = path.join(DEBUG_DIR, `${label}-${Date.now()}.png`);
    await page.screenshot({ path: file, fullPage: false });
    log(`Saved failure screenshot: ${file}`);
  } catch (e) {
    log('Could not save failure screenshot:', e.message);
  }
}

/* ================= BROWSER ================= */

async function isDebugPortOpen() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function launchChromeIfNeeded() {
  try { fs.mkdirSync(BOT_PROFILE, { recursive: true }); } catch (_) {}

  if (await isDebugPortOpen()) {
    log(`Reusing Chrome debug endpoint on port ${DEBUG_PORT}`);
    return;
  }

  log(`Launching Chrome: ${CHROME_PATH}`);
  log(`Bot profile: ${BOT_PROFILE}`);

  const args = [
    `--user-data-dir=${BOT_PROFILE}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=Translate,MediaRouter',
    '--window-size=1600,1000',
    GAME_URL
  ];

  const child = spawn(CHROME_PATH, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await isDebugPortOpen()) {
      log('Chrome debug port is ready.');
      return;
    }
    await sleep(500);
  }

  throw new Error(
    `Chrome did not open the debug port ${DEBUG_PORT}. ` +
    'Close any existing bot Chrome window using this profile, then try again.'
  );
}

async function connectBrowser() {
  await launchChromeIfNeeded();

  const connected = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${DEBUG_PORT}`,
    defaultViewport: null
  });

  connected.on('disconnected', () => {
    if (puppeteerRunning && !stopRequested) {
      lastError = 'Chrome disconnected';
      status = 'error';
      stopRequested = true;
      stopReason = 'BROWSER_CLOSED';
      log('Chrome disconnected unexpectedly.');
    }
  });

  return connected;
}

async function resolveGameFrame() {
  if (!page || page.isClosed()) throw new Error('Game tab is closed');

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const candidates = page.frames().filter(f => f.url().includes('ilotbet.com/aviator'));
    for (const candidate of candidates) {
      try {
        await candidate.waitForSelector('.bet-box', { timeout: 2500 });
        return candidate;
      } catch (_) {}
    }
    if (page.isClosed()) throw new Error('Game tab is closed');
    await sleep(500);
  }

  throw new Error('Game frame / .bet-box not found');
}

async function getGameFrame() {
  if (frame) {
    try {
      await frame.evaluate(() => true);
      return frame;
    } catch (_) {
      frame = null;
    }
  }
  frame = await resolveGameFrame();
  return frame;
}

async function openGame() {
  const pages = await browser.pages();
  page =
    pages.find(p => !p.isClosed() && p.url().includes('ilotbet.com')) ||
    pages.find(p => !p.isClosed() && (p.url() === 'about:blank' || p.url().startsWith('chrome://newtab'))) ||
    pages.find(p => !p.isClosed()) ||
    null;

  if (!page) {
    page = await browser.newPage();
  }

  try { await page.bringToFront(); } catch (_) {}

  page.once('close', () => {
    if (puppeteerRunning && !stopRequested) {
      lastError = 'The game tab was closed';
      stopRequested = true;
      stopReason = 'BROWSER_CLOSED';
      status = 'stopping';
      log('The game tab was closed by the user.');
    }
  });

  const existingUrl = page.url();
  if (!existingUrl.includes('/aviator') && !existingUrl.includes('/pc/iframe')) {
    log('Opening the Aviator page...');
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  try {
    frame = await resolveGameFrame();
  } catch (e) {
    log('Direct game page did not load fully; trying the iframe wrapper...');
    await page.goto(WRAPPER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    frame = await resolveGameFrame();
  }

  let siteVersion = null;
  try {
    siteVersion = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="ilot-version"]');
      return meta ? meta.content : null;
    });
  } catch (_) {}

  log(`Game ready${siteVersion ? ` (site version ${siteVersion})` : ''}.`);
  log(`Frame: ${frame.url().slice(0, 140)}`);
}

/* ================= GAME STATE ================= */

async function readGameState() {
  const gameFrame = await getGameFrame();

  const state = await gameFrame.evaluate(() => {
    const q = (selector, root) => (root || document).querySelector(selector);
    const box = q('.bet-box');
    const odds = q('.odds-box-value');
    const awaiting = q('.awaiting');
    const history = q('.history-odds-item');

    const visible = el => !!el && el.getClientRects().length > 0;
    let phase = 'unknown';
    if (visible(awaiting)) phase = 'betting';
    else if (visible(odds)) phase = odds.classList.contains('warn') ? 'crashed' : 'flying';

    const title = box ? q('.bet-button-title', box) : null;
    const money = box ? q('.bet-button-money', box) : null;
    const balance = q('span.balance-amount');

    return {
      phase,
      multiplier: odds ? odds.textContent.trim() : null,
      lastResult: history ? history.textContent.trim() : null,
      betTitle: title ? title.textContent.trim() : '',
      betMoney: money ? money.textContent.trim() : '',
      balanceText: balance ? balance.textContent.trim() : '',
      awaitingText: awaiting ? awaiting.textContent.trim().slice(0, 80) : ''
    };
  });

  state.multiplierValue = parseMultiplier(state.multiplier);
  state.lastResultValue = parseMultiplier(state.lastResult);
  state.balance = parseBalanceText(state.balanceText);

  frame = gameFrame;
  return state;
}

/* ================= WAIT FOR LOGIN ================= */

async function waitForLogin() {
  let lastNotice = 0;
  let lastErrorLog = 0;
  status = 'waiting_for_login';

  while (!stopRequested) {
    try {
      const state = await readGameState();
      const balance = state.balance;

      if (balance !== null) {
        if (balance > 0) {
          log(`Logged in. Balance: ₦${balance.toFixed(2)}`);
          if (loginPage && !loginPage.isClosed()) {
            try { await loginPage.close(); } catch (_) {}
          }
          loginPage = null;
          try { await page.bringToFront(); } catch (_) {}
          return balance;
        }
        throw new Error('Balance is ₦0.00. Fund the account, then restart the bot.');
      }

      status = 'waiting_for_login';

      if (!loginTabOpened) {
        loginTabOpened = true;
        try {
          loginPage = await browser.newPage();
          await loginPage.goto('https://www.ilotbet.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
          await loginPage.bringToFront();
          log('Opened a login tab. Log in there once, then click the Aviator tab and refresh it.');
        } catch (e) {
          log('Could not open the login tab:', e.message);
        }
      }

      if (Date.now() - lastNotice > 10000) {
        log(
          'Waiting for login (balance shows --). Log in on the iLOTBET tab, ' +
          'then refresh the Aviator tab. The bot will continue automatically.'
        );
        lastNotice = Date.now();
      }
    } catch (e) {
      if (page && page.isClosed()) throw new Error('Chrome game tab was closed.');
      if (Date.now() - lastErrorLog > 5000) {
        log('Waiting for the game page:', e.message);
        lastErrorLog = Date.now();
      }
    }
    await sleep(3000);
  }

  throw new Error('Stopped while waiting for login');
}

/* ================= STRATEGY (bc.js exact replica) ================= */

function nextRecoveryBet() {
  let b = recoveryBet;
  if (b < progressionStart) b = progressionStart;
  if (b < MIN_BET) b = MIN_BET;
  return b;
}

function initializeSession(balance) {
  startBal = balance > 0 ? balance : 0;
  currentCalcBal = startBal;

  const targetPercentConfig = TARGET_PERCENT;
  targetProfit = Number((startBal * (targetPercentConfig / 100)).toFixed(8));

  base = Math.max(MIN_BET, BASE_BET);
  progressionStart = Math.max(MIN_BET, BASE_BET * 6);
  RECOVERY_STEP_INC = progressionStart;
  bet = base;
  payout = NORMAL_PAYOUT;

  wins = 0;
  losses = 0;
  winStreak = 0;
  lossStreak = 0;
  recoveryRemaining = 0;
  recoveryBet = 0;
  inRecovery = false;
  betActive = false;
  activeBet = null;
  lastFlight = '';
  lastHistorySeen = null;
  dryRunRounds = 0;
  sessionNumber++;

  log('🚀 Bot Started');
  log('Start Balance: ' + startBal.toFixed(8));
  log('Target: ' + targetProfit.toFixed(8) + ' (' + targetPercentConfig + '%)');
  log('Base Bet: ' + base.toFixed(8));
  log('Recovery Start: ' + progressionStart.toFixed(8));
  log('Recovery Step: +' + RECOVERY_STEP_INC.toFixed(8));

  if (base > balance) {
    throw new Error(`Base bet ₦${base} is greater than balance ₦${balance.toFixed(2)}`);
  }
}

/* ================= BETTING ACTIONS ================= */

async function ensureAutoSettings(gameFrame, targetPayout) {
  try {
    await gameFrame.evaluate(() => {
      const box = document.querySelector('.bet-box');
      if (!box) return;
      const autoTab = [...box.querySelectorAll('.tab-item')].find(el => /auto/i.test(el.textContent));
      if (autoTab && !autoTab.classList.contains('active')) autoTab.click();
    });
    await sleep(300);

    for (let attempt = 0; attempt < 4; attempt++) {
      await gameFrame.evaluate(() => {
        const box = document.querySelector('.bet-box');
        if (!box) return;
        const switches = [...box.querySelectorAll('.common-switch')];
        if (switches.length < 2) return;

        const autoBet = switches[0];
        const autoCashOut = switches[1];

        // Auto Bet must remain off: the bot controls each round.
        if (autoBet.classList.contains('on')) autoBet.click();

        // Auto Cash Out must be on.
        if (!autoCashOut.classList.contains('on')) autoCashOut.click();
      });
      await sleep(250);

      const snapshot = await gameFrame.evaluate(() => {
        const box = document.querySelector('.bet-box');
        if (!box) return { hasBox: false };
        const switches = [...box.querySelectorAll('.common-switch')];
        const cashInput = box.querySelector('input.cash-out-odds-input');
        return {
          hasBox: true,
          autoBetOn: switches[0] ? switches[0].classList.contains('on') : null,
          autoCashOutOn: switches[1] ? switches[1].classList.contains('on') : null,
          hasCashInput: !!cashInput,
          cashValue: cashInput ? cashInput.value : null
        };
      });

      if (!snapshot.hasBox) return false;
      if (snapshot.autoBetOn !== false || snapshot.autoCashOutOn !== true) continue;

      if (!snapshot.hasCashInput) {
        log('Auto Cash Out input is not available; retrying.');
        continue;
      }

      await gameFrame.evaluate(value => {
        const box = document.querySelector('.bet-box');
        const input = box && box.querySelector('input.cash-out-odds-input');
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, String(value));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, targetPayout);
      await sleep(150);

      const cashValue = await gameFrame.evaluate(() => {
        const input = document.querySelector('.bet-box input.cash-out-odds-input');
        return input ? input.value : null;
      });

      if (Number(cashValue) === Number(targetPayout)) {
        return true;
      }
    }
  } catch (e) {
    log('Auto settings error:', e.message);
  }

  return false;
}

async function setBetAmount(gameFrame, amount) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await gameFrame.evaluate(value => {
        const box = document.querySelector('.bet-box');
        const input = box && box.querySelector('input.bet-amount-input');
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, String(value));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, amount);
      await sleep(150);

      const snapshot = await gameFrame.evaluate(() => {
        const box = document.querySelector('.bet-box');
        const input = box && box.querySelector('input.bet-amount-input');
        const money = box && box.querySelector('.bet-button-money');
        return {
          value: input ? input.value : null,
          money: money ? money.textContent.trim() : null
        };
      });

      const money = Number(String(snapshot.money || '').replace(/[^0-9.-]+/g, ''));
      if (Number(snapshot.value) === Number(amount) && money === Number(amount)) {
        return true;
      }
    } catch (e) {
      log('Set bet amount error:', e.message);
    }
    await sleep(200);
  }
  return false;
}

function isPlacedBetTitle(title) {
  const value = String(title || '').toUpperCase();
  return value.includes('CANCEL') || value.includes('CASH');
}

async function clickBetButton(gameFrame) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const before = await gameFrame.evaluate(() => {
        const box = document.querySelector('.bet-box');
        const title = box && box.querySelector('.bet-button-title');
        return title ? title.textContent.trim().toUpperCase() : null;
      });

      if (before !== 'BET') {
        if (isPlacedBetTitle(before)) {
          log(`Bet button already shows "${before}"; treating the bet as placed.`);
          return true;
        }
        log(`Bet button is "${before || 'unknown'}"; not clicking.`);
        return false;
      }

      const clicked = await gameFrame.evaluate(() => {
        const awaiting = document.querySelector('.awaiting');
        const inBettingWindow = !!awaiting && awaiting.getClientRects().length > 0;
        if (!inBettingWindow) return false;
        const button = document.querySelector('.bet-box .bet-button');
        if (!button) return false;
        button.click();
        return true;
      });

      if (!clicked) {
        log('Betting window closed before the click; not placing a late bet.');
        return false;
      }

      await sleep(900);

      const after = await gameFrame.evaluate(() => {
        const box = document.querySelector('.bet-box');
        const title = box && box.querySelector('.bet-button-title');
        return title ? title.textContent.trim().toUpperCase() : null;
      });

      log(`Bet button after click: ${after || 'unknown'}`);
      if (isPlacedBetTitle(after)) return true;
      if (after && after !== 'BET') {
        log(`Unexpected bet button state after click: ${after}`);
      }
    } catch (e) {
      log('Click bet error:', e.message);
    }
    await sleep(400);
  }
  return false;
}

async function placeBet(gameFrame, amount) {
  const autoReady = await ensureAutoSettings(gameFrame, payout);
  if (!autoReady) {
    log('Auto Cash Out could not be verified; skipping this round.');
    return false;
  }

  const amountReady = await setBetAmount(gameFrame, amount);
  if (!amountReady) {
    log(`Could not set bet amount to ₦${amount}; skipping this round.`);
    return false;
  }

  return clickBetButton(gameFrame);
}

function settleActiveBet(state) {
  if (!activeBet) {
    betActive = false;
    return;
  }

  const flightValue = state.lastResultValue;
  if (flightValue === null) {
    log('Could not read the last flight value; keeping the bet marked active.');
    return;
  }

  const amount = activeBet.amount;
  const activePayout = activeBet.payout;
  const won = flightValue >= activePayout;

  if (won) {
    const profit = (amount * activePayout) - amount;
    currentCalcBal += profit;
    wins++;
    winStreak++;
    lossStreak = 0;

    if (inRecovery) {
      recoveryRemaining = Math.max(0, recoveryRemaining - profit);
      if (recoveryRemaining <= 0) {
        recoveryRemaining = 0;
        recoveryBet = 0;
        inRecovery = false;
        payout = NORMAL_PAYOUT;
        bet = base;
        log("🟢 Recovery done. Resetting to base bet: " + base.toFixed(8));
      } else {
        payout = RECOVERY_PAYOUT;
        bet = recoveryBet;
        log("🟢 Recovery win. Remaining recovery: " + recoveryRemaining.toFixed(8) + " | Keeping recovery bet: " + bet.toFixed(8));
      }
    } else {
      payout = NORMAL_PAYOUT;
      bet = base;
    }
    log(`WIN: flight ${flightValue}x >= ${activePayout}x | bet ₦${amount} | profit ₦${profit.toFixed(2)}`);
  } else {
    currentCalcBal -= amount;
    losses++;
    lossStreak++;
    winStreak = 0;
    recoveryRemaining += amount;

    if (!inRecovery) {
      inRecovery = true;
      recoveryBet = progressionStart;
      payout = RECOVERY_PAYOUT;
      bet = nextRecoveryBet();
      log("🟠 Loss. Recovery started at: " + bet.toFixed(8) + " | Recovery required: " + recoveryRemaining.toFixed(8));
    } else {
      recoveryBet += RECOVERY_STEP_INC;
      payout = RECOVERY_PAYOUT;
      bet = nextRecoveryBet();
      log("🔴 Recovery loss. Increasing bet to: " + bet.toFixed(8) + " | Recovery required: " + recoveryRemaining.toFixed(8));
    }

    if (lossStreak >= MAX_LOSSES) {
      log("🛑 Max losses. Stopping...");
      gracefulStop('MAX_LOSSES', `Loss streak ${lossStreak}`);
    }
    log(`LOSS: flight ${flightValue}x < ${activePayout}x | bet ₦${amount}`);
  }

  // The site balance is the source of truth; fall back to bc.js-style arithmetic.
  if (state.balance !== null) {
    currentCalcBal = state.balance;
  }

  lastFlight = `${flightValue.toFixed(2)}x`;
  log("💰 Balance: " + currentCalcBal.toFixed(8) + " | Profit: " + (currentCalcBal - startBal).toFixed(8) + " / " + targetProfit.toFixed(8));

  // Persist this round for analytics
  recordRound({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    session: sessionNumber,
    timestamp: getTimestamp(),
    isoTime: new Date().toISOString(),
    result: won ? 'win' : 'loss',
    amount,
    payout: activePayout,
    multiplier: flightValue,
    profit: won ? (amount * (activePayout - 1)) : -amount,
    balanceAfter: currentCalcBal,
    mode: inRecovery ? 'recovery' : 'normal',
    betBefore: amount
  });

  betActive = false;
  activeBet = null;
}

/* ================= GAME LOOP ================= */

function checkStopConditions() {
  if (currentCalcBal - startBal >= targetProfit) {
    return { reason: 'TARGET_REACHED', detail: `Profit ₦${(currentCalcBal - startBal).toFixed(2)} >= target ₦${targetProfit.toFixed(2)}` };
  }
  if (lossStreak >= MAX_LOSSES) {
    return { reason: 'MAX_LOSSES', detail: `Loss streak ${lossStreak}` };
  }
  if (MAX_SESSION_LOSS > 0 && currentCalcBal - startBal <= -MAX_SESSION_LOSS) {
    return { reason: 'SESSION_LOSS_LIMIT', detail: `Loss ₦${(startBal - currentCalcBal).toFixed(2)}` };
  }
  return null;
}

// bc.js session end: notify, then start a fresh session with the current balance.
// Returns true when the loop should continue with the new session.
async function endSessionAndRestart(stop) {
  logSessionStats(stop.reason);
  await sendWebhookNotification(stop.reason);

  if (!AUTO_RESTART || stopRequested) {
    gracefulStop(stop.reason, stop.detail);
    return false;
  }

  autoRestarts++;
  log(`🔁 Auto-restarting with balance ₦${currentCalcBal.toFixed(2)} (restart #${autoRestarts}).`);
  initializeSession(currentCalcBal);
  webhookSent = false;
  return true;
}

function logSessionStats(reason) {
  const finalProfit = currentCalcBal - startBal;
  log('==== SESSION STATS ====');
  log(`Start: ₦${startBal.toFixed(2)} | End: ₦${currentCalcBal.toFixed(2)} | Profit: ₦${finalProfit.toFixed(2)}`);
  log(`Wins: ${wins} | Losses: ${losses} | Win rate: ${wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) : '0.00'}%`);
  if (reason) log(`Reason: ${reason}`);
}

async function gameLoop() {
  let bettingPhase = false;
  let betAttempts = 0;
  let phaseStartedAt = 0;
  let errors = 0;
  let lastErrorLog = 0;

  while (!stopRequested || betActive) {
    if (stopRequested && betActive && Date.now() > stopDeadline) {
      log('Stop timeout reached while a bet was active; closing.');
      break;
    }

    try {
      const state = await readGameState();
      const phase = state.phase;
      errors = 0;

      if (state.balance !== null) currentCalcBal = state.balance;
      if (state.multiplierValue !== null) lastFlight = `${state.multiplierValue.toFixed(2)}x`;
      else if (state.lastResult) lastFlight = state.lastResult;

      // Settle as soon as a new result appears in the history panel.
      if (state.lastResultValue !== null) {
        if (lastHistorySeen === null) {
          lastHistorySeen = state.lastResultValue;
        } else if (state.lastResultValue !== lastHistorySeen) {
          lastHistorySeen = state.lastResultValue;
          if (betActive) {
            settleActiveBet(state);
            const stop = checkStopConditions();
            if (stop) {
              const restarted = await endSessionAndRestart(stop);
              if (!restarted) break;
              bettingPhase = false;
              lastHistorySeen = null;
              continue;
            }
          }
        }
      }

      if (phase === 'betting') {
        if (!bettingPhase) {
          bettingPhase = true;
          betAttempts = 0;
          phaseStartedAt = Date.now();

          if (betActive) {
            // Fallback settlement for rounds whose result matches the previous one,
            // where the history text alone does not change.
            await sleep(900);
            const settleState = await readGameState();
            settleActiveBet(settleState);
            const stop = checkStopConditions();
            if (stop) {
              const restarted = await endSessionAndRestart(stop);
              if (!restarted) break;
              bettingPhase = false;
              lastHistorySeen = null;
              continue;
            }
          }

          if (!liveMode) {
            dryRunRounds++;
            log(`DRY RUN ${dryRunRounds}: would bet ₦${bet} @ ${payout}x | last result ${state.lastResult || 'n/a'}`);
            if (dryRunRounds >= 2 && status !== 'dry_run_ready') {
              status = 'dry_run_ready';
              log('Dry run complete. Click "Go Live" on the dashboard or type LIVE in this terminal.');
            }
          }
        }

        if (
          liveMode &&
          !betActive &&
          !stopRequested &&
          lastHistorySeen !== null &&
          Date.now() - phaseStartedAt < 5000
        ) {
          const stop = checkStopConditions();
          if (stop) {
            const restarted = await endSessionAndRestart(stop);
            if (!restarted) break;
            bettingPhase = false;
            lastHistorySeen = null;
            continue;
          }

          const amount = bet;

          if (amount > currentCalcBal) {
            log(`🛑 Insufficient balance. Stopping... (bet ₦${amount} > balance ₦${currentCalcBal.toFixed(2)})`);
            gracefulStop('INSUFFICIENT_BALANCE', `Bet ₦${amount} exceeds balance ₦${currentCalcBal.toFixed(2)}`);
            break;
          }

          if (betAttempts < 4) {
            betAttempts++;
            const placed = await placeBet(frame, amount);
            if (placed) {
              activeBet = { amount, payout };
              betActive = true;
              status = 'live';
              log(`BET PLACED: ₦${amount} @ ${payout}x${inRecovery ? ' (recovery)' : ''}`);
            } else {
              log(`Bet attempt ${betAttempts} was not confirmed.`);
              await sleep(500);
            }
          }
        }
      } else {
        bettingPhase = false;
      }

      // Safety fallback: if auto cashout did not fire, click CASH OUT at the target.
      if (
        phase === 'flying' &&
        liveMode &&
        betActive &&
        activeBet &&
        state.multiplierValue !== null &&
        state.multiplierValue >= activeBet.payout &&
        /CASH\s*OUT/.test(String(state.betTitle).toUpperCase())
      ) {
        await frame.evaluate(() => {
          const button = document.querySelector('.bet-box .bet-button');
          if (button) button.click();
        });
        log(`Fallback cashout clicked at ${state.multiplierValue}x.`);
      }

      await sleep(400);
    } catch (e) {
      errors++;
      if (puppeteerRunning && page && page.isClosed()) {
        gracefulStop('BROWSER_CLOSED', 'Game tab closed');
        break;
      }
      if (Date.now() - lastErrorLog > 4000) {
        log('Game loop error:', e.message);
        lastErrorLog = Date.now();
        if (errors === 3) await saveFailureScreenshot('game-loop');
      }
      if (errors >= 20) {
        gracefulStop('FRAME_LOST', 'Too many game-loop errors');
        break;
      }
      await sleep(1500);
    }
  }

  await finishStop();
}

/* ================= STOP / FINISH ================= */

function gracefulStop(reason, detail) {
  if (stopRequested) return;
  stopRequested = true;
  stopReason = reason;
  stopDeadline = Date.now() + 180000;
  if (status !== 'error') status = 'stopping';
  log(`Stop requested: ${reason}${detail ? ` (${detail})` : ''}${betActive ? ' - waiting for active bet to settle' : ''}`);
}

async function finishStop() {
  if (finished) return;
  finished = true;

  puppeteerRunning = false;
  starting = false;
  if (status !== 'error') {
    status = stopReason === 'TARGET_REACHED' ? 'stopped_target' : 'stopped';
  }

  logSessionStats(stopReason);
  log(`Sessions run: ${sessionNumber} | Auto-restarts: ${autoRestarts}`);

  await sendWebhookNotification(stopReason || 'STOPPED');

  if (browser) {
    if (KEEP_BROWSER_OPEN) {
      try { await browser.disconnect(); } catch (_) {}
      log('Chrome left open (KEEP_BROWSER_OPEN=1).');
    } else {
      try { await browser.close(); } catch (_) {}
      log('Chrome closed.');
    }
  }

  browser = null;
  page = null;
  frame = null;
  loginPage = null;
  loginTabOpened = false;
}

/* ================= WEBHOOK ================= */

async function sendWebhookNotification(reason = 'STOPPED') {
  if (!NOTIFY_ENABLED || !WEBHOOK_URL || webhookSent) return;
  webhookSent = true;

  try {
    const total = wins + losses;
    const payload = {
      startBalance: startBal,
      endBalance: currentCalcBal,
      profit: currentCalcBal - startBal,
      target: targetProfit,
      wins,
      losses,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(2) : null,
      timestamp: getTimestamp(),
      status: reason
    };

    log('Sending webhook notification...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    log(`Webhook response: ${response.status}`);
  } catch (e) {
    log('Webhook error:', e.message);
  }
}

/* ================= START / LIVE ================= */

function goLive(source = 'unknown') {
  if (!puppeteerRunning && !starting) {
    log('Go Live ignored: the bot is not running.');
    return false;
  }
  if (liveMode) return true;

  liveMode = true;
  if (status === 'dry_run' || status === 'dry_run_ready') status = 'live';
  log(`LIVE mode enabled from ${source}. Base bet ₦${base} @ ${payout}x.`);
  return true;
}

async function startBot() {
  if (puppeteerRunning || starting) {
    log('Start ignored: already running or starting.');
    return;
  }

  starting = true;
  stopRequested = false;
  stopReason = null;
  finished = false;
  webhookSent = false;
  lastError = null;
  status = 'starting';
  loginPage = null;
  loginTabOpened = false;
  sessionNumber = 0;
  autoRestarts = 0;

  try {
    log('Starting bot...');
    browser = await connectBrowser();
    await openGame();

    const balance = await waitForLogin();
    initializeSession(balance);

    puppeteerRunning = true;
    starting = false;
    status = liveMode ? 'live' : 'dry_run';
    log(liveMode ? 'Bot is LIVE.' : 'Bot is in DRY RUN. It will not place bets until you approve.');

    await gameLoop();
  } catch (e) {
    if (stopRequested) {
      await finishStop();
      return;
    }

    lastError = e.message;
    status = 'error';
    starting = false;
    puppeteerRunning = false;
    log('Start error:', e.message);
    await saveFailureScreenshot('start-failure');
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    browser = null;
    page = null;
    frame = null;
  }
}

/* ================= EXPRESS ================= */

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'bcbot-local-secret',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function snapshot() {
  const nextBet = bet;
  return {
    running: puppeteerRunning || starting,
    starting,
    status,
    live: liveMode,
    balance: safeNum(currentCalcBal),
    startBalance: safeNum(startBal),
    bet: safeNum(nextBet),
    currentInput: safeNum(nextBet),
    profit: safeNum(currentCalcBal - startBal),
    target: safeNum(targetProfit),
    wins,
    losses,
    winStreak,
    lossStreak,
    recoveryRemaining: safeNum(recoveryRemaining),
    payout: safeNum(payout),
    lastFlight,
    dryRunRounds,
    inRecovery,
    recoveryBet: safeNum(recoveryBet),
    sessionNumber,
    autoRestarts,
    autoRestart: AUTO_RESTART,
    targetPercent: TARGET_PERCENT,
    maxLosses: MAX_LOSSES,
    baseBet: BASE_BET,
    payout: NORMAL_PAYOUT,
    error: lastError || '',
    stopReason: stopReason || ''
  };
}

/* ================= ROUND HISTORY PERSISTENCE ================= */

function loadRoundHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    log('Could not load round history:', e.message);
    return [];
  }
}

function saveRoundHistory(history) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history), 'utf8');
  } catch (e) {
    log('Could not save round history:', e.message);
  }
}

function recordRound(result) {
  const history = loadRoundHistory();
  history.push(result);
  if (history.length > MAX_HISTORY) history.shift();
  saveRoundHistory(history);
}

function historyStats() {
  const history = loadRoundHistory();
  const total = history.length;
  if (total === 0) return { total: 0, wins: 0, losses: 0, winRate: 0, avgMultiplier: 0, maxMultiplier: 0, profit: 0, streaks: [] };

  let wins = 0, losses = 0, sumMult = 0, maxMult = 0, profit = 0;
  const streaks = [];
  let currentStreak = 1;
  for (let i = 0; i < total; i++) {
    const r = history[i];
    if (r.result === 'win') { wins++; profit += r.profit || 0; }
    else { losses++; profit -= r.amount || 0; }
    if (r.multiplier) { sumMult += r.multiplier; if (r.multiplier > maxMult) maxMult = r.multiplier; }
    if (i > 0) {
      if (history[i - 1].result === r.result) currentStreak++;
      else { streaks.push({ result: history[i - 1].result, length: currentStreak }); currentStreak = 1; }
    }
  }
  streaks.push({ result: history[total - 1].result, length: currentStreak });
  return {
    total, wins, losses,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    avgMultiplier: total > 0 ? sumMult / total : 0,
    maxMultiplier: maxMult,
    profit,
    streaks: streaks.slice(-20)
  };
}

app.get('/', (req, res) => {
  res.render('dashboard-botgo', {
    ...snapshot(),
    progressPercent: targetProfit > 0
      ? Math.max(0, Math.min(100, ((currentCalcBal - startBal) / targetProfit) * 100))
      : 0
  });
});

app.get('/data', (req, res) => {
  res.json(snapshot());
});

app.get('/profit-status', (req, res) => {
  res.json({
    profitReached: stopReason === 'TARGET_REACHED',
    profit: safeNum(currentCalcBal - startBal),
    target: safeNum(targetProfit),
    running: puppeteerRunning || starting,
    status,
    live: liveMode
  });
});

app.post('/start', (req, res) => {
  if (puppeteerRunning || starting) {
    return res.json({ ok: true, already: true, status });
  }
  startBot().catch(e => log('startBot error:', e.message));
  res.json({ ok: true, status: 'starting' });
});

app.post('/settings', (req, res) => {
  const { baseBet, payout, maxLosses } = req.body || {};
  if (baseBet !== undefined) BASE_BET = Math.max(MIN_BET, Number(baseBet));
  if (payout !== undefined) NORMAL_PAYOUT = Number(payout);
  if (maxLosses !== undefined) MAX_LOSSES = Number(maxLosses);
  res.json({ ok: true, baseBet: BASE_BET, payout: NORMAL_PAYOUT, maxLosses: MAX_LOSSES });
});
  const ok = goLive('dashboard');
  res.status(ok ? 200 : 400).json({ ok, live: liveMode, status });
});

app.post('/stop', (req, res) => {
  if (!puppeteerRunning && !starting) {
    return res.json({ ok: true, already: true, status });
  }
  gracefulStop('MANUAL_STOP', 'Dashboard stop button');
  res.json({ ok: true, status, betActive });
});

app.get('/history', (req, res) => {
  const limit = Number(req.query.limit) || 200;
  const history = loadRoundHistory();
  res.json({ history: history.slice(-limit), stats: historyStats() });
});

app.post('/history/clear', (req, res) => {
  saveRoundHistory([]);
  res.json({ ok: true });
});

/* ================= CLI / BOOT ================= */

async function main() {
  ensureDirs();

  log('BCBot starting.');
  log(`Chrome: ${CHROME_PATH}`);
  log(`Profile: ${BOT_PROFILE}`);
  log(`Debug port: ${DEBUG_PORT}`);
  log(`Mode: ${liveMode ? 'LIVE' : 'DRY RUN'} | Auto-start: ${AUTO_START ? 'yes' : 'no'}`);

  if (process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('line', line => {
      const value = line.trim().toLowerCase();
      if (value === 'live') {
        goLive('terminal');
      } else if (value === 'stop') {
        gracefulStop('MANUAL_STOP', 'terminal');
      } else if (value === 'status') {
        log(JSON.stringify(snapshot(), null, 2));
      }
    });
  }

  const server = app.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`);
    log(`Dashboard: http://localhost:${PORT}/`);
    if (AUTO_START) {
      log('Auto-starting the bot...');
      startBot().catch(e => log('Auto-start error:', e.message));
    } else {
      log('Auto-start disabled. Open the dashboard and click Start Bot.');
    }
  });

  server.on('error', e => {
    if (e.code === 'EADDRINUSE') {
      log(`Port ${PORT} is already in use. Another bot instance may be running.`);
      process.exit(1);
    }
    log('Server error:', e.message);
  });
}

process.on('unhandledRejection', e => log('Unhandled rejection:', e && e.stack ? e.stack : e));
process.on('uncaughtException', e => log('Uncaught exception:', e && e.stack ? e.stack : e));

main().catch(e => {
  log('Fatal error:', e.message);
  process.exit(1);
});
