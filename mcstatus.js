const { default: fetch } = require("cross-fetch");

const getMcStatus = async (hostname) => {
  try {
    const resp = await fetch(
      "https://api.mcstatus.io/v2/status/java/" + hostname
    );
    const data = await resp.json();

    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

getMcStatus("play.hypixel.net:25565");

module.exports = { getMcStatus };
