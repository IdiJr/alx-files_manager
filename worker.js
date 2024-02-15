import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

const index = require('./routes/index');

app.use('/', index);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
