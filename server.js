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
      '  Calculate request for division ' + division + ' from ' + ip + '\n'
    );

    getResultsForDivision(division, function(data) {
      console.log(
        'Request id: ' + id + '\n' +
        '  Result: ' + JSON.stringify(data)
      );

      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(data));
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

    // these requests are failing and rather than dealing with them, just hacked this in
    if(request.url.includes('favicon') || request.url.includes('apple-touch')) {
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
var WOD4_INDEX = 11;
var WOD5_INDEX = 13;
var WOD6_INDEX = 15;

var wod1;
var wod2;
var wod3;
var wod4;
var wod5;
var wod6;

function getResultsForDivision(division, callback) {
  wod1 = [];
  wod2 = [];
  wod3 = [];
  wod4 = [];
  wod5 = [];
  wod6 = [];

  getResults(1, division, callback);
}

function getResults(num, division, callback) {
  request('http://registration.floelite.com/competitions/10/divisions/' + division + '/scoreboard?page=' + num, function(error, response, body) {
    var $ = cheerio.load(response.body);

    if($('tr.checkboard').length) {
      addResults($, $('tr.checkboard'));
      getResults(++num, division, callback);
    } else {
      callback(buildResults());
    }
  });
}

function addResults($, rows) {
  for(var i = 0; i < rows.length; ++i) {
    addResult($, rows, i, WOD1_INDEX, wod1);
    addResult($, rows, i, WOD2_INDEX, wod2);
    addResult($, rows, i, WOD3_INDEX, wod3);
    addResult($, rows, i, WOD4_INDEX, wod4);
    addResult($, rows, i, WOD5_INDEX, wod5);
    addResult($, rows, i, WOD6_INDEX, wod6);
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

function buildResults() {
  return {
    wods: [
      {
        number: 1,
        submissions: wod1.length,
        unit: 'pounds',
        values: wod1
      },
      {
        number: 2,
        submissions: wod2.length,
        unit: 'reps',
        values: wod2
      },
      {
        number: 3,
        submissions: wod3.length,
        unit: 'reps',
        values: wod3
      },
      {
        number: 4,
        submissions: wod4.length,
        unit: 'reps',
        values: wod4
      },
      {
        number: 5,
        submissions: wod5.length,
        unit: 'reps',
        values: wod5
      },
      {
        number: 6,
        submissions: wod6.length,
        unit: 'reps',
        values: wod6
      }
    ]
  };
}
