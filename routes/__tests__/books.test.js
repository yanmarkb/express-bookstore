process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

let book_isbn;

beforeEach(async () => {
	const result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
    VALUES('123432122', 'https://amazon.com/taco', 'Elie', 'English', 100, 'Nothing publishers', 'my first book', 2008) 
    RETURNING isbn`);
	book_isbn = result.rows[0].isbn;
});

afterEach(async () => {
	await db.query("DELETE FROM books");
});

afterAll(async () => {
	await db.end();
});

describe("GET /books", () => {
	test("Gets a list of 1 book", async () => {
		const res = await request(app).get("/books");
		expect(res.body.books).toHaveLength(1);
		expect(res.body.books[0]).toHaveProperty("isbn");
		expect(res.body.books[0]).toHaveProperty("amazon_url");
	});
});

describe("GET /books/:isbn", () => {
	test("Gets a single book", async () => {
		const res = await request(app).get(`/books/${book_isbn}`);
		expect(res.body.book).toHaveProperty("isbn");
		expect(res.body.book.isbn).toBe(book_isbn);
	});

	test("Responds with 404 if can't find book in question", async () => {
		const res = await request(app).get(`/books/999`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /books", () => {
	test("Creates a new book", async function () {
		const res = await request(app).post(`/books`).send({
			isbn: "32794782",
			amazon_url: "http://www.amazon.com/Test/dp/32794782",
			author: "Test",
			language: "English",
			pages: 200,
			publisher: "Test Publisher",
			title: "Test",
			year: 2000,
		});
		expect(res.statusCode).toBe(201);
		expect(res.body.book).toHaveProperty("isbn");
	});

	test("Prevents creating book without required title", async () => {
		const res = await request(app).post("/books").send({ year: 2000 });
		expect(res.statusCode).toBe(400);
	});
});

describe("PUT /books/:isbn", () => {
	test("Updates a single book", async () => {
		const res = await request(app).put(`/books/${book_isbn}`).send({
			amazon_url: "https://taco.com",
			author: "mctest",
			language: "english",
			pages: 1000,
			publisher: "yeah right",
			title: "UPDATED BOOK",
			year: 2000,
		});
		expect(res.body.book).toHaveProperty("isbn");
		expect(res.body.book.title).toBe("UPDATED BOOK");
	});

	test("Prevents a bad book update", async () => {
		const res = await request(app).put(`/books/${book_isbn}`).send({
			isbn: "32794782",
			badField: "DO NOT ADD ME!",
			amazon_url: "https://taco.com",
			author: "mctest",
			language: "english",
			pages: 1000,
			publisher: "yeah right",
			title: "UPDATED BOOK",
			year: 2000,
		});
		expect(res.statusCode).toBe(400);
	});

	test("Responds 404 if can't find book in question", async () => {
		await request(app).delete(`/books/${book_isbn}`);
		const res = await request(app).delete(`/books/${book_isbn}`);
		expect(res.statusCode).toBe(404);
	});
});

describe("DELETE /books/:isbn", () => {
	test("Deletes a single a book", async () => {
		const res = await request(app).delete(`/books/${book_isbn}`);
		expect(res.body).toEqual({ message: "Book deleted" });
	});
});
