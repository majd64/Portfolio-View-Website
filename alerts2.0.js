let lastAlertTimesObj = {"bitcoin": [0, 0], "ethereum": [0, 0], "binancecoin": [0, 0], "cardano": [0, 0], "polkadot": [0, 0], "ripple": [0, 0], "litecoin": [0,0], "chainlink": [0, 0]}

function handlerVolatilityAlerts(){
  axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2C%20ethereum&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h")
  .then(response => {
    response.data.forEach((coin, i) => {
      const id = coin.id;
      const change1h = coin.price_change_percentage_1h_in_currency;
      const change24h = coin.price_change_percentage_24h_in_currency;
      const price = formatMoney(coin.current_price, "USD");
      const symbol = coin.symbol.toUpperCase();
      const last1hAlert = lastAlertTimesObj[id][0];
      const last24hAlert = lastAlertTimesObj[id][1];

      if (Math.abs(change1h) >= 3 && last1hAlert < Date.now() - 3600000){
        alertVolatilityAlert(id, `${symbol} is ${change1h > 0 ? "up" : "down"} ${`${change1h.toFixed(2)}% in the last hour`}\nPrice is ${price} USD`)
        lastAlertTimesObj[id][0] = Date.now();
      }

      if (Math.abs(change24h) >= 6 && last24hAlert < Date.now() - 86400000){
        alertVolatilityAlert(id, `${symbol} is ${change24h > 0 ? "up" : "down"} ${`${change24h.toFixed(2)}% in the last 24 hours`}\nPrice is ${price} USD`);
        btc1dLastAlertTime = Date.now();
      }
    });
  })
  .catch(err => {
    console.log("err");
  })
  setTimeout(handlerVolatilityAlerts, 12000);
}

function alertVolatilityAlert(coinID, alert){
  Device.find({newVolatilityAlerts: coinID}, (err, devices) => {
    devices.forEach((device, i) => {
      sendNotification(device.deviceToken, alert)
    });
  })
}
