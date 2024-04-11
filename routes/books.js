const express = require("express");
const router = new express.Router();

const { validate } = require("jsonschema");
const bookSchemaNew = require("../schemas/bookSchemaNew");
const bookSchemaUpdate = require("../schemas/bookSchemaUpdate");

const Book = require("../models/book");

const db = require("../db");

/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
	try {
		const result = await db.query("SELECT * FROM books");
		return res.json({ books: result.rows });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  => {book: book} */

router.get("/:isbn", async function (req, res, next) {
	try {
		const result = await db.query("SELECT * FROM books WHERE isbn = $1", [
			req.params.isbn,
		]);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Book not found" });
		}
		return res.json({ book: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
	try {
		const validation = validate(req.body, bookSchemaNew);
		if (!validation.valid) {
			return next({
				status: 400,
				errors: validation.errors.map((e) => e.stack),
			});
		}
		const book = await db.query(
			"INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3) RETURNING *",
			[req.body.title, req.body.author, req.body.isbn]
		);
		return res.status(201).json({ book: book.rows[0] });
	} catch (err) {
		console.error(err); // Log the error
		return next(err);
	}
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
	try {
		if ("isbn" in req.body) {
			return next({
				status: 400,
				message: "Not allowed",
			});
		}
		const validation = validate(req.body, bookSchemaUpdate);
		if (!validation.valid) {
			return next({
				status: 400,
				errors: validation.errors.map((e) => e.stack),
			});
		}
		const book = await db.query(
			"UPDATE books SET title = $1, author = $2 WHERE isbn = $3 RETURNING *",
			[req.body.title, req.body.author, req.params.isbn]
		);
		if (book.rows.length === 0) {
			return res.status(404).json({ error: "Book not found" });
		}
		return res.status(200).json({ book: book.rows[0] }); // Ensure the updated book is returned in the response
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
	try {
		const result = await db.query(
			"DELETE FROM books WHERE isbn = $1 RETURNING isbn",
			[req.params.isbn]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Book not found" });
		}

		return res.status(200).json({ message: "Book deleted" });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
