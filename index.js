const util = require('util');
const url = require('url');
const { mkdirp } = require('mkdirp')
var puppeteer = require('puppeteer');
var { JsonlDB } = require('@alcalzone/jsonl-db');

require('dotenv').config()
var already_blessed_users = new JsonlDB('./already_blessed_users.jsonl'); await already_blessed_users.open();
var already_blessed_groups = new JsonlDB('./already_blessed_groups.jsonl'); await already_blessed_groups.open();
var all_groups = new JsonlDB('./all_groups.jsonl'); await all_groups.open();

function queryParams(urlString) {
  const parsedUrl = new URL(urlString);
  return parsedUrl.searchParams
}

async function checkLoggedIn(page) {
  await page.goto('https://vk.com', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForXPath(`//span[contains(text(), "Моя страница")]`);
    return true
  } catch {
    return false
  }
}

async function loginToVK(page, email, password) {
  await page.goto('https://vk.com', { waitUntil: 'domcontentloaded' });
  await page.type('#index_email', process.env.VK_USERNAME);
  await page.click('button.VkIdForm__signInButton');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await page.click('button.vkc__Bottom__switchToPassword');
  await page.type('input[name=password]', process.env.VK_PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
}

async function loginToVKIfNotLoggedIn(page) {
  // Log in to VK if not logged in
  var isLoggedIn = await checkLoggedIn(page);
  if (!isLoggedIn) {
    await loginToVK(page);
  }
}

async function scrollDown() {
  const scrollAmount = 5500; // Adjust this value as needed
  await page.evaluate((scrollAmount) => {
    window.scrollBy(0, scrollAmount);
  }, scrollAmount);
}

async function scrollDownMax() {
  let previousHeight = await page.evaluate('document.body.scrollHeight');
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(1000); // Adjust delay as needed
    const newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === previousHeight) {
      break;
    }
    previousHeight = newHeight;
  }
}

var waitMilliseconds = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function waitRandomTime(minMilliseconds, maxMilliseconds) {
  const randomTime = Math.random() * (maxMilliseconds - minMilliseconds) + minMilliseconds;
  return waitMilliseconds(randomTime)
}

var waitHumanTime = () => waitRandomTime(3000, 6000)

var pageFireOnclick = selector => page.evaluate(selector => {
  const element = document.querySelector(selector);
  if (element && element.onclick) {
    element.onclick();
  }
}, selector)

async function findFriendPage__extractUsers(page) {
  return page.evaluate(() => {
    const users = [];
    document.querySelectorAll('div.people_row').forEach(element => {
      // try {
      const userInfo = {
        id:        element.getAttribute('data-id'), // Extract 'data-id' attribute value
        href:      element.querySelector('.img a').getAttribute('href'), // Extract 'href' attribute value
        name:      element.querySelector('.info .labeled.name a').textContent.trim(), // Extract name text content
        writeHref: element.querySelector('.info .friends_user_info_actions a')?.getAttribute('href'), // Extract 'href' attribute value
      };
      users.push(userInfo);
      // } catch (e) {
        // console.log(e)
      // }
    });
    return users;
  });
}

/////////////////////////

var message = 'Мой сайт https://srghma.github.io/universe , https://srghma.github.io/';

//////////////////////

var userDataDir = './.puppeteer_userdata'
await mkdirp(userDataDir)

var browser = await puppeteer.launch({
  headless: false, // Set to true to run without a visible browser window
  executablePath: 'google-chrome-beta', // Specify the path to the Chromium executable
  userDataDir, // Store session data in this directory
  defaultViewport: null, // Set a custom viewport size
  slowMo: 20,
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
    '--disable-web-security', // https://vladislav-puzyrev.github.io/vk-spammer-online/
  ],
})

var page = await browser.newPage() // Open a new page

await loginToVKIfNotLoggedIn(page)

async function attachFile(selector) {
  await page.click(`.ms_items_more_wrap`);
  await waitMilliseconds(200)
  await page.click(`a.ms_item_doc`)
  await page.waitForXPath(`//div[contains(text(), "Прикрепление файла")]`, { visible: true });
  // await page.waitForSelector('div#box_layer_wrap .box_title', { visible: true });
  await waitMilliseconds(200)
  await page.click(selector)
}

async function sendMessage(page, userInfo) {
  await waitMilliseconds(200)
  const sendMessage__link = `a.friends_field_act[href='${userInfo.writeHref}']`
  await page.evaluate((selector) => { document.querySelector(selector).scrollIntoView() }, sendMessage__link);
  await waitMilliseconds(200)
  await page.click(sendMessage__link)
  await waitMilliseconds(200)
  await page.waitForSelector('div#mail_box_controls', { visible: true });

  await page.focus('div#mail_box_editable');
  // Simulate pressing Ctrl+A (select all)
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  // Simulate pressing Backspace to delete the selected content
  await page.keyboard.press('Backspace');

  await page.keyboard.type(message) // , {delay: 20}
  await attachFile(`#docs_file_270051801_666246307`)
  await waitMilliseconds(200)
  await page.waitForSelector('div#mail_box_controls', { visible: true });
  await waitMilliseconds(200)
  await attachFile(`#docs_file_270051801_666217374`)
  await waitMilliseconds(200)
  await page.waitForSelector('div#mail_box_controls', { visible: true });
  await waitMilliseconds(200)
  await page.click(`#mail_box_send`)

  await page.waitForXPath(`//*[contains(text(), "Сообщение отправлено")]`);

  const containsText = await page.evaluate(() => document.body.innerText.includes("Сообщение не может быть отправлено, так как вы разослали слишком много сообщений за последнее время."))
  if (containsText) { throw new Error('max 20 letters/day') }
}

var usersUrlArray = `
https://vk.com/friends?act=find&c%5Bage_from%5D=14&c%5Bage_to%5D=25&c%5Bcity%5D=1%2C1&c%5Bname%5D=1&c%5Bonline%5D=1&c%5Bper_page%5D=40&c%5Bphoto%5D=1&c%5Bschool%5D=2609&c%5Bsection%5D=people&c%5Bsort%5D=1
`.trim().split('\n')
usersUrlArray.map(queryParams)

for (var userUrl of usersUrlArray) {
  var userUrl = usersUrlArray[0]
  await page.goto(userUrl, { waitUntil: 'domcontentloaded' })
  await scrollDownMax()
  var usersInfo__all = await findFriendPage__extractUsers(page)
  var already_blessed_users__info = Array.from(already_blessed_users.keys())
  var usersInfo = usersInfo__all.filter(x => x.writeHref)
  usersInfo = usersInfo.filter(x => !already_blessed_users__info.includes(x.id))
  usersInfo = usersInfo.slice(0, 18)
  console.log(util.inspect(usersInfo, { maxArrayLength: null }))
  console.log(usersInfo.length)
  for (var userInfo of usersInfo) {
    console.log(userInfo)
    // var userInfo = usersInfo[0]
    await sendMessage(page, userInfo)
    // userInfo = usersInfo.find(x => x.name === "Madina Dina")
    already_blessed_users.set(userInfo.id, { ...userInfo, date: (new Date()).toString() })
    // already_blessed_users.delete(userInfo.id)
    await already_blessed_users.dump()
    console.log(userInfo.id, "done")
    // already_blessed_users.clear()
  }
}

var groupUrlArray = `
https://vk.com/groups?act=catalog&c%5Bper_page%5D=40&c%5Bq%5D=%D0%BC%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&c%5Bsection%5D=communities&c%5Bsort%5D=6
`.trim().split('\n')
groupUrlArray.map(queryParams)

// for (var groupUrl of groupUrlArray) {
//   var groupUrl = groupUrlArray[0]
//   // await page.goto(groupUrl, { waitUntil: 'domcontentloaded' })
//   // await scrollDownMax()

//   async function findFriendPage__extractGroups(page) {
//     return page.evaluate(() => {
//       const buffer = [];
//       document.querySelectorAll('div.search_row').forEach(element => {
//         // try {
//         const info = {
//           id:   element.getAttribute('data-id'),
//           href: element.querySelector('.img a').getAttribute('href'),
//           name: element.querySelector('.info .labeled a').textContent.trim(),
//         };
//         buffer.push(info);
//         // } catch (e) {
//           // console.log(e)
//         // }
//       });
//       return buffer;
//     });
//   }
//   var groupInfo__all = await findFriendPage__extractGroups(page)
//   all_groups.set(groupUrl, groupInfo__all); await all_groups.dump()
//   console.log(groupInfo__all.map(x => x.id).join('\n'))

//   var already_blessed_users__info = Array.from(already_blessed_users.keys())
//   var groupInfo = groupInfo__all.filter(x => x.writeHref)
//   groupInfo = groupInfo.filter(x => !already_blessed_users__info.includes(x.id))
//   // console.log(util.inspect(groupInfo, { maxArrayLength: null }))
//   console.log(groupInfo.length)
//   for (var groupInfo of groupInfo) {
//     console.log(groupInfo)
//     // var groupInfo = groupInfo[0]
//     await sendMessage(page, groupInfo)
//     // groupInfo = groupInfo.find(x => x.name === "Madina Dina")
//     already_blessed_users.set(groupInfo.id, { ...groupInfo, date: (new Date()).toString() }); await already_blessed_users.dump()
//     // already_blessed_users.delete(groupInfo.id)
//     console.log(groupInfo.id, "done")
//     // already_blessed_users.clear()
//   }
// }

await browser.close()
