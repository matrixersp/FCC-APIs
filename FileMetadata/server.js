const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs');

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}`)
});

const upload = multer({ storage }).single('upfile');

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/metadata', (req, res) => {
  upload(req, res, err => {
    if (err) {
      console.log(err);
      return res.send('There was an error uploading the file!');
    }

    if (!req.file) return res.send('Please Choose a File!');

    res.json({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('The app is listening on port ' + port);
});
