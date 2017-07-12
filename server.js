var http = require('http');
var fs = require('fs');
var request = require('request');
var path = require('path');

const cheerio = require('cheerio');

http.createServer(function(request, response) {
  if(request.url == '/calculate') {
    console.log('calculate request from ' + request.connection.remoteAddress);
  
    calculate(function(data) {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end(data, 'utf-8');
    });
  } else {
    var filePath = '.' + request.url;
    if(filePath == './') {
      filePath = './index.html';
    }

    var name = path.extname(filePath);
    var contentType = 'text/html';
    switch(name) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;      
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }
    
    if(request.url.includes('favicon')) {
      response.end();
      return;
    }
  
    fs.readFile(filePath, function(error, content) {
      if(error) {
        console.log(error);
      } else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });
  } 
}).listen(15000);

var WOD1_INDEX = 5;
var WOD2_INDEX = 7;
var WOD3_INDEX = 9;

var wod1;
var wod2;
var wod3;

function calculate(callback) {
  wod1 = [];
  wod2 = [];
  wod3 = [];

  getResults(1, callback);
}

function getResults(num, callback) {
  request('http://registration.floelite.com/competitions/10/divisions/51/scoreboard?page=' + num, function(error, response, body) {
    var $ = cheerio.load(response.body);

    if($('tr.checkboard').length) {
      addResults($, $('tr.checkboard'));
      getResults(++num, callback);
    } else {
      callback(doCalculate());
    }
  });
}

function addResults($, rows) {
  for(var i = 0; i < rows.length; ++i) {
    if($(rows[i].childNodes[WOD1_INDEX]).children('span').eq(1)[0]) {
      wod1.push(+$(rows[i].childNodes[WOD1_INDEX]).children('span').eq(1)[0].children[0].data);
    }

    if($(rows[i].childNodes[WOD2_INDEX]).children('span').eq(1)[0]) {
      wod2.push(+$(rows[i].childNodes[WOD2_INDEX]).children('span').eq(1)[0].children[0].data);
    }

    if($(rows[i].childNodes[WOD3_INDEX]).children('span').eq(1)[0]) {
      wod3.push(+$(rows[i].childNodes[WOD3_INDEX]).children('span').eq(1)[0].children[0].data);
    }
  }
}

function doCalculate() {
  return calculateWod1() + calculateWod2() + calculateWod3();
}

function calculateWod1() {
  wod1.sort(function(a, b) {
    return a - b;
  }).reverse();

  var wod1Total = 0;
  for(var i = 0; i < wod1.length; ++i) {
    wod1Total += +wod1[i];
  }
  
  return 'Workout 1 (' + wod1.length + ' submissions):\n' +
         '  Team Average: ' + Math.round(+wod1Total / +wod1.length) + ' pounds\n' +
         '  Team Median: ' + Math.round(median(wod1)) + '\n' +
         '  Team High: ' + wod1[0] + '\n' +
         '  Team Low: ' + wod1[wod1.length - 1] + '\n\n';
}

function calculateWod2() {
  wod2.sort(function(a, b) {
    return a - b;
  }).reverse();

  var wod2Total = 0;
  for(var i = 0; i < wod2.length; ++i) {
    wod2Total += +wod2[i];
  }
  
  return 'Workout 2 (' + wod2.length + ' submissions):\n' +
         '  Team Average: ' + Math.round(+wod2Total / +wod2.length) + ' reps\n' +
         '  Athlete Average: ' + Math.round((+wod2Total / +wod2.length) / 3) + ' reps\n' +
         '  Team Median: ' + Math.round(median(wod2)) + '\n' +
         '  Team High: ' + wod2[0] + '\n' +
         '  Team Low: ' + wod2[wod2.length - 1] + '\n\n';
}

function calculateWod3() {
  wod3.sort(function(a, b) {
    return a - b;
  }).reverse();

  var wod3Total = 0;
  for(var i = 0; i < wod3.length; ++i) {
    wod3Total += +wod3[i];
  }
  
  return 'Workout 3 (' + wod3.length + ' submissions):\n' +
         '  Team Average: ' + Math.round(+wod3Total / +wod3.length) + ' reps\n' +
         '  Athlete Average: ' + Math.round((+wod3Total / +wod3.length) / 3) + ' reps\n' +
         '  Team Median: ' + Math.round(median(wod3)) + '\n' +
         '  Team High: ' + wod3[0] + '\n' +
         '  Team Low: ' + wod3[wod3.length - 1] + '\n\n';
}

function median(values) {
  var half = Math.floor(values.length / 2);

  if(values.length % 2) {
    return values[half];
  } else {
    return (values[half - 1] + values[half]) / 2.0;
  }
}
