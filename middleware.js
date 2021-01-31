// app.use((req.res, next) => {
//     if (!req.session.userId && req.url != "/login" && req.url != "/register") {
//         res.redirect("/register");
//     } else {
//         next();
//     }
// });

// app.use('/funkychicken', (req,res) => {

// }); // this makes the middleware run only for req.url = '/funkychicken

// app.get('/register', (req, res, next) => {
//     if(req.session.userId) {
//         res.redirect('/petition');
//     }
//     next();
// }, (req,res) => {
//     res.sendStatus(200);
// });

// OR:

// const requireLoggedOutUser = (req, res, next) => {
//     if (req.session.userId) {
//         res.redirect("/petition");
//     } else {
//         next();
//     }
// };

// AND THEN USE IT LIKE THIS:

// app.get('/register', requireLoggedOutUser, (req, res, next) => {
//     res.sendStatus(200);
// });

// a good way to avoid index.js of being gigantic and hard to read is to store in another file like
// "middleware.js" and then export to index.js
