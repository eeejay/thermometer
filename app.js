var express = require("express");
var app = express();
app.use(express.static(__dirname + '/public'))

var fs = require("fs");
var history = [];
var samples = [];
const INTERVAL = Number(process.env.THERM_INTERVAL) || 60000

var test_temp = 20;

function getCurrentTemp() {
  if (process.env.DEBUG) {
    return Promise.resolve(test_temp + Math.random());
  }

  return new Promise(resolve => {
    fs.readFile('/sys/bus/w1/devices/28-0000075f7be9/w1_slave', "utf8", (e, b) => {
      if (b.match(/YES\n/)) {
        resolve(Number(b.match(/t=(\d+)/)[1])/1000);
      }
    });
  });
}

function recordTemp() {
  let now = new Date();
  getCurrentTemp().then(temp => {
    samples.push(temp);
    if (now.getMinutes() % 5 == 0 && samples.length) {
      now.setSeconds(0);
      now.setMilliseconds(0);
      history.splice(1440, 1);
      history.unshift(
        [Number(now), samples.reduce((x, y) => x + y)/samples.length]);
      samples = [];
    }
  });
}

setInterval(recordTemp, INTERVAL);
recordTemp();

app.get("/history", function(req, res) {
  if (process.env.DEBUG) {
    res.json(require("./sample_data.json"));
  } else {
    res.json(history);
  }
});

app.get("/now", function(req, res) {
  if (process.env.DEBUG) {
    res.json(test_temp + Math.random());
  } else {
    getCurrentTemp().then(temp => {
      res.json(temp);
    })
  }
});


app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
