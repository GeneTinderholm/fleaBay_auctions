const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const exhbps = require("express-handlebars");
const redisClient = require("redis").createClient();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const cookieParser = require("cookie-parser");

//setting handlebars
app.engine("handlebars", exhbps({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//middleware
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  "/socket.io",
  express.static(__dirname + "node_modules/socket.io-client/dist/")
);

app.get("/", (req, res) => {
  redisClient.hmset(
    "items",
    "name",
    "name1",
    "description",
    "descrip1",
    "time",
    "1 day",
    (error, result) => {
      if (error) res.send("Error: " + error);
      redisClient.hgetall("items", function(err, object) {
        let itemsArray = res.render("index", { items: [object] });
      });
    }
  );
});

server.listen(3000);
