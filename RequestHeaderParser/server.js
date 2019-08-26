const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/api/whoami', function(req, res) {
  const ip = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0]
      : req.connection.remoteAddress,
    language = req.headers['accept-language'],
    software = req.headers['user-agent'];

  res.json({ ip, language, software });
});

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('The app is listening on port ' + port);
});
