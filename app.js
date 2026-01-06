//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const fs = require('fs').promises;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique.";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connecting to database
async function readConfig() {
    try {
      const data = await fs.readFile('./config/DatabaseConnectionConfiguration.json', 'utf8');
      const jsonData = JSON.parse(data);
      const cfg = jsonData.filter(data => data.Datasource == "SUPPORTTOOLMONGODB")[0]
      const userpass = cfg.User != '' ? `${cfg.User}:${cfg.Password}@` : ''
      return `${cfg.Protocol}://${userpass}${cfg.Host}:${cfg.Port}/${cfg.Database}?authSource=admin`
    } catch (err) {
      console.log("Error reading DatabaseConnectionConfiguration.json:", err);
      return null
    }
}
main().catch(err => console.log("MongoDB connection error:", err));
async function main() {
  await mongoose.connect(process.env.MONGO_URI || (await readConfig()) || 'mongodb://127.0.0.1:27017/blogDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

// Post schema and model
const postSchema = new mongoose.Schema({
  title: String,
  content: String
});

const Post = mongoose.model("Post", postSchema);

// Routes
app.get("/", function (req, res) {
  Post.find().then(posts => {
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
    });
  }).catch(err => {
    console.log(err);
    res.status(500).send("Internal Server Error");
  });
});

app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent });
});

app.get("/compose", function (req, res) {
  res.render("compose");
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  post.save()
    .then(() => {
      console.log('Post added to DB.');
      res.redirect('/');
    })
    .catch(err => {
      res.status(400).send("Unable to save post to database.");
    });
});

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findOne({ _id: requestedPostId })
    .then(function (post) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    })
    .catch(function (err) {
      console.log(err);
      res.status(404).send("Not Found");
    });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});

