const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');

require('dotenv').config();

app.use(express.static('public'));
const urlencoded = bodyParser.urlencoded({ extended: false });

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true }, function(
  err
) {
  if (err) throw err;
  console.log('Database connected!');
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/shorturl/new', urlencoded, async function(req, res) {
  const originalUrl = req.body.url.replace(/(^\w+:|^)\/\//, '');

  try {
    await validateUrl(originalUrl);

    try {
      const data = await checkShortenedUrl(originalUrl);
      if (data) {
        const { original_url, short_url } = data;
        return res.json({ original_url, short_url });
      }
    } catch (ex) {
      throw ex;
    }

    try {
      const data = await checkLastRecord();
      const shortUrl = data ? data.short_url + 1 : 1;

      const url = new Url({ original_url: originalUrl, short_url: shortUrl });
      url.save();
      return res.json({ original_url: originalUrl, short_url: shortUrl });
    } catch (ex) {
      throw ex;
    }

    res.redirect('index.html');
  } catch (ex) {
    res.send({ error: 'invalid URL' });
  }
});

function validateUrl(url) {
  return new Promise((resolve, reject) => {
    dns.lookup(url, function(err, address, family) {
      if (err) reject(err);
      resolve(address);
    });
  });
}

async function checkShortenedUrl(url) {
  return (await Url.find({ original_url: url }).select({
    _id: 0,
    __v: 0
  })).pop();
}

async function checkLastRecord() {
  return (await Url.find()
    .limit(1)
    .sort({ short_url: -1 })).pop();
}

app.get('/api/shorturl/:path', function(req, res) {
  Url.find({ short_url: req.params.path }, function(err, data) {
    if (!data || data.length === 0)
      return res.status(404).send('404 - Page not Found!');

    res.status(303).setHeader('Location', 'https://' + data[0].original_url);
    res.end();
  });
});

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Your app is listening on port ' + port);
});
