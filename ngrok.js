const ngrok = require("ngrok");
const fs = require("fs/promises");
const Config = require("./config.json");

let discordMessage;

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

const startNgrok = async (client) => {
  const channelId = Config.discord.channel_id;
  if (!channelId?.length) {
    return;
  }

  const onInitialized = async (url) => {
    try {
      const mcUrl = url.replace("tcp://", "");
      console.log("tunneling url:", mcUrl);
      const [host, port] = mcUrl.split(":");

      const message = `${Config.discord.message}\nHost: ${host}\nPort: ${port}`;
      const channel = client.channels.cache.get(channelId);
      const msgId = Config.discord.message_id;

      if (!discordMessage) {
        if (msgId?.length > 0) {
          const msgs = await channel.messages.fetch({
            around: msgId,
            limit: 1,
          });
          discordMessage = msgs?.first();
          discordMessage?.edit(message);
        }

        if (!discordMessage) {
          discordMessage = await channel.send(message);
          //   const cfgPath = __dirname + "/config.json";
          //   const data = JSON.parse(await fs.readFile(cfgPath));
          //   data.discord.message_id = discordMessage.id;

          //   await fs.writeFile(cfgPath, JSON.stringify(data, undefined, 4));
        }
      } else {
        discordMessage.edit(message);
      }

      // console.log("discordMessage", discordMessage);
    } catch (err) {
      console.error(err);
    }
  };

  createTunnel(onInitialized);
};

module.exports = startNgrok;
