const supertest = require("supertest");
const { app } = require("./index");

// this requires the cookie-session MOCK!
const cookieSession = require("cookie-session");

test("GET /register sends 200 status code as response", () => {
    return supertest(app)
        .get("/register")
        .then((res) => {
            // console.log("res: ", res);
            // statusCode, text, headers are the 3 main things we care about in the response
            // (for the most part)
            expect(res.statusCode).toBe(200); // for sanity checking our tests, we can pass something
            //we know is wrong only to see if it fails.
        });
});

test("GET /thanks redirects when I make request without cookies", () => {
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            // 302 is the redirect status code
            // response will include a location header that will tell us where the user's been redirected to
            // console.log("res: ", res);
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("petition");
        });
});

test("GET /thanks sends 200 status code as response when there is a 'userId' cookie, and checks that the correct template runs", () => {
    cookieSession.mockSessionOnce({
        userId: true,
    });
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            // console.log("res: ", res);
            expect(res.statusCode).toBe(200);
        });
}); // THIS TEST DOES NOT WORK, WRITTEN FOR DEMO PURPOSES ONLY

test("POST /welcome sets submitted cookie to true", () => {
    // 1. create an empty cookie that my server can write data to
    const cookie = {}; // empty cookie means empty object since cookies are objects :)
    // any data written to req.session in server will be written to cookie in the test file
    cookieSession.mockSessionOnce(cookie);

    // 2. make request to supertest (as usual)
    return supertest(app)
        .post("/welcome")
        .then((res) => {
            // console.log("cookie: ", cookie); // outputs the real cookie (?)

            expect(cookie).toEqual({
                submitted: true,
            });
            // this would also work:
            // expect(cookie.submitted).toBe(true);
        });
});
