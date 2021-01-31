const express = require("express");
const hb = require("express-handlebars");
const app = express();
exports.app = app;
const db = require("./db");
var cookieSession = require("cookie-session");
const csurf = require("csurf");
// const helmet = require("helmet");
const { hash, compare } = require("./bc");

///////////  HANDLEBARS BOILERPLATE ///////////
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
///////////////////////////////////////////////

//////////////// HANDLING COOKIES /////////////

let sessionSecret;
if (process.env.PORT) {
    // this will run if the project runs on heroku
    sessionSecret = process.env;
} else {
    // else will run locally
    sessionSecret = require("./secrets.json");
}

app.use(
    cookieSession({
        secret: sessionSecret.secret, // comes from the secrets.json file
        maxAge: 1000 * 60 * 60 * 24 * 14, // means the session will hold up for 2 weeks in total
    })
);

/////////////////////////////////////////////

/////////// SERVING STATIC FILES /////////////
app.use(express.static("./public"));
//////////////////////////////////////////////

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use((req, res, next) => {
    console.log("req.url: ", req.url);
    // console.log("req.session: ", req.session);
    next();
});

/////////////////// Protecting Against CSRF attacks //////////////////////
app.use(csurf());

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});
//////////////////////////////////////////////////////////////////////////

app.get("/blue", (req, res) => {
    res.redirect("/register");
});

app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("registration", {
        layout: "main",
    });
});

app.get("/profile", (req, res) => {
    if (req.session.userId) {
        res.render("addprofile", {
            layout: "main",
        });
    } else {
        res.redirect("register");
    }
});

app.get("/profile/edit", (req, res) => {
    if (req.session.userId) {
        res.render("editprofile");
    } else {
        res.redirect("/register");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/petition", (req, res) => {
    // renders petition template
    // redirect to 'thanks' route if user already signed

    if (req.session.userId && req.session.sigId) {
        res.redirect("/thanks");
    } else if (req.session.userId && !req.session.sigId) {
        res.render("petition", {
            layout: "main",
        });
    } else {
        res.redirect("/register");
    }
});

app.get("/thanks", (req, res) => {
    // check for cookie
    // if cookie, render thanks template
    // if there's no cookie, redirect user to /petition route

    // console.log(
    //     "req.session.userId in GET /thanks route: ",
    //     req.session.userId
    // );

    // console.log("req.body on GET /thanks route: ", req.body);

    if (req.session.signatureId) {
        Promise.all([
            db.getNumberSigners(),
            db.getSignature(req.session.userId),
        ])
            .then((response) => {
                console.log("response: ", response);
                // console.log("response.rows: ", response.rows);

                let count = response[0].rows[0].count;
                let sigImg = response[1].rows[0].signature;
                // console.log(sigImg);

                res.render("thanks", {
                    layout: "main",
                    count,
                    sigImg,
                });
            })
            .catch((err) => {
                console.log("err: ", err);
            });
    } else {
        res.redirect(302, "login");
    }
});

app.get("/signers", (req, res) => {
    // render signers template
    // check for cookie
    // if there's no cookie, redirect user to /petition route
    // if there's a cookie, retrieve list of signers form database and pass them to the signers template

    if (!req.session.userId) {
        res.redirect("/register");
    } else {
        db.getSignersList()
            .then((response) => {
                console.log("response from getSignersList query: ", response);

                return response.rows;
            })
            .then((signersNames) => {
                res.render("signers", {
                    layout: "main",
                    signers: signersNames,
                });
            });
    }
});

app.get("/signers/:city", (req, res) => {
    // console.log("res in GET /signers/:city route: ", res);
    // console.log("req.params in GET /signers/:city route: ", req.params);

    let city = req.params.city;
    console.log("city: ", city);

    db.getSignersByCity(city)
        .then((response) => {
            // console.log("city: ", city);
            console.log("response after getSignersByCity: ", response);

            res.render("city", {
                layout: "main",
                signers: response.rows,
                city,
            });
        })
        .catch((err) => {
            console.log("error in getSignersByCity query: ", err);
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

////////////////////// POST ROUTES ///////////////////////////

app.post("/petition", (req, res) => {
    // runs when user clicks submit button

    // console.log("req.body: ", req.body);

    let signature = req.body.canvasValue;
    // console.log("signature: ", signature);
    let user_id = req.session.userId;
    // console.log("user_id: ", user_id);

    // insert all data submitted to database
    db.addSigner(signature, user_id)
        .then((response) => {
            // if no error, set a cookie and redirect to thanks route

            // console.log("response: ", response);
            req.session.signatureId = response.rows[0].id;
            console.log(
                "req.session.userId in add signer: ",
                req.session.userId
            );

            // console.log("req.session.signatureId: ", req.session.signatureId);
            res.redirect("thanks");
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("petition", {
                layot: "main",
                // if there's an error, re-render petition template with error msg
            });
        });
});

app.post("/thanks/delete", (req, res) => {
    // console.log("req.session in the post delete route: ", req.session);
    // console.log("req.body in the post delete route: ", req.body);

    console.log("req.session.userId: ", req.session.userId);

    db.deleteSignature(req.session.userId)
        .then((response) => {
            console.log("response after deletSignature query: ", response);

            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in the deleteSignature query: ", err);
        });
});

app.post("/register", (req, res) => {
    let firstName = req.body.first;
    // console.log("firstName: ", firstName);
    let lastName = req.body.last;
    // console.log("lastName: ", lastName);
    let email = req.body.email;
    // console.log("email: ", email);
    let password = req.body.password;
    // console.log("password: ", password);

    hash(password)
        .then((hashedPw) => {
            // console.log("hashedPw: ", hashedPw);
            password = hashedPw;

            db.registerUser(firstName, lastName, email, hashedPw).then(
                (result) => {
                    console.log("result: ", result);
                    req.session.userId = result.rows[0].id;
                    console.log(
                        "req.session.userId in post register",
                        req.session.userId
                    );

                    res.redirect("profile");
                }
            );
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("registration", {
                layout: "main",
                // render error template also
            });
        });
});

app.post("/profile", (req, res) => {
    // console.log("req.body in post /profile: ", req.body);

    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;
    let user_id = req.session.userId;
    console.log("user_id: ", user_id);

    if (url.startsWith("http://") || url.startsWith("https://") || !url) {
        db.addProfile(age, city, url, user_id)
            .then((response) => {
                // console.log("response in addProfile query: ", response);
                // console.log("req.body in addProfile query: ", req.body);

                user_id = response.rows[0].id;

                res.redirect("petition");
            })
            .catch((err) => {
                console.log("err: ", err);
            });
    } else {
        res.render("addprofile", {
            layout: "main",
            // render message saying the website should start with http:// or https://
        });
    }
});

app.post("/profile/edit", (req, res) => {
    // console.log("req.body in the post profile edit: ", req.body);

    let { first, last, email, password, age, city, url } = req.body;
    let id = req.session.userId;

    hash(password)
        .then((hashedPw) => {
            password = hashedPw;

            Promise.all([
                db.updateUser(first, last, email, password, id),
                db.updateProfile(age, city, url, id),
            ]);
        })
        .then(() => {
            if (req.session.signatureId) {
                res.redirect("/thanks");
            } else {
                res.redirect("/petition");
            }
        })
        .catch((err) => {
            console.log("error in post /profile/edit: ", err);
        });
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    // console.log("email: ", email);
    // console.log("password: ", password);
    // console.log("req.session.signatureId", req.session.userId);

    db.getUserInfo(email)
        .then((response) => {
            // console.log("response in post /login route: ", response);
            // console.log("response.rows[0].password: ", response.rows[0].password);

            let dbPassword = response.rows[0].password;

            compare(password, dbPassword)
                .then((match) => {
                    // console.log("match from compare: ", match); // came back true
                    if (match == true) {
                        // console.log("yay!");
                        // console.log("response after the passwords match: ", response);

                        // console.log("req.session: ", req.session);
                        req.session.userId = response.rows[0].id;
                        // console.log("req.session.userId: ", req.session.userId);

                        db.checkIfSigned(req.session.userId)
                            .then((response) => {
                                console.log(
                                    "response checking if user signed: ",
                                    response
                                );

                                if (req.session.userId) {
                                    req.session.signatureId =
                                        req.session.userId;
                                    // console.log(
                                    //     "req.session.sigId: ",
                                    //     req.session.sigId
                                    // );
                                    res.redirect("thanks");
                                }
                            })
                            .catch((err) => {
                                console.log("err: ", err);

                                res.redirect("petition");
                            });
                    }
                })
                .catch((err) => {
                    console.log("err: ", err);

                    res.render("login", {
                        layout: "main",
                        // render also render message
                    });
                });
        })
        .catch((err) => {
            console.log("err: ", err);

            res.render("login", {
                layout: "main",
                // also render error message
            });
        });
});

/////////////////////////////////////////////////////////////

// this checks to see what is running index.js and if it's supertest it skips app.listen
// and does not turn on the server
if (require.main === module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("petition server is listening...")
    ); // our server runs both on heroku and locally
}
