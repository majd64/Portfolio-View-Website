let Device = require("./models/device");
const axios = require('axios');
const apn = require('apn');

let options = {
  token: {
    key: "./AuthKey_B49SAVN23T.p8",
    keyId: "B49SAVN23T",
    teamId: "YVWM9D9TSW"
  },
  production: true
};
let apnProvider = new apn.Provider(options);
console.log(process.env.NODE_ENV)

const myDeviceToken = "E45E44937441F0CA18194544C2E3C3E390BECA03D371A79967D42AEF3C6CA15F"

let alertObj = {currencies: []}
handleAlerts()
function handleAlerts(){
  console.log("alert session")
  alertObj = {currencies: []}
  Device.find({ alerts: { $exists: true, $ne: [] } }, (err, devices) => {
    devices.forEach((device, i) => {
      device.alerts.forEach((alert, j) => {
        if (!alert.currencyID){
          device.alerts[j].currencyID = "usd"
          device.save()
        }
        if (!alertObj[alert.currencyID]){
          alertObj[alert.currencyID] = {coinIds: [], prices: {}, coinIdString: ""}
          alertObj.currencies.push(alert.currencyID)
        }
        if (!alertObj[alert.currencyID].coinIds.includes(alert.coinID)){
          alertObj[alert.currencyID].coinIds.push(alert.coinID)
          alertObj[alert.currencyID].coinIdString += `${alert.coinID},`
          alertObj[alert.currencyID].prices[alert.coinID] = null
        }
      });
    });
    var counter = 0
    alertObj.currencies.forEach((currency, i) => {
      axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${alertObj[currency].coinIdString}&order=market_cap_desc&per_page=100&page=1&sparkline=false`)
        .then(response => {
          response.data.forEach((coin, j) => {
            alertObj[currency].prices[coin.id] = coin.current_price
          });
          counter ++
          if (counter === alertObj.currencies.length){
            devices.forEach((device, i) => {
              device.alerts.forEach((alert, j) => {
                let currentPrice = alertObj[alert.currencyID] ? alertObj[alert.currencyID].prices[alert.coinID] : null
                if (currentPrice){
                  if (alert.above && currentPrice >= alert.price){
                    sendNotification(device.deviceToken, `${alert.coinTicker && alert.coinTicker != "" ? alert.coinTicker.toUpperCase() : alert.coinID} is above ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
                    device.alerts.splice(j, 1);
                    device.save();
                  }
                  if (!alert.above && alert.price > currentPrice){
                    sendNotification(device.deviceToken, `${alert.coinTicker && alert.coinTicker != "" ? alert.coinTicker.toUpperCase() : alert.coinID} is below ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
                    device.alerts.splice(j, 1);
                    device.save();
                  }
                }
              });
            });
          }
        })
        .catch(err => {
          console.log(`error: ${err}`)
        })
    });
  });
  setTimeout(handleAlerts, 12000);
}

var btc1hLastAlertTime = 0
var eth1hLastAlertTime = 0
var btc1dLastAlertTime = 0
var eth1dLastAlertTime = 0
handlerVolatilityAlerts()
function handlerVolatilityAlerts(){
  console.log("Volatility alert session")
  axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2C%20ethereum&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h")
  .then(response => {
    let btc1hChange = response.data[0].price_change_percentage_1h_in_currency
    let btc1dChange = response.data[0].price_change_percentage_24h_in_currency
    let btcPrice = formatMoney(response.data[0].current_price, "USD")

    let eth1hChange = response.data[1].price_change_percentage_1h_in_currency
    let eth1dChange = response.data[1].price_change_percentage_24h_in_currency
    let ethPrice = formatMoney(response.data[1].current_price, "USD")

    if (Math.abs(btc1hChange) >= 3 && btc1hLastAlertTime < Date.now() - 3600000){
      alertUsersWithVolatilityAlertsEnabled(`BTC is ${btc1hChange > 0 ? "up" : "down"} ${`${btc1hChange.toFixed(2)}% in the last hour`}\nPrice is ${btcPrice} USD`)
      btc1hLastAlertTime = Date.now()
    }

    if (Math.abs(eth1hChange) >= 3 && eth1hLastAlertTime < Date.now() - 3600000){
      alertUsersWithVolatilityAlertsEnabled(`ETH is ${eth1hChange > 0 ? "up" : "down"} ${`${eth1hChange.toFixed(2)}% in the last hour`}\nPrice is ${ethPrice} USD`)
      eth1hLastAlertTime = Date.now()
    }

    if (Math.abs(btc1dChange) >= 6 && btc1dLastAlertTime < Date.now() - 86400000){
      alertUsersWithVolatilityAlertsEnabled(`BTC is ${btc1dChange > 0 ? "up" : "down"} ${`${btc1dChange.toFixed(2)}% in the last 24 hours`}\nPrice is ${btcPrice} USD`)
      btc1dLastAlertTime = Date.now()
    }

    if (Math.abs(eth1dChange) >= 6 && eth1dLastAlertTime < Date.now() - 86400000){
      alertUsersWithVolatilityAlertsEnabled(`ETH is ${eth1dChange > 0 ? "up" : "down"} ${`${eth1dChange.toFixed(2)}% in the last 24 hours`}\nPrice is ${ethPrice} USD`)
      eth1dLastAlertTime = Date.now()
    }
  })
  .catch(err => {
    console.log("err")
  })
  setTimeout(handlerVolatilityAlerts, 12000);
}

function alertUsersWithVolatilityAlertsEnabled(string){
  Device.find({ $or:[ {volatilityAlerts: 1}, {volatilityAlerts: 2} ]}, (err, devices) => {
    devices.forEach((device, i) => {
      sendNotification(device.deviceToken, string)
    });
  })
}

function sendNotification(deviceToken, alert){
  let notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600;
  notification.sound = "default";
  notification.alert = alert;
  notification.topic = "com.porfolioview.portfolioview";
  apnProvider.send(notification, deviceToken).then( result => {
  	console.log(JSON.stringify(result));
  });
  // apnProvider.shutdown();
}

function formatMoney(value, currency){
  var minimumFractionDigits = 2
  let decimalNumbers = value.toString().split(".")[1]
  if (decimalNumbers){
    minimumFractionDigits = decimalNumbers.length
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minimumFractionDigits
  })
  return formatter.format(value)
}

module.exports = sendNotification
