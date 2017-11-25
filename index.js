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

        //emit new auction event so the client gets realtime uptdates currently does nothing
        io.emit('new-auction', object);
      });
    },
  );
});
//A sample client is written to sampleClientArray.txt, just so we can remember what properties the clients have
let clientArray = [];

//handle websockets. I have the client emitting an event to identify the page they are on, the clients are storred in an array and we can handle them with standard control flow
//We don't want every single page to add new items, as that would add items to the pages designed for viewing a specific item
io.on('connection', client => {
  console.log(client);
  client.on('id-event', location => {
    //location will give us both the absolute path (location.href) and the relative path location.pathname for the client
    client.clientLocation = location;
    clientArray.push(client);
  });

  //removes the client from the array when they disconnect
  client.on('disconnect', () => {
    let index = clientArray.indexOf(client);
    clientArray.splice(index, 1);
  });
});

server.listen(3000);
