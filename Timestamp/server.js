const app = require('express')();

app.get('/api/timestamp/:date_string?', function(req, res) {
  let str = req.params.date_string;
  let dateString = Number.isNaN(+str) ? str : +str;

  let date = new Date(dateString);

  if (date.toUTCString() === 'Invalid Date')
    return res.json({ error: date.toUTCString() });

  res.json({ unix: date.getTime(), utc: date.toUTCString() });
});

const listener = app.listen(process.env.PORT, function() {
  console.log(listener.address(), process.env.PORT);
  console.log('Your app is listening on port ' + listener.address().port);
});
