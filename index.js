var puppeteer = require('puppeteer');
var { JsonlDB } = require('@alcalzone/jsonl-db');
var already_processed_users = new JsonlDB({ path: './already_processed_users.jsonl' });

var usersUrlsArray = `
https://vk.com/friends?act=find&c%5Bcity%5D=1%2C1&c%5Bname%5D=1&c%5Bonline%5D=1&c%5Bper_page%5D=40&c%5Bphoto%5D=1&c%5Bschool%5D=2758&c%5Bsection%5D=people
https://vk.com/friends?act=find&c%5Bcity%5D=1%2C1&c%5Bname%5D=1&c%5Bonline%5D=1&c%5Bper_page%5D=40&c%5Bphoto%5D=1&c%5Bschool%5D=55806&c%5Bsection%5D=people
`.trim().split('\n')

var message = 'Мой сайт https://srghma.github.io/, докажи что я не прав. Можем поговорить в Signal или Google Meets. +380957367005. Так же https://twitter.com/srghma';

//////////////////////

var browser = await puppeteer.launch({ headless: false }); // Launch the browser
var page = await browser.newPage(); // Open a new page

// Log in to VK if not logged in
var isLoggedIn = await checkLoggedIn(page);
if (!isLoggedIn) {
  await loginToVK(page, 'your_email@example.com', 'your_password');
}

for (var userUrl of usersUrlsArray) {
  await page.goto(userUrl, { waitUntil: 'domcontentloaded' });

  // Send a message
  await sendMessage(page, message);

  // Mark user as processed
  already_processed_users.push('svetlana_romanova2001', userUrl);

  // Sleep for a random interval to appear more human
  var sleepTime = Math.floor(Math.random() * 5000) + 3000; // Random sleep between 3-8 seconds
  await new Promise(resolve => setTimeout(resolve, sleepTime));
}

await browser.close(); // Close the browser

async function checkLoggedIn(page) {
  await page.goto('https://vk.com', { waitUntil: 'domcontentloaded' });
  var isLoggedIn = await page.evaluate(() => !!document.querySelector('#myprofile'));
  return isLoggedIn;
}

async function loginToVK(page, email, password) {
  await page.goto('https://vk.com', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#pass', password);
  await page.click('#login_button');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
}

async function sendMessage(page, message) {
  // Add your code here to send a message on the user's VK page
  // You can use Puppeteer functions like page.type(), page.click(), etc.
}

main().catch(err => console.error('Error:', err));

