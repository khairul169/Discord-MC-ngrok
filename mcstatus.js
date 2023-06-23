const { default: fetch } = require("cross-fetch");

const getMcStatus = async (hostname) => {
  try {
    const resp = await fetch(
      "https://api.mcstatus.io/v2/status/java/" + hostname
    );
    const data = await resp.json();
    return data;
  } catch (err) {
    console.error(err);
  }
  return { online: false };
};

// (async () => {
//   const status = await getMcStatus("0.tcp.ap.ngrok.io:16539");
//   const { online, version, players, motd } = status;

//   const playersOnline = `${players?.online || 0} / ${players?.max || 0}`;
//   console.log(online, version?.name_clean, playersOnline, motd?.clean);
// })();

module.exports = { getMcStatus };
