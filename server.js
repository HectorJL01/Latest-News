console.log("server is woriking");
// // Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var axios = require("axios");
var request = require("request");

var logger = require("morgan");

// // Require all models
var db = require("./models/");


// // Initialize Express
var app = express();

var server = app.listen(3000, listening);

function listening(){
  console.log("macarena...");
}

// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadLines";

// mongoose.Promise = Promise;
// ONGODB_URI
// mongoose.connect(MONGODB_URI);
mongoose.connect("mongodb://localhost/week18Populater");

var exphbs  = require('express-handlebars');

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// // Configure middleware

// // Use morgan logger for logging requests
app.use(logger("dev"));
// // Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// // Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// // Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoHeadLines");

// // Routes

app.get("/", function(req, res) {
  res.render("index", {res});
});
// A GET route for scraping the BBC website
app.get("/", function(req, res) {
    // First, we grab the body of the html with request
    axios.get("http://www.echojs.com/").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
          // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Storie using the `result` object built from scraping
      db.Topstories.create(result)
        .then(function(dbTopstories) {
          // View the added result in the console
          console.log(dbTopstories);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
  });
});
// Route for getting all Articles from the db
app.get("/topstories", function(req, res) {
  // Grab every document in the Articles collection
  db.Topstories.find({})
    .then(function(dbTopstories) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbTopstories);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/topstories/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Topstories.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbTopstories) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbTopstories);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/topstories/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Topstories.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbTopstories) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbTopstories);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
