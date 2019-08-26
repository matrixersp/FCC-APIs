const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/timestamp/:date_string?', function(req, res) {
  let str = req.params.date_string;
  let dateString = Number.isNaN(+str) ? str : +str;

  let date = new Date(dateString);

  if (date.toUTCString() === 'Invalid Date')
    return res.json({ error: date.toUTCString() });

  res.json({ unix: date.getTime(), utc: date.toUTCString() });
});

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('The app is listening on port ' + port);
});
