/****************************Dependencies****************************/
// import dependencies you will use
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
//What is this programming construct or structure in js?
//Destructuring an object example in tests.js
const { check, validationResult, header } = require('express-validator');
const { json } = require('body-parser');
//get express session
const session = require('express-session');
const port = process.env.PORT || 8080;

/****************************Database****************************/
//MongoDB
// Takes two arguments path - Includes type of DB, ip with port and name of database
// If awesomestore was not created this would create it through code!!!
mongoose.connect('mongodb://localhost:27017/finalProject',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

/****************************Models****************************/
const Admin = mongoose.model('admin', {
    username: String,
    password: String
});

const Contact = mongoose.model('contact', {
    name: String,
    email: String
});

// set up the model for the pages
const Page = mongoose.model('page', {
    title: String,
    image: String,
    content: String
});

/****************************Variables****************************/
var myApp = express();
myApp.use(express.urlencoded({ extended: false }));
// Setup session to work with app
// secret is a random string to use for the the hashes to save session cookies.
// resave - false prevents really long sessions and security threats from people not logging out.
// saveUninitialized - record a session of a user to see how many users were on your site even if
// they did not login or create any session variables.
myApp.use(session({
    secret: 'superrandomsecret',//Should look more like 4v2j3h4h4b324b24k2b3jk4b24kj32nb4
    resave: false,
    saveUninitialized: true
}));

//res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
// adding a middleware to prevent caching so that admin pages cannot be accessed using back button.
// middlewares are called with every post or get
myApp.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

//parse application json
myApp.use(express.json());
// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));

//use public folder for CSS etc.
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');
myApp.use(fileUpload());


/****************************Page Routes****************************/
//home page which is same as login page
//Write some validations in the post for both username and password
// Sessions variables are used across the web site so that you do not have to pass
// variables from page to page. Session variables can be use to store more than just login information
// and can be used to store all products in a cart for example if the products expanded across
// multiple pages.
myApp.get('/', function (req, res) {
    Page.find({}).exec(function (err, posts) {
        res.render('login', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

myApp.post('/', function (req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    console.log(user)
    console.log(pass)
    Admin.findOne({ username: user, password: pass }).exec(function (err, users) {
        // log any errors
        console.log('Error: ' + err)
        if (users) {
            //store username in session and set logged in true
            req.session.username = users.username;
            req.session.userLoggedIn = true;
            // redirect to the dashboard
            res.redirect('/loggedIn');
        }
        else {
            res.render('login', { error: 'Incorrect Password!' });
        }

    });

});

myApp.get('/loggedIn', function (req, res) {
    res.render('loggedIn', { userLoggedIn: req.session.userLoggedIn }); // no need to add .ejs to the file name
});

// About page
myApp.get('/about', function (req, res) {
    res.render('about', { userLoggedIn: req.session.userLoggedIn }); // no need to add .ejs to the file name
});

// Add page
myApp.get('/addNewPage', function (req, res) {
    res.render('addNewPage', { userLoggedIn: req.session.userLoggedIn });
});

myApp.post('/addNewPage', function (req, res) {

    var title = req.body.title;
    var content = req.body.content;
   // get the name of the file
   var image = req.files.image.name;
   // get the actual file (temporary file)
   var imageFile = req.files.image;
   // decide where to save it (should also check if the file exists and then rename it before saving or employ some logic to come up with unique file names)
   var imagePath = 'public/uploads/' + image;
   // move temp file to the correct folder (public folder)
   imageFile.mv(imagePath, function(err){
     //  console.log(err);
   });
    var myPage = new Page({
        title: title,
        image: image,
        content: content
    })

    myPage.save().then(() => console.log('New page successfully saved'));

    res.redirect('pageAdded');
});

myApp.get('/pageAdded', function (req, res) {
    res.render('pageAdded', { userLoggedIn: req.session.userLoggedIn });
});

//list all pages
myApp.get('/viewAllPages', function (req, res) {
    // check if the user is logged in
    console.log(req.session.username);
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, posts) {
            res.render('viewAllPages', { posts: posts, userLoggedIn: req.session.userLoggedIn });
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});

//Edit page: edit page
//Use uniques mongodb id
myApp.get('/edit/:pageid', function (req, res) {
    if (req.session.userLoggedIn) {
        var pageId = req.params.pageid;
        console.log(pageId);

        Page.findOne({ _id: pageId }).exec(function (err, page) {
            console.log('Error: ' + err);
            console.log('Page: ' + page);
            if (page) {
                res.render('edit', { page: page, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No page found with that id...');
            }
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});

myApp.post('/edit/:pageid', function (req, res) {

    //console.log(errors); // check what is the structure of errors
    var pageId = req.params.pageid;
    var title = req.body.title;
    var content = req.body.content;
    // get the name of the file
   var image = req.files.image.name;
   // get the actual file (temporary file)
   var imageFile = req.files.image;
   // decide where to save it (should also check if the file exists and then rename it before saving or employ some logic to come up with unique file names)
   var imagePath = 'public/uploads/' + image;
   // move temp file to the correct folder (public folder)
   imageFile.mv(imagePath, function(err){
       console.log(err);
   });

    Page.findOne({ _id: pageId }).exec(function (err, page) {
       // console.log('Error: ' + err);
        console.log('Page: ' + page);

        page.title = title;
        page.image = image;
        page.content = content;
        page.save();

    });

    res.redirect('/pageEdited');

});

myApp.get('/pageEdited', function (req, res) {
    res.render('pageEdited', { userLoggedIn: req.session.userLoggedIn });
});

myApp.get('/views/:id', function (req, res) {
    Page.findOne({ _id: req.params.id }).exec(function (err, page) {
        console.log('Error: ' + err);
        console.log('Page: ' + page);
        if (page) {
            Page.find({}).exec(function (err, posts) {
                res.render('views', { posts: posts,page: page, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            });
        }
        else {
            //This will be displayed if the user is trying to change the page id in the url
            res.send('No page found with that id...');
        }
    });});

//Delete page
//Use unique mongodb id
myApp.get('/delete/:pageid', function (req, res) {

    var pageId = req.params.pageid;
    console.log(pageId);
    Page.findByIdAndDelete({ _id: pageId }).exec(function (err, page) {
        if (page) {
            res.render('delete', { message: 'Successfully deleted', userLoggedIn: req.session.userLoggedIn });
        }
        else {
            res.render('delete', { message: 'Sorry, could not delete', userLoggedIn: req.session.userLoggedIn });
        }
    });

});

//Logout Page
myApp.get('/logout', function (req, res) {
    //Remove variables from session
    req.session.username = '';
    req.session.userLoggedIn = false;
    req.session.destroy;

    res.redirect('/')
    //res.render('login', {error: "Logged Out"});
});

myApp.post('/logout', function (req, res) {
    res.redirect('login');
});

//Contact Page
myApp.get('/contactUs', function (req, res) {
    res.render('contactUs', { userLoggedIn: req.session.userLoggedIn });
});

myApp.post('/contactUs', [
    check('name', 'Must have a name').not().isEmpty(),
    check('email', 'Must have an email').isEmail(),
],
    function (req, res) {
        const errors = validationResult(req);
        console.log(req.body);
        if (!errors.isEmpty()) {
            res.render('contactUs', {
                errors: errors.array()
            });
        }
        else {
            var name = req.body.name;
            var email = req.body.email;
            var myNewContact = new Contact(
                {
                    name: name,
                    email: email
                }
            )
            myNewContact.save().then(() => console.log('New contact saved'));

            res.render('contactUsSuccess', {
                name: name,
                email: email
            });
        }
    }
);

// start the server and listen at a port
myApp.listen(port);

//tell everything was ok
console.log('Everything executed fine.. website at port 8080....');