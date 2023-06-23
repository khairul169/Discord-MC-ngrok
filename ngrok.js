const ngrok = require("ngrok");
const fs = require("fs/promises");
const Config = require("./config.json");
const { getMcStatus } = require("./mcstatus");

let discordMessage;
let messageInterval;

const createTunnel = async (onInitialized) => {
  const onStatusChange = (status) => {
    console.log("status change", status);
    if (status === "closed") {
      createTunnel(onInitialized);
    }
  };

  try {
    await ngrok.kill();

    const url = await ngrok.connect({
      authtoken: Config.ngrok.auth_token,
      proto: Config.ngrok.proto,
      addr: Config.ngrok.port,
      onStatusChange,
    });

    onInitialized(url);
  } catch (err) {
    console.log(err);
  }
};

const formatDiscordMessage = async (hostname) => {
  // const [host, port] = hostname.split(":");
  let message = `${Config.discord.message}\n${hostname}`;

  try {
    const status = await getMcStatus(hostname);
    const { online, version, players, motd } = status;

    const playersOnline = `${players?.online || 0} / ${players?.max || 0}`;
    // console.log(online, version?.name_clean, playersOnline, motd?.clean);

    message += `\n\n${online ? "🟢" : "🔴"} ${motd?.clean || "offline"}`;

    if (online) {
      message += "\n ⛏ " + version?.name_clean;
      message += "\n 🧑 " + playersOnline;
    }

    if (players?.list?.length > 0) {
      message +=
        "\n\nOnline Players:\n" +
        players?.list.map((i) => i.name_clean).join(", ");
    }
  } catch (err) {
    //
  }

  return message;
};

const startNgrok = async (client) => {
  const channelId = Config.discord.channel_id;
  if (!channelId?.length) {
    return;
  }

  const onInitialized = async (url) => {
    try {
      const hostname = url.replace("tcp://", "");
      console.log("tunneling url:", hostname);

      const message = await formatDiscordMessage(hostname);
      const channel = client.channels.cache.get(channelId);
      const msgId = Config.discord.message_id;

      if (msgId?.length > 0) {
        const msgs = await channel.messages.fetch({
          around: msgId,
          limit: 1,
        });
        const lastMsg = msgs?.first();
        lastMsg?.delete();
      }

      if (!discordMessage) {
        // if (msgId?.length > 0) {
        //   const msgs = await channel.messages.fetch({
        //     around: msgId,
        //     limit: 1,
        //   });
        //   discordMessage = msgs?.first();
        //   discordMessage?.edit(message);
        // }

        // if (!discordMessage) {
        discordMessage = await channel.send(message);

        // save last msg id
        const cfgPath = __dirname + "/config.json";
        const data = JSON.parse(await fs.readFile(cfgPath));
        data.discord.message_id = discordMessage.id;

        await fs.writeFile(cfgPath, JSON.stringify(data, undefined, 4));
        // }
      } else {
        discordMessage.edit(message);
      }

      if (messageInterval) {
        clearInterval(messageInterval);
      }

      messageInterval = setInterval(async () => {
        if (!discordMessage) {
          return;
        }

        const message = await formatDiscordMessage(hostname);
        discordMessage.edit(message);
      }, 30000);

      // console.log("discordMessage", discordMessage);
    } catch (err) {
      console.error(err);
    }
  };

  createTunnel(onInitialized);
};

module.exports = startNgrok;
