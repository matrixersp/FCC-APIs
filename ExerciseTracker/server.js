const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const dotenv = require('dotenv');
dotenv.config();

app.use(express.static('public'));
const urlencoded = bodyParser.urlencoded({ extended: false });

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true }, function(
  err
) {
  if (err) throw err;
  console.log('Database connected!');
});

/* -------- USER SCHEMA -------- */
const userSchema = mongoose.Schema({
  _id: String,
  username: { type: String, required: true, unique: true },
  log: [{ type: String, ref: 'Exercise' }]
});

const User = mongoose.model('User', userSchema);

/* -------- EXERCISE SCHEMA -------- */
const exerciseSchema = mongoose.Schema({
  _id: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  user: { type: String, ref: 'User' }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

/* -------- ROOT ROUTE -------- */
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

/* -------- CREATE NEW USER -------- */
app.post('/api/exercise/new-user', urlencoded, async (req, res) => {
  const username = req.body.username;

  try {
    const result = await User.findOne({ username });
    if (result) return res.send('username already taken');
  } catch (e) {
    console.error(e);
  }

  const user = User({
    _id: shortid.generate(),
    username
  });

  try {
    const savedUser = await user.save();
    const { username, _id } = savedUser;
    res.json({ username, _id });
  } catch (e) {
    handleSaveErrors(e, res);
  }
});

const handleSaveErrors = (e, res) => {
  console.error(e);

  if (e.name === 'MongoError') return res.send(e.errmsg);

  const path = Object.keys(e.errors)[0];
  return res.send(e.errors[path].message);
};

/* -------- ADD EXERCISE -------- */
app.post('/api/exercise/add', urlencoded, async (req, res) => {
  const { userId, description, duration, date } = req.body;

  try {
    const result = await User.findById(userId);
    if (!result) return res.send('unknown userId');
  } catch (e) {
    console.error('userid', e);
  }

  const _id = shortid.generate();
  const exercise = Exercise({
    _id,
    description,
    duration,
    date,
    user: userId
  });

  try {
    const exerciseResult = await exercise.save();
    const userResult = await User.findOneAndUpdate(
      { _id: userId },
      { $push: { log: _id } },
      { useFindAndModify: true }
    );

    showExercise(exerciseResult, res);
  } catch (e) {
    handleSaveErrors(e, res);
  }
});

const showExercise = async (exerciseResult, res) => {
  try {
    const exercise = await Exercise.findById(exerciseResult._id).populate(
      'user',
      '_id username'
    );

    res.json({
      username: exercise.user.username,
      description: exercise.description,
      duration: exercise.duration,
      _id: exercise.user._id,
      date: exercise.date.toDateString()
    });
  } catch (e) {
    console.error(e);
  }
};

/* -------- GET USER'S EXERCISE LOG -------- */
app.get('/api/exercise/log', async (req, res) => {
  let { userId, from, to, limit } = req.query;

  Date.MIN_VALUE = new Date(-8640000000000000);
  Date.MAX_VALUE = new Date(8640000000000000);

  try {
    const result = await Exercise.find({
      user: userId,
      date: {
        $gte: from || Date.MIN_VALUE,
        $lte: to || Date.MAX_VALUE
      }
    })
      .select('-_id -__v')
      .populate('user', 'username')
      .limit(+limit);

    if (result.length === 0) return res.send('unknown userId');

    const count = result.length,
      _id = result[0].user._id,
      username = result[0].user.username;

    const log = result.map(item => ({
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    }));

    res.json({ _id, username, count, log });
  } catch (e) {
    if (e.name === 'CastError') res.send(e.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Your app is listening on port ' + port);
});
