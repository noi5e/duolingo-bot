require('dotenv').config();
const puppeteer = require("puppeteer");

const accounts = JSON.parse(process.env["DUOLINGO_LOGIN"]);

const asyncForEach = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
}

const checkStreakFreeze = async function() {
  try {
    await asyncForEach(accounts, async (account) => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      console.log(account.email + ": Navigating to Duolingo...");
      await page.goto("https://www.duolingo.com");
      await page.click("[data-test='have-account']"); // already have account

      console.log(account.email + ": Entering login info...");

      // Duolingo will suggest reusing previous login if it's cached
      const useOtherAccount = await page.$("[data-test='use-another-account']");

      if (useOtherAccount) {
        await page.click("[data-test='use-another-account']");
      }

      // enter e-mail & password
      await page.waitFor("[data-test='email-input']");
      // eslint-disable-next-line no-undef
      await page.type("[data-test='email-input']", account.email);
      await page.type("[data-test='password-input']", account.password);
      await page.keyboard.press('Enter');
      
      console.log(account.email + ": Navigating to shop...");
      await page.waitFor("[data-test='shop-nav']"); // navigate to shop
      await page.click("[data-test='shop-nav']");

      // grab elementHandle for streak freeze button
      await page.waitForFunction("document.querySelector('body').innerText.includes('Streak Freeze')");

      console.log(account.email + ": Verifying if streak freeze is equipped...");
      const button = await page.$x("//li[h3/text()='Streak Freeze']/button");
      const innerText = await (await button[0].getProperty("innerText")).jsonValue();

      if (innerText != "EQUIPPED") {
        await button[0].click();
        console.log(account.email + ": No streak freeze equipped, purchased streak freeze!");
      } else {
        console.log(account.email + ": Streak freeze is already equipped");
      }

      console.log(account.email + ": Logging out...");
      await page.hover("[data-test='profile-dropdown']");
      await page.waitFor("[data-test='logout-button']");
      await page.click("[data-test='logout-button']");
      await page.waitForNavigation();
      await page.close();
      // await page.screenshot({ path: "current.png", fullPage: true });
      await browser.close();
    });
  } catch(error) {
    console.log(error);
  }
}

checkStreakFreeze();
// setInterval(checkStreakFreeze, 30 * 60 * 1000);
// setInterval(checkStreakFreeze, 12 * 60 * 60 * 1000);