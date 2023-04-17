import { WechatyBuilder } from "wechaty";
import QRCode from "qrcode";
import { ChatGPTBot } from "./bot.js";
import {config} from "./config.js";
import { Brolog }       from 'brolog'

import {PuppetPadlocal} from "wechaty-puppet-padlocal";
const log = new Brolog()
const LOGPRE = "[PadLocalDemo]"
const chatGPTBot = new ChatGPTBot();
 enum ScanStatus {
  Unknown   = 0,
  Cancel    = 1,
  Waiting   = 2,
  Scanned   = 3,
  Confirmed = 4,
  Timeout   = 5,
}
const puppet = new PuppetPadlocal({
  token: "puppet_padlocal_a90a63a39fa64db0b5d0dbbaa258cb31"
})

const bot =  WechatyBuilder.build({
  name: "PadLocalDemo", // generate xxxx.memory-card.json and save login data for the next login
  puppet
});
async function main() {
  const initializedAt = Date.now()
  bot
    // .on("scan", async (qrcode, status) => {
    //   const url = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
    //   console.log(`Scan QR Code to login: ${status}\n${url}`);
    //   console.log(
    //     await QRCode.toString(qrcode, { type: "terminal", small: true })
    //   );
    //   // require('qrcode-terminal').generate(qrcode, {small: true})
    // })
      .on("scan", (qrcode, status) => {
        if (status === ScanStatus.Waiting && qrcode) {
          const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
          ].join('')

          log.info(LOGPRE, `onScan: ${ScanStatus[status]}(${status})`);

          console.log("\n==================================================================");
          console.log("\n* Two ways to sign on with qr code");
          console.log("\n1. Scan following QR code:\n");

          require('qrcode-terminal').generate(qrcode, {small: true})  // show qrcode on console

          console.log(`\n2. Or open the link in your browser: ${qrcodeImageUrl}`);
          console.log("\n==================================================================\n");
        } else {
          log.info(LOGPRE, `onScan: ${ScanStatus[status]}(${status})`);
        }
      })
    .on("login", async (user) => {
      chatGPTBot.setBotName(user.name());
      console.log(`User ${user} logged in`);
      console.log(`私聊触发关键词: ${config.chatPrivateTriggerKeyword}`);
      console.log(`已设置 ${config.blockWords.length} 个聊天关键词屏蔽. ${config.blockWords}`);
      console.log(`已设置 ${config.chatgptBlockWords.length} 个ChatGPT回复关键词屏蔽. ${config.chatgptBlockWords}`);
    })
    .on("message", async (message) => {
      if (message.date().getTime() < initializedAt) {
        return;
      }
      if (message.text().startsWith("/ping")) {
        await message.say("pong");
        return;
      }
      try {
        await chatGPTBot.onMessage(message);
      } catch (e) {
        console.error(e);
      }
    });
  try {
    await bot.start();
  } catch (e) {
    console.error(
      `⚠️ Bot start failed, can you log in through wechat on the web?: ${e}`
    );
  }
}
main();
