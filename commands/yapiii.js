const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs/promises");

const execute = async (interaction) => {
  console.log(interaction);

  await interaction.reply("Channel ID: " + interaction.channelId);

  const cfgPath = __dirname + "/../config.json";
  const data = JSON.parse(await fs.readFile(cfgPath));
  data.discord.channel_id = interaction.channelId;

  await fs.writeFile(cfgPath, JSON.stringify(data, undefined, 4));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yapiii")
    .setDescription("YapiBot69 reg"),
  execute,
};
