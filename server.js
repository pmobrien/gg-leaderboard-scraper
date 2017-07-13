const fs = require('fs');
const http = require('http');
const path = require('path');
const uuid = require('uuid/v1')
const cheerio = require('cheerio');
const request = require('request');

http.createServer(function(request, response) {
  if(request.url.includes('/calculate')) {
    var id = uuid();
    var ip = request.connection.remoteAddress;
    var division = request.url.substring(request.url.length - 2);   // kind of hacky, oh well

    console.log(
      'Request id: ' + id + '\n' +
      'Calculate request for division ' + division + ' from ' + ip + '\n'
    );

    calculate(division, function(data) {
      console.log(
        'Request id: ' + id + '\n' +
        'Result:\n' +
        data
      );

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
    addResult($, rows, i, WOD1_INDEX, wod1);
    addResult($, rows, i, WOD2_INDEX, wod2);
    addResult($, rows, i, WOD3_INDEX, wod3);
  }
}

function addResult($, rows, i, wodIndex, values) {
  if($(rows[i].childNodes[wodIndex]).children('span').eq(1)[0]) {
    var value = +$(rows[i].childNodes[wodIndex]).children('span').eq(1)[0].children[0].data;

    if(value) {
      values.push(value);
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

  return printWod(1, wod1, 'pounds');
}

function calculateWod2() {
  wod2.sort(function(a, b) {
    return a - b;
  }).reverse();

  return printWod(2, wod2, 'reps');
}

function calculateWod3() {
  wod3.sort(function(a, b) {
    return a - b;
  }).reverse();

  return printWod(3, wod3, 'reps');
}

function printWod(num, values, type) {
  var result = 'Workout ' + num + ' (' + values.length + ' submissions):\n' +
               '  Team Average: ' + average(values, type) + '\n' +
               '  Team Median: ' + median(values, type) + '\n' +
               '  Team High: ' + values[0] + ' ' + type + '\n' +
               '  Team Low: ' + values[values.length - 1] + ' ' + type + '\n' +
               '  Team Average (Top 10): ' + average(values, type, 10) + '\n' +
               '  Team Average (Top 20): ' + average(values, type, 20) + '\n' +
               '  Team Average (Top 45): ' + average(values, type, 45) + '\n' +
               '  10th Place: ' + getScoreForPlace(values, type, 10) + '\n' +
               '  20th Place: ' + getScoreForPlace(values, type, 20) + '\n' +
               '  45th Place (Qualifier Cutoff): ' + getScoreForPlace(values, type, 45) + '\n';

  return result + '\n';
}

function average(values, type, count) {
  // if we don't even have <count> values, don't do anything
  if(count > values.length) {
    return 'N/A';
  }

  var length = count || values.length;

  var total = 0;
  for(var i = 0; i < length; ++i) {
    total += +values[i];
  }

  return Math.round(+total / +length) + ' ' + type + ' (' + Math.round(Math.round(+total / +length) / 3) + ' per athlete)';
}

function athleteAverage(values) {
  return Math.round(average(values) / 3);
}

function median(values, type) {
  var half = Math.floor(values.length / 2);

  var median = values.length % 2
      ? Math.round(values[half])
      : Math.round((values[half - 1] + values[half]) / 2);

  return median + ' ' + type + ' (' + (Math.round(median / 3)) + ' per athlete)';
}

function getScoreForPlace(values, type, place) {
  if(place > values.length) {
    return 'N/A';
  }

  return Math.round(values[place]) + ' (' + Math.round(values[place] / 3) + ' per athlete)';
}
