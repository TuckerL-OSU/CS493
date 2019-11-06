const express = require('express');
const app = express();

const path = require(`path`);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello from Tucker Lavell\'s App Engine!<p>Go to <a href="https://lavellt-assign1-gae.appspot.com/submit">/submit</a> to find the form.');
});

app.get('/submit', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/form.html'));
});

app.post('/submit', (req, res) => {
  console.log({
    name: req.body.name,
    message: req.body.message
  });
  // res.send('Thanks for your message!');
  res.send('Hello, ' + req.body.name + '!<p>You said: ' + req.body.message);
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});