/** Common config for bookstore. */

let DB_URI = `postgresql://localhost:5434/books`;

if (process.env.NODE_ENV === "test") {
	DB_URI = `postgresql://localhost:5434/books_test`;
} else {
	DB_URI = process.env.DATABASE_URL || DB_URI;
}

module.exports = { DB_URI };
