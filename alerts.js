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
            sendNotification(device.deviceToken, `${alert.coinID} is above ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
            device.alerts.splice(j, 1);
            device.save();
          }
          if (!alert.above && alert.price > currentPrice){
            sendNotification(device.deviceToken, `${alert.coinID} is below ${formatMoney(alert.price, alert.currencyID.toUpperCase())}`)
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

function sendNotification(deviceToken, alert){
  console.log(`sending ${deviceToken}`)
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
