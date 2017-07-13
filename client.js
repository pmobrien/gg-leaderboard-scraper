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
      $('#result').html(data.replace(/\n/g, "<br />"));
    },
    error: function(xhr, status, error) {
      $('#calculate').show();
      console.log('error');
    }
  });
}
