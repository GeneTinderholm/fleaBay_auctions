const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const exhbps = require('express-handlebars');
const redisClient = require('redis').createClient();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');

//setting handlebars
app.engine('handlebars', exhbps({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//middleware
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());
app.use(
  '/socket.io',
  express.static(__dirname + 'node_modules/socket.io-client/dist/'),
);

let itemsArray = [];
redisClient.hmset(
  'items',
  'name',
  'name1',
  'description',
  'descrip1',
  'time',
  '1 day',
  (error, result) => {
    if (error) res.send('Error: ' + error);
  },
);

app.get('/', (req, res) => {
  redisClient.hgetall('items', (err, object) => {
    itemsArray.push(object);
    res.render('index', {items: itemsArray});
  });
});

app.get('/add', (req, res) => {
  res.render('add');
});

app.post('/item/new', (req, res) => {
  let number = itemsArray.length;
  redisClient.hmset(
    `items${number}`,
    'name',
    req.body.name,
    'description',
    req.body.description,
    'time',
    req.body.time,
    (error, result) => {
      if (error) res.send('Error: ' + error);
      redisClient.hgetall(`items${number}`, (err, object) => {
        itemsArray.push(object);
        res.render(`items/${number + 1}`);
      });
    },
  );
});

server.listen(3000);
