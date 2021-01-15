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

function handleAlerts(){
  Device.find({ alerts: { $exists: true, $ne: [] } }, (err, devices) => {
    devices.forEach((device, i) => {
      device.alerts.forEach((alert, j) => {
        if (!alert.currencyID){
          alert.currencyID = "usd"
        }
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${alert.coinID}&vs_currencies=${alert.currencyID}`)
        .then(response => {
          const currentPrice = response.data[alert.coinID][alert.currencyID]
          if (alert.above && currentPrice >= alert.price){
            sendNotification(device.deviceToken, `${alert.coinTicker && alert.coinTicker != "" ? alert.coinTicker.toUpperCase() : alert.coinID} is above ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
            sendNotification(myDeviceToken, `${alert.coinTicker && alert.coinTicker != "" ? alert.coinTicker.toUpperCase() : alert.coinID} is above ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
            device.alerts.splice(j, 1);
            device.save();
          }
          if (!alert.above && alert.price > currentPrice){
            sendNotification(device.deviceToken, `${alert.coinTicker && alert.coinTicker != "" ? alert.coinTicker.toUpperCase() : alert.coinID} is below ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
            sendNotification(myDeviceToken, `${alert.coinTicker && alert.coinTicker != "" ? alert.coinTicker.toUpperCase() : alert.coinID} is below ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
            device.alerts.splice(j, 1);
            device.save();
          }
        })
        .catch(error => {
          console.log(error)
        });
      });
    });
  })
  setTimeout(handleAlerts, 20000);
}

var lastTime3PercentUsersWereAlerted = 0
var lastTime5PercentUsersWereAlerted = 0
handleVolatilityAlerts()
function handleVolatilityAlerts(){
  axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h")
  .then(response => {

    //3600000
    let change = response.data[0].price_change_percentage_1h_in_currency
    let priceUsd = formatMoney(response.data[0].current_price, "USD")

    if (Math.abs(change) >= 3){//
      if (lastTime3PercentUsersWereAlerted < Date.now() - 3600000){
        Device.find({volatilityAlerts: 1}, (err, devices) => {
          devices.forEach((device, i) => {
            sendNotification(device.deviceToken, `BTC is ${change > 0 ? "up" : "down"} ${`${change.toFixed(2)}% in the last hour`}\nPrice is ${priceUsd} USD`)
          });
        })
        lastTime3PercentUsersWereAlerted = Date.now()
      }
      if (Math.abs(response.data[0].price_change_percentage_1h_in_currency) >= 5){
        if (lastTime5PercentUsersWereAlerted < Date.now() - 3600000){
          Device.find({volatilityAlerts: 2}, (err, devices) => {
            devices.forEach((device, i) => {
              sendNotification(device.deviceToken, `BTC is ${change > 0 ? "up" : "down"} ${`${change.toFixed(2)}% in the last hour`}\nPrice is ${priceUsd} USD`)
            });
          })
          lastTime5PercentUsersWereAlerted = Date.now()
        }
      }
    }
  })
  setTimeout(handleVolatilityAlerts, 20000);
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

module.exports = handleAlerts
