const token = "EAAPfhc7CTBcBO5ZAPrZBIo9WI0utxpQsAh9aCtNUSvxLEai1WjlEcZC284RXQlsVQgaLKYrgivwKNbZCZAPrNnnTzzZBCZC6ZAGHuOWGZBWster2KLeHhwPorZCt3c042v5mhRtx61JXpfPW6sSoDgZB6SiNUFaviKRcblbnM6cNbjHZBDW0yFnrdZCvEWSBJxTnpZCkWrtgZDZD";
const PAGE_ACCESS_TOKEN = process.env.token || token;
const request = require('request');
const axios = require("axios");
const cmdLoc = __dirname + "/commands";
const temp = __dirname + "/temp";
const fs = require("fs");
const prefix = ""; // Set this to the desired prefix, or leave it as an empty string for no prefix.
const commands = [];
const descriptions = [];

module.exports = {
  PAGE_ACCESS_TOKEN,
  async loadCommands() {
    const commandsPayload = [];
    fs.readdir(cmdLoc, {}, async (err, files) => {
      for await (const name of files) {
        const readCommand = require(cmdLoc + "/" + name);
        const commandName = readCommand.name || (name.replace(".js", "")).toLowerCase();
        const description = readCommand.description || "No description provided.";
        commands.push(commandName);
        descriptions.push(description);
        commandsPayload.push({
          name: commandName,
          description
        });
        console.log(commandName, "Loaded");
      }
      console.log("Wait...");
    });
    const dataCmd = await axios.get(`https://graph.facebook.com/v21.0/me/messenger_profile`, {
      params: {
        fields: "commands",
        access_token: PAGE_ACCESS_TOKEN
      }
    });
    if (dataCmd.data.data[0].commands[0].commands.length === commandsPayload.length) {
      return console.log("Commands not changed");
    }
    const loadCmd = await axios.post(`https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`, {
      commands: [
        {
          locale: "default",
          commands: commandsPayload
        }
      ]
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (loadCmd.data.result === "success") {
      console.log("Commands loaded!");
    } else {
      console.log("Failed to load commands");
    }
    return;
  },
  commands,
  descriptions,
  cmdLoc,
  temp,
  prefix,
  admin: [
    "61565022752745"
  ],
  async sendMessage(senderId, message, pageAccessToken) {
    return await new Promise(async (resolve, reject) => {
      const sendMsg = await axios.post(`https://graph.facebook.com/v21.0/me/messages`,
      {
        recipient: { id: senderId },
        message
      }, {
        params: {
          access_token: pageAccessToken
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = sendMsg.data;
      if (data.error) {
        console.error('Error sending message:', data.error);
        reject(data.error);
      }
      resolve(data);
    });
  },
  async publishPost(message, access_token) {
    return await new Promise(async (resolve, reject) => {
      const res = await axios.post(`https://graph.facebook.com/v21.0/me/feed`,
      {
        message,
        access_token
      }, {
        params: {
          access_token
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!res) reject();
      resolve(res.data);
    });
  },
  introduction: `Hello, I am KYLESBOT, your assistant.
${prefix ? `My prefix is "${prefix}".` : "I don't use a prefix, you can just type commands directly."}

Type ${prefix ? `${prefix}help` : "help"} for available commands.

Note: KYLESBOT is highly recommended to use Messenger because some features won't work and are limited.
🤖 Created by Kyle Bait-it`,
  api_jonel: "https://ccprojectapis.ddns.net",
  echavie: "https://echavie3.nethprojects.workers.dev"
};
