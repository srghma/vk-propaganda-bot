require('dotenv').config()
const url = require('url');
const { mkdirp } = require('mkdirp')
var puppeteer = require('puppeteer');
var { JsonlDB } = require('@alcalzone/jsonl-db');
var already_blessed_users = new JsonlDB({ path: './already_blessed_users.jsonl' });

function queryParams(urlString) {
  const parsedUrl = new URL(urlString);
  return parsedUrl.searchParams
}

async function checkLoggedIn(page) {
  await page.goto('https://vk.com', { waitUntil: 'domcontentloaded' });
  var isLoggedIn = await page.evaluate(() => !!document.querySelector('#myprofile'));
  return isLoggedIn;
}

async function loginToVK(page, email, password) {
  await page.goto('https://vk.com', { waitUntil: 'domcontentloaded' });
  await page.type('#index_email', email);
  await page.type('#pass', password);
  await page.click('#login_button');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
}

async function loginToVKIfNotLoggedIn(page) {
  // Log in to VK if not logged in
  var isLoggedIn = await checkLoggedIn(page);

  if (!isLoggedIn) {
    await loginToVK(page, 'your_email@example.com', 'your_password');
  }
}

/////////////////////////

var usersUrlsArray = `
https://vk.com/friends?act=find&c%5Bage_from%5D=17&c%5Bage_to%5D=30&c%5Bcity%5D=1%2C1&c%5Bname%5D=1&c%5Bonline%5D=1&c%5Bper_page%5D=40&c%5Bphoto%5D=1&c%5Bschool%5D=2609&c%5Bsection%5D=people&c%5Bsort%5D=1
`.trim().split('\n')

usersUrlsArray.map(queryParams)

var message = 'Мой сайт https://srghma.github.io/, докажи что я не прав. Можем поговорить в Signal или Google Meets. +380957367005. Так же https://twitter.com/srghma';

//////////////////////

var userDataDir = './.puppeteer_userdata'
await mkdirp(userDataDir)

var browser = await puppeteer.launch({
  headless: false, // Set to true to run without a visible browser window
  executablePath: 'google-chrome-beta', // Specify the path to the Chromium executable
  userDataDir, // Store session data in this directory
  defaultViewport: null, // Set a custom viewport size
  args: [
    '--disable-infobars', // Disable the "Chrome is being controlled by automated software" message
    '--disable-notifications', // Disable browser notifications
    '--disable-extensions', // Disable browser extensions
    '--disable-dev-shm-usage', // Disable /dev/shm usage to prevent crashes in some environments
    '--disable-background-networking', // Disable background network requests
    '--disable-default-apps', // Disable default apps
    '--disable-sync', // Disable browser sync
    '--disable-translate', // Disable page translation
    // '--no-sandbox', // Disable sandboxing for more compatibility (only use this in secure environments)
  ],
});

var page = await browser.newPage(); // Open a new page

await loginToVKIfNotLoggedIn()

for (var userUrl of usersUrlsArray) {
  await page.goto(userUrl, { waitUntil: 'domcontentloaded' });

  // Send a message
  await sendMessage(page, message);

  // Mark user as blessed
  already_blessed_users.push('svetlana_romanova2001', userUrl);

  // Sleep for a random interval to appear more human
  var sleepTime = Math.floor(Math.random() * 5000) + 3000; // Random sleep between 3-8 seconds
  await new Promise(resolve => setTimeout(resolve, sleepTime));
}

await browser.close(); // Close the browser

async function sendMessage(page, message) {
  // Add your code here to send a message on the user's VK page
  // You can use Puppeteer functions like page.type(), page.click(), etc.
}

