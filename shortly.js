var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');



var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  // genid: function(req) {
  //   return genuuid() // use UUIDs for session IDs
  // },
  secret: 'keyboard cat'
}))


app.get('/',
function(req, res) {
  res.render('index');
});

app.get('/create',
function(req, res) {
  res.render('index');
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          console.log('Links', Links);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res){
  var test = req.session;
  console.log(test);
  res.render('login');
});

app.post('/login', function(req, response){
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(found){
    if( found ){
      bcrypt.hash(password, found.attributes.salt, null, function(err, res) {
        if (err) {
          console.log(err);
        } else {
          if( found.attributes.hash === res ){
            req.session.regenerate(function(){
            req.session.username = username;
            response.redirect('index');
          });
          }else{
            console.log('Invalid password');
            response.redirect('login');
          }
      }
    })
      // console.log("Successful login",found.attributes.salt);
    } else {
      console.log('Invalid username');
      response.redirect('login');
    }

  // if(username === 'demo' && password == 'demo'){
  //   // req.session.regenerate(function(){
  //   // req.session.user = username;
  //   res.redirect('index');
  // }else{
  //  res.redirect('login');
  // }
  })
});

app.get('/signup', function(req, res){
  res.render('signup')
});

app.post('/signup', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(found){

  if (found) {
    res.send(200, found.attributes);
  } else {
    var incomingUser = new User({ username: username });
    incomingUser.encrypt(password, function(){
      incomingUser.save().then(function(newUser) {
        Users.add(newUser);
        res.send(200, newUser);
      });});
  //   util.getUrlTitle(uri, function(err, title) {
  //     if (err) {
  //       console.log('Error reading URL heading: ', err);
  //       return res.send(404);
  //     }

  //     var link = new Link({
  //       url: uri,
  //       title: title,
  //       base_url: req.headers.origin
  //     });

  //     incomingUser.save().then(function(newUser) {
  //       console.log('newUser', newUser);
  //       Users.add(newUser);
  //       console.log('users', Users);
  //       res.send(200, newUser);
  //     });
  // //   });
  // }
//});
}
})

  // })
  res.redirect('login');
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
