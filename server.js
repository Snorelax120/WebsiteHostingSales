'use strict';
const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const seq = require("sequelize");
const flash = require('connect-flash');
var app = express();
const path = require("path");
const e = require("connect-flash");
var bcrypt = require('bcryptjs');
const upload = require("./middleware/uploadImg");
app.use(express.static('static'));
app.use('/uploads', express.static('uploads'));
const securePassword = async (password) => await bcrypt.hash(password,12)
app.use(cookieParser());
app.use(session({secret: "98avasdsx+98aeajk3la0-98a_adfuy832"}));

app.use(flash());


var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.set('views',path.join(__dirname,"views"))
app.set("view engine","hbs")


const sequelize_obj = new seq(
    "my_db", //database name
    "postgres", //username
    "admin123", //password
    {
        host: "127.0.0.1",
        dialect: "postgres",
        port: 5432,
    }
);
const customers = sequelize_obj.define(
    "customers", {
    customerID: {
        type: seq.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstname: {
        type: seq.STRING,
        allowNull: false,
    },
    lastname: {
        type: seq.STRING,
    },
    usertype: {
        type: seq.STRING,
        allowNull: false,
    },
    username: {
        type: seq.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: seq.INTEGER,
        allowNull: false
    },
    email: {
        type: seq.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: seq.STRING,
        allowNull: false
    },
    cart: {
        type: seq.INTEGER,
        allowNull: true,
    }
}, {
    createdAt: false,
    updatedAt: false
}
);

const packages = sequelize_obj.define(
    "packages", {
    packageID: {
        type: seq.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: seq.STRING,
        allowNull: false,
    },
    websites: {
        type: seq.STRING,
        allowNull: false,
    },
    poweredby: {
        type: seq.STRING,
        allowNull: false,
    },
    enterprise_email: {
        type: seq.STRING,
        allowNull: false
    },
    hosting_features: {
        type: seq.STRING,
        allowNull: false,
    },
     site_migration: {
        type: seq.STRING,
        allowNull: false,
    },
     features: {
        type: seq.STRING,
        allowNull: false,
    },
     domain: {
        type: seq.STRING,
        allowNull: false,
    },
     price: {
        type: seq.INTEGER,
        allowNull: false,
    },
     email_marketing: {
        type: seq.STRING,
        allowNull: false,
    },
    ssl: {
        type: seq.STRING,
        allowNull: false,
    },
    dedicated_ip: {
        type: seq.STRING,
        allowNull: false,
    },
    image_path: {
        type: seq.STRING,
        allowNull: false,
    },
}, {
    createdAt: false,
    updatedAt: false
}
);

sequelize_obj.sync().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port);
});



app.get("/", function(req, res) {
    res.render('index',{ layout: false });
});

app.get("/plans", async function(req, res) {
    try{
        await packages.findAll({}).then(function(packages) {
        if(req.session.usertype === 'admin'){
            res.render('editplans',{ all_plans: packages });
        }
        else{
                res.render('plans',{ all_plans: packages });
        }
          
      });
    }
    catch(err) {
        res.json({ msg: err});
    }
});


app.get("/login", function(req, res) {
     if(!req.session.username){
        res.render('login',{ layout: false })
            }
    else{
        if(req.session.type === 'admin'){
            res.redirect('/admin-dashboard');
        }
        if(req.session.type === 'simpleuser'){
            res.redirect('/dashboard');
        }  
    }
});

app.post("/login", urlencodedParser, async function(req, res) {
    const format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
    let username = req.body.username;
    let password = req.body.password
    if(username !== 0 && password !== 0){
        if(format.test(username)){
            res.render('login',{send_back:'username contains special characters',username:username,password:password})
        }
        else{
            await customers.findOne({
                where: seq.and(
                    {username: username}
                  ),
                attributes: ['customerID','usertype','username','firstname','lastname','email','password']
              }).then(async function(user) {
                if(user !== null)
                {
                    const isCorrect =  await bcrypt.compare(password,user.dataValues.password)
                    if(isCorrect){
                        if(user.dataValues.usertype === 'admin'){
                            req.session.username = user.dataValues.username
                            req.session.firstname = user.dataValues.firstname
                            req.session.lastname = user.dataValues.lastname
                            req.session.email = user.dataValues.email
                            req.session.usertype = user.dataValues.usertype
                            res.redirect('/admin-dashboard');
                        }
                        else{
                            req.session.username = user.dataValues.username
                            req.session.firstname = user.dataValues.firstname
                            req.session.lastname = user.dataValues.lastname
                            req.session.email = user.dataValues.email
                            req.session.usertype = user.dataValues.usertype
                            res.redirect('/dashboard');
                        }
                    }
                    else{
                    res.status(200).render('login',{send_back:'Sorry, you entered the wrong email or password'})
                }
                }
                else{
                    res.status(200).render('login',{send_back:'Sorry, you entered the wrong email or password'})
                }
            })
        }
    }
    else{
        res.status(200).render('login',{send_back:'Something Went Wrong /  Check all required fields'})
    }
});


app.get("/register", function(req, res) {
    if(!req.session.username){
        res.render('register',{ layout: false })
            }
    else{
        res.redirect('/dashboard');
    }
});

app.post("/register",urlencodedParser, async function (req, res) {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let username = req.body.username;
    let phone = req.body.phonenumber;
    let type = 'simpleuser';
    let email = req.body.email;
    let password = await securePassword(req.body.password);

    await customers.findOne({
        where: seq.or(
            {username: username}, {email: email}
          ),
        attributes: ['customerID']
      }).then(function(user) {
          console.log(user)
        if(user !== null)
        {
            res.status(200).render('register',{send_back:'Username and Email Should be Unique'})
        }
        else{
            try{
                customers.create({
                    firstname:firstname,
                    lastname: lastname,
                    username: username,
                    phone: phone,
                    email: email,
                    usertype: type,
                    password: password
                }).then((obj) => {
                    console.log(obj)
                    req.session.username =  obj.dataValues.username
                    req.session.firstname = obj.dataValues.firstname
                    req.session.lastname = obj.dataValues.lastname
                    req.session.email = obj.dataValues.email
                    req.session.usertype = user.dataValues.usertype
                    if(obj.dataValues.usertype == 'admin'){
                        res.status(301).redirect('/admin-dashboard')
                    }
                    else{
                        res.status(301).redirect('/dashboard')
                    }
                    
                });
            }
            catch (error)
            {
                res.status(403)
                res.send({send_back: error});
            }
        }
        })
});


app.get("/dashboard", function(req, res) {
     if(req.session.username){
         if(req.session.usertype === "simpleuser"){
             res.render('dashboard',{username:req.session.username,firstname:req.session.firstname,lastname:req.session.lastname,email:req.session.email})
         }
        else if(req.session.usertype === "admin"){
             res.redirect('/admin-dashboard')
         }
         }
    else {
             res.redirect('/login');
    }
});

app.get("/admin-dashboard", function(req, res) {
     if(req.session.username){
         if(req.session.usertype === "admin"){
             res.render('admindashboard',{username:req.session.username,fullname:req.session.fullname,email:req.session.email})
         }
        else if(req.session.usertype === "simpleuser"){
             res.redirect('/dashboard')
         }
         }
    else {
             res.redirect('/login');
    }
});



app.get("/add-package", function (req, res) {
    if(req.session.username){
        if(req.session.usertype === 'admin'){
            res.render('addpackage',{ layout: false })
        }
        else{
            res.redirect('/dashboard');
        }
    }
    else{
        res.redirect('/login');
    }
});

app.post('/add-package', upload.single('image'), async function (req, res) {
    function boolconvert(element){
        if(element == '0') return false
        else return true
    }
    let name = req.body.name
    let websites = req.body.websites
    let poweredby = req.body.poweredby
    let enterprise_email = boolconvert(req.body.enterprise_email)
    let hosting_features = boolconvert(req.body.hosting_features)
    let site_migration = boolconvert(req.body.site_migration)
    let features = req.body.features
    let domain = req.body.domain
    let price = req.body.price
    let email_marketing = req.body.email_marketing
    let ssl  = boolconvert(req.body.ssl)
    let dedicated_ip = boolconvert(req.body.dedicated_ip)
    let image_path = req.file.filename
    try{
        packages.create({
        "name": name,
        "websites": websites,
        "poweredby": poweredby,
        "enterprise_email": enterprise_email,
        "hosting_features": hosting_features,
        "site_migration": site_migration,
        "features" : features,
        "domain": domain,
        "price":price,
        "email_marketing":email_marketing,
        "ssl":ssl,
        "dedicated_ip":dedicated_ip,
        "image_path":image_path
        }).then((obj) => {
            console.log(obj)
        });
        res.render("addpackage", { layout: false });
    } 
    catch{(err) =>
        {
            console.log(err)
            res.sendDate(err)
        }
    }
});





app.get('/edit-package/:id',async function(req, res){
    if(!req.session.username){
        res.redirect('/login')
            }
    else{
        if(req.session.usertype !== 'admin'){
            res.redirect('/dashboard')
        }
        else{
 await packages.findOne({
                where: {packageID: req.params.id}
              }).then((pack) => res.render('addpackage',{package:pack.dataValues}))
    }
    }
});

app.post('/edit-package/:id',upload.single('image'),async function(req, res){
    console.log(req.body.name)
    if(req.session.username){
        if(req.session.usertype == 'admin'){
    function boolconvert(element){
        if(element == '0') return false
        else return true
    }
    let name = req.body.name
    let websites = req.body.websites
    let poweredby = req.body.poweredby
    let enterprise_email = boolconvert(req.body.enterprise_email)
    let hosting_features = boolconvert(req.body.hosting_features)
    let site_migration = boolconvert(req.body.site_migration)
    let features = req.body.features
    let domain = req.body.domain
    let price = req.body.price
    let email_marketing = req.body.email_marketing
    let ssl  = boolconvert(req.body.ssl)
    let dedicated_ip = boolconvert(req.body.dedicated_ip)
    let image_path = req.file.filename
    try{
        packages.update({
        "name": name,
        "websites": websites,
        "poweredby": poweredby,
        "enterprise_email": enterprise_email,
        "hosting_features": hosting_features,
        "site_migration": site_migration,
        "features" : features,
        "domain": domain,
        "price":price,
        "email_marketing":email_marketing,
        "ssl":ssl,
        "dedicated_ip":dedicated_ip,
        "image_path":image_path
        },{ where: { id: req.params.id}}).then((obj) => {
            console.log(obj)
        });
        res.render("addpackage", { layout: false });
    } 
    catch{(err) =>
        {
            console.log(err)
            res.sendDate(err)
        }
    }
     }
    else{
        res.redirect('/admin-dashboard');
    }
    }
    else{
         res.redirect('/login');
     } 
});


app.get('/cartx/:id',async function(req, res){
      if(!req.session.username){
        res.redirect('/login')
            }
    else{
         await customers.findOne({
                where: seq.and(
                    {username: req.session.username}
                  ),
                attributes: ['cart']
              }).then((customer) =>{
                                packages.findOne({
                    where: {
                        packageID: customer.cart
                    }
                }).then((cartpackages) => {
                    var one_month = ((cartpackages.dataValues.price)/12)+10
                    var twelve_month = (cartpackages.dataValues.price)/12+3
                    var twenty_four = (cartpackages.dataValues.price)/12
                    var thirty_six = (cartpackages.dataValues.price)/12 - 3
                    if(req.params.id == 1){
                        var cart = {
                        name:cartpackages.dataValues.name,
                        price:one_month,
                        totalprice:(one_month * 1)+29.89+9.99,
                        };
                    }
                    if(req.params.id == 12){
                        var cart = {
                        name:cartpackages.dataValues.name,
                        price:twelve_month*12,
                        totalprice:(twelve_month*12)+29.89+9.99,
                        };
                    }
                    if(req.params.id == 24){
                        var cart = {
                        name:cartpackages.dataValues.name,
                        price:twenty_four*24,
                        totalprice:(twenty_four*24)+29.89+9.99,
                        };
                    }
                    if(req.params.id == 36){
                        var cart = {
                        name:cartpackages.dataValues.name,
                        price:thirty_six*36,
                        totalprice:(thirty_six*36)+29.89+9.99,
                        };
                    }
                    res.json({cart:cart,onemonth:one_month,twelvemonth:twelve_month,twentyfour:twenty_four,thirtysix:thirty_six,selectedmonth:req.params.id})
                })
           })
    }
});

app.get('/cart',async function(req, res){
      if(!req.session.username){
        res.redirect('/login')
            }
    else{
         res.render('cart')
    }
 });



 app.get('/logout', function(req, res){
    req.session.destroy()
    res.redirect('/login');
 });

 app.get('/add-to-cart/:id', function(req, res){
      if(!req.session.username){
        res.redirect('/login')
     }
     else{
    customers.update(
         {cart: req.params.id},
         {where: {username: req.session.username}}
     ).then((customer) => {
    res.redirect('/cart')
     })
    }
});

app.get('/checkout', function(req, res){
    customers.update(
     {cart: 0},
     {where: {username: req.session.username}}
    ).then(() => {
    if(req.session.usertype === 'admin'){
        res.redirect('/admin-dashboard');
    }
    else{
        res.redirect('/dashboard');
    }
    })
});



app.use(function (req, res) {
    res.status(404).render("pageNotFound");
});

app.listen(HTTP_PORT);