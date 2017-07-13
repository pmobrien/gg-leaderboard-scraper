function onSelectChange() {
  $('#result').html('');
}

function calculate() {
  $('#result').html('');
  $('#calculate').hide();

  $.ajax({
    url: '/calculate/' + $('#division-selector').val(),
    type: 'GET',
    success: function(data) {
      $('#calculate').show();

      var result = '<br>';

      for(var i = 0; i < data.wods.length; ++i) {
        var wod = data.wods[i];

        wod.values.sort(function(a, b) {
          return a - b;
        }).reverse();

        result += '<div><strong>Workout ' + wod.number + ' (' + wod.submissions + ' submissions):</strong></div>' +
                  '<div>Team Average: ' + average(wod.values, wod.unit) + '</div>' +
                  '<div>Team Median: ' + median(wod.values, wod.unit) + '</div>' +
                  '<div>Team High: ' + high(wod.values, wod.unit) + '</div>' +
                  '<div>Team Low: ' + low(wod.values, wod.unit) + '</div>' +
                  '<div>Team Average (Top 10): ' + average(wod.values, wod.unit, 10) + '</div>' +
                  '<div>Team Average (Top 20): ' + average(wod.values, wod.unit, 20) + '</div>' +
                  '<div>Team Average (Top 45): ' + average(wod.values, wod.unit, 45) + '</div>' +
                  '<div>10th Place: ' + score(wod.values, wod.unit, 10) + '</div>' +
                  '<div>20th Place: ' + score(wod.values, wod.unit, 20) + '</div>' +
                  '<div>45th Place: ' + score(wod.values, wod.unit, 45) + '</div>' +
                  '<br>';
      }

      $('#result').html(result);
    },
    error: function(xhr, status, error) {
      $('#calculate').show();
      console.log('error');
    }
  });
}

function average(values, unit, count) {
  // if we don't even have <count> values, or if the array is empty, don't do anything
  if(count > values.length || values.length === 0) {
    return 'N/A';
  }

  var length = count || values.length;

  var total = 0;
  for(var i = 0; i < length; ++i) {
    total += +values[i];
  }

  return Math.round(+total / +length) + ' ' + unit + ' (' + Math.round(Math.round(+total / +length) / 3) + ' per athlete)';
}

function median(values, unit) {
  if(values.length === 0) {
    return 'N/A';
  }

  var half = Math.floor(values.length / 2);

  var median = values.length % 2
      ? Math.round(values[half])
      : Math.round((values[half - 1] + values[half]) / 2);

  return median + ' ' + unit + ' (' + Math.round(median / 3) + ' per athlete)';
}

function high(values, unit) {
  if(values.length === 0) {
    return 'N/A';
  }

  return values[0] + ' ' + unit + ' (' + Math.round(values[0] / 3) + ' per athlete)';
}

function low(values, unit) {
  if(values.length === 0) {
    return 'N/A';
  }

  return values[values.length - 1] + ' ' + unit + ' (' + Math.round(values[values.length - 1] / 3) + ' per athlete)';;
}

function score(values, type, place) {
  if(place > values.length) {
    return 'N/A';
  }

  return Math.round(values[place - 1]) + ' ' + type + ' (' + Math.round(values[place - 1] / 3) + ' per athlete)';
}
