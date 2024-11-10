const api = require('./api');

const getStarted = async (send) => {
    return send({
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: api.introduction,
                buttons: [
                    { type: "postback", title: "Commands", payload: "HELP" },
                    { type: "postback", title: "Prefix", payload: "PREFIX" }
                ]
            }
        }
    });
};

const listenMessage = async (event, pageAccessToken) => {
    const senderID = event.sender.id;
    const message = event.message.text;

    if (!senderID || !message) return;

    const send = async text => api.sendMessage(senderID, typeof text === "object" ? text : { text }, pageAccessToken);

    const [command, ...args] = message.trim().toLowerCase().split(/\s+/);
    const admin = api.admin.includes(senderID);
    const hasPrefix = api.prefix && message.startsWith(api.prefix);

    // Handle the prefix command directly
    if (message.toLowerCase().trim() === "prefix") {
        return api.prefix 
            ? send(`My prefix is: "${api.prefix}"`)
            : send(`I don't have a prefix. You can type commands directly.`);
    }

    // Handle greetings and get started trigger without prefix
    if (["hi", ".", "kyles", "yo", "get started", "hello", "bot"].includes(message.toLowerCase().trim())) {
        return getStarted(send);
    }

    // Handle the case where no prefix is set, but the user added one
    if (!api.prefix && hasPrefix) {
        return send(`❌ This command doesn't need a prefix. Just type the command without the prefix.`);
    }

    // Remove prefix if it exists
    let commandToExecute = command;
    if (hasPrefix) {
        commandToExecute = command.replace(api.prefix, '');
    }

    // Ensure the command can be executed with or without prefix
    if (api.commands.includes(commandToExecute)) {
        try {
            const commandJs = require(api.cmdLoc + `/${commandToExecute}`);
            if (commandJs.admin && !admin) {
                return send({
                    text: `❌ Command "${commandToExecute}" is for admins only.`,
                    quick_replies: [{ content_type: "text", title: `help`, payload: "HELP" }]
                });
            }
            await (commandJs.run || (() => {}))({ api, event, send, admin, args });
        } catch (error) {
            return send(`❌ Failed to execute the command "${commandToExecute}".`);
        }
    } else if (hasPrefix || commandToExecute) {
        return send({
            text: `❌ Command "${commandToExecute}" doesn't exist! Type or click (below) help to see available commands.`,
            quick_replies: [{ content_type: "text", title: `help`, payload: "HELP" }]
        });
    }
};

const listenPostback = async (event, pageAccessToken) => {
    const senderID = event.sender.id;
    const postbackPayload = event.postback.payload;
    const send = async text => api.sendMessage(senderID, typeof text === "object" ? text : { text }, pageAccessToken);
    const payload = postbackPayload.toLowerCase().trim();

    if (!senderID || !payload) return;

    if (payload === "get_started") {
        return getStarted(send);
    } else if (payload === "prefix") {
        return api.prefix ? send(`My prefix is: "${api.prefix}"`) : send(`I don't have a prefix. You can type commands directly.`);
    } else {
        const admin = api.admin.includes(senderID);
        if (api.commands.includes(payload)) {
            const commandJs = require(api.cmdLoc + `/${payload}`);
            if (commandJs.admin && !admin) {
                return send("This command is for admins only.");
            }
            await (commandJs.run || (() => {}))({ api, event, send, admin });
        }
    }
};

module.exports = async (event, pageAccessToken) => {
    if (event.message) {
        return listenMessage(event, pageAccessToken);
    } else if (event.postback) {
        return listenPostback(event, pageAccessToken);
    }
};
