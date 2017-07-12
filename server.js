var http = require('http');
var fs = require('fs');
var request = require('request');
var path = require('path');

const cheerio = require('cheerio');

http.createServer(function(request, response) {
  if(request.url.includes('/calculate')) {
    var ip = request.connection.remoteAddress;
    var division = request.url.substring(request.url.length - 2);   // kind of hacky, oh well
  
    console.log('calculate request for division ' + division + ' from ' + ip);
  
    calculate(division, function(data) {
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

function calculate(division, callback) {
  wod1 = [];
  wod2 = [];
  wod3 = [];

  getResults(1, division, callback);
}

function getResults(num, division, callback) {
  request('http://registration.floelite.com/competitions/10/divisions/' + division + '/scoreboard?page=' + num, function(error, response, body) {
    var $ = cheerio.load(response.body);

    if($('tr.checkboard').length) {
      addResults($, $('tr.checkboard'));
      getResults(++num, division, callback);
    } else {
      callback(doCalculate());
    }
  });
}

function addResults($, rows) {
  for(var i = 0; i < rows.length; ++i) {
    if($(rows[i].childNodes[WOD1_INDEX]).children('span').eq(1)[0]) {
      var value = +$(rows[i].childNodes[WOD1_INDEX]).children('span').eq(1)[0].children[0].data;
    
      if(value) {
        wod1.push(value);
      }
    }

    if($(rows[i].childNodes[WOD2_INDEX]).children('span').eq(1)[0]) {
      var value = +$(rows[i].childNodes[WOD2_INDEX]).children('span').eq(1)[0].children[0].data;
    
      if(value) {
        wod2.push(value);
      }
    }

    if($(rows[i].childNodes[WOD3_INDEX]).children('span').eq(1)[0]) {
      var value = +$(rows[i].childNodes[WOD3_INDEX]).children('span').eq(1)[0].children[0].data;
    
      if(value) {
        wod3.push(value);
      }
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

  return printWod(1, wod1, 'pounds', false);
}

function calculateWod2() {
  wod2.sort(function(a, b) {
    return a - b;
  }).reverse();
  
  return printWod(2, wod2, 'reps', true);
}

function calculateWod3() {
  wod3.sort(function(a, b) {
    return a - b;
  }).reverse();
  
  return printWod(3, wod3, 'reps', true);
}

function printWod(num, values, type, includeAthleteAverage) {
  var result = 'Workout ' + num + ' (' + values.length + ' submissions):\n' +
               '  Team Average: ' + average(values) + ' ' + type + '\n' +
               '  Team Median: ' + median(values) + '\n' +
               '  Team High: ' + values[0] + '\n' +
               '  Team Low: ' + values[values.length - 1] + '\n';
               
  if(includeAthleteAverage) {
    result += '  Athlete Average: ' + athleteAverage(values) + ' reps\n';
  }

  return result + '\n';
}

function average(values) {
  var total = 0;
  for(var i = 0; i < values.length; ++i) {
    total += +values[i];
  }
  
  return Math.round(+total / +values.length);
}

function athleteAverage(values) {
  return Math.round(average(values) / 3);
}

function median(values) {
  var half = Math.floor(values.length / 2);

  if(values.length % 2) {
    return Math.round(values[half]);
  } else {
    return Math.round((values[half - 1] + values[half]) / 2.0);
  }
}
