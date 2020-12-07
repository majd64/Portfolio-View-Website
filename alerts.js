const apn = require('apn');
const axios = require('axios');
let Device = require("./models/device");

let options = {
  token: {
    key: "AuthKey_B49SAVN23T.p8",
    keyId: "B49SAVN23T",
    teamId: "YVWM9D9TSW"
  },
  production: true
};
let apnProvider = new apn.Provider(options);

function handleAlerts(){
  getPrices((res, error) => {
    if (error || !res){return}
    const users = Device.find({}, (err, users) => {
      for (i = 0; i < res.length; i++){
        const id = res[i].id;
        const price = res[i].price;
        const symbol = res[i].symbol;
        for (j = 0; j < users.length; j++){
          const user = users[j];
          for (k = 0; k < user.alerts.length; k++){
            const alert = user.alerts[k];
            if (alert.coinID.toLowerCase() == id.toLowerCase()){
              if (price > alert.price && alert.above){
                sendNotification(user.deviceToken, `${symbol} is above ${formatMoney(alert.price)}`)
                user.alerts.splice(k, 1);
                user.save();
              }
              else if (price < alert.price && !alert.above){
                sendNotification(user.deviceToken, `${symbol} is below ${formatMoney(alert.price)}`)
                user.alerts.splice(k, 1);
                user.save();
              }
            }
          }
        }
      }
    })
  })
  setTimeout(handleAlerts, 12000);
}

function getPrices(callback){
  const data = []
  axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=160&page=1&sparkline=false')
  .then(response => {
    for (i = 0; i < response.data.length; i++){
      data.push({id: response.data[i].id, price: response.data[i].current_price, symbol: response.data[i].symbol.toUpperCase()})
    }
    callback(data, null)
  })
  .catch(error => {
    callback(null, error)
  });
}

function sendNotification(deviceToken, alert){
  let notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600;
  notification.sound = "default";
  notification.alert = alert;
  notification.topic = "com.porfolioview.portfolioview";
  apnProvider.send(notification, deviceToken).then( result => {
  	console.log(result.failed.response);
  });
  // apnProvider.shutdown();
}

function formatMoney(value){
  var minimumFractionDigits = 2
  let decimalNumbers = value.toString().split(".")[1]
  if (decimalNumbers){
    minimumFractionDigits = decimalNumbers.length
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minimumFractionDigits
  })
  return formatter.format(value)
}

module.exports = handleAlerts
