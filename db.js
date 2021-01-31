const spicedPg = require("spiced-pg");

var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
); // runs the database on heroku OR locally, similarly to the server in index.js (environment variables basically gives us info about who's running the file)

module.exports.addSigner = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2) RETURNING id`,
        [signature, user_id]
    );
};

module.exports.getNumberSigners = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

module.exports.getSignersList = () => {
    return db.query(
        `SELECT * FROM users JOIN user_profiles ON users.id = user_profiles.user_id`
    );
};

module.exports.getSignersByCity = (city) => {
    return db.query(
        `SELECT users.first, users.last AS users, user_profiles.age, user_profiles.city, user_profiles.url
        AS user_profiles
        FROM signatures 
        JOIN users 
        ON users.id = signatures.user_id
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE LOWER (city) = LOWER($1)`,
        [city]
    );
};

module.exports.getSignature = (id) => {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
        id,
    ]);
};

module.exports.registerUser = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

module.exports.getUserInfo = (email) => {
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
}; // SELECT to get user info by email address (in post /login)

module.exports.checkIfSigned = (id) => {
    return db.query(
        `SELECT signatures.signature FROM signatures JOIN users ON users.id = signatures.user_id
        WHERE users.id = $1`,
        [id]
    );
}; // SELECT from signature to find out if they've signed (post /login)

module.exports.addProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4) RETURNING id`,
        [age, city, url, user_id]
    );
};

module.exports.getDataFromUser = (id) => {
    return db.query(
        `
    SELECT users.first, users.last, users.email AS users, user_profiles.age, user_profiles.city,
    user_profiles.url AS user_profiles
    FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE  user_id = ($1)`,
        [id]
    );
};

module.exports.updateUser = (id, first, last, email, password) => {
    if (password) {
        return db.query(
            `
        INSERT INTO users (id, first, last, email, password)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (users.id)
                DO UPDATE SET first = $1, last = $2, email = $3, password = $4`,
            [first, last, email, password, id]
        );
    } else {
        return db.query(
            `
        INSERT INTO users (id, irst, last, email)
                VALUES ($1, $2, $3)
                ON CONFLICT (users.id)
                DO UPDATE SET first = $1, last = $2, email = $3, password = $4`,
            [first, last, email, id]
        );
    }
};

module.exports.updateProfile = (age, city, url, id) => {
    return db.query(
        `
    INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, id]
    );
};

module.exports.deleteSignature = (id) => {
    return db.query(
        `
    DELETE FROM signatures
    WHERE user_id = ($1)`,
        [id]
    );
};
