function onSelectChange() {
  $('#result').html('');
}

function calculate() {
  $('#result').html('');

  $.ajax({
    url: '/calculate/' + $('#division-selector').val(),
    type: 'GET',
    success: function(data) {
      $('#result').html(data.replace(/\n/g, "<br />"));
    },
    error: function(xhr, status, error) {
      console.log('error');
    }
  });
}
