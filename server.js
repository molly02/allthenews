var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

//  need  express, express-handlebars, mongoose, cheerio, axios

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// db.on("error", function(error) {
//     console.log("Mongoose Error: ", error);
//   });

// mongoose.connect("mongodb://localhost/mongoHeadlines", { useNewUrlParser: true });

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/scrape", function(req, res) {
  axios.get("https://www.huffpost.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("a.yr-card-headline").each(function(i, element) {
      var result = {};
      //headline, summary, url

      //   var title = $(element).children().text();
      //   //var summary = $(element).
      //   var link = $(element).attr("href");

      result.title = $(this)
        .children()
        .text();
      // result.summary = $(this)
      // .
      result.link = $(this).attr("href");

      // result.title = $(this)
      // .children("a")
      // .text();
      // result.link = $(this)
      // // .children("a")
      // .attr("href");

      //

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });

      //res.send("Scrape Complete");
    });

    // console.log(results);
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
