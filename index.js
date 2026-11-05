import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import verifyToken from "./middlewares/verifyToken.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  await client.connect();
  console.log("MongoDB connected successfully");

  return client.db("booknook");
}

const db = await connectDB();

const booksCollection = db.collection("books");
const borrowsCollection = db.collection("borrows");

// Prevent duplicate borrowing of the same book by the same user
await borrowsCollection.createIndex(
  { bookId: 1, userEmail: 1 },
  { unique: true },
);

// Check MongoDB ObjectId
const isValidId = (id) => ObjectId.isValid(id);

// Server Check
app.get("/", (req, res) => {
  res.send("BookNook Server is Running");
});

// Middleware for user books filter on public books route
const verifyUserBooks = (req, res, next) => {
  if (req.query.email) {
    return verifyToken(req, res, () => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({
          message: "Forbidden: You can only view your own books",
        });
      }
      next();
    });
  }
  next();
};

// 1. Get Books (Public list / Authenticated for user's books)
app.get("/books", verifyUserBooks, async (req, res) => {
  try {
    const { email, category, search, sort, limit } = req.query;

    const filter = {};

    if (email) {
      filter.userEmail = req.user ? req.user.email : email;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    // Search by book title only
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.title = {
        $regex: safeSearch,
        $options: "i",
      };
    }

    let result = booksCollection.find(filter);

    if (sort === "newest") {
      result = result.sort({ addedDate: -1 });
    }

    if (limit !== undefined) {
      const numberLimit = Number(limit);

      if (!Number.isInteger(numberLimit) || numberLimit < 1) {
        return res.status(400).send({
          message: "Invalid limit value",
        });
      }

      result = result.limit(numberLimit);
    }

    const books = await result.toArray();

    res.send(books);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to get books",
    });
  }
});

// 2. Get Single Book Details (Public)
app.get("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidId(id)) {
      return res.status(400).send({
        message: "Invalid book ID",
      });
    }

    const book = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).send({
        message: "Book not found",
      });
    }

    res.send(book);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to get book details",
    });
  }
});

// 3. Add New Book (Protected)
app.post("/books", verifyToken, async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      image,
      description,
      copies,
      userName,
    } = req.body;

    // Use verified JWT email to enforce identity
    const userEmail = req.user.email;
    const finalUserName = req.user.name || userName || "Community Member";
    const totalCopies = Number(copies);

    if (
      !title ||
      !author ||
      !category ||
      !image ||
      !description ||
      !Number.isInteger(totalCopies) ||
      totalCopies < 0
    ) {
      return res.status(400).send({
        message: "Please provide valid book information",
      });
    }

    const newBook = {
      title,
      author,
      category,
      image,
      description,
      copies: totalCopies,
      userName: finalUserName,
      userEmail,
      addedDate: new Date(),
    };

    const result = await booksCollection.insertOne(newBook);

    res.status(201).send({
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to add book",
    });
  }
});

// 4. Update Book (Protected with Ownership Check)
app.patch("/books/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    if (!isValidId(id)) {
      return res.status(400).send({
        message: "Invalid book ID",
      });
    }

    // Verify ownership
    const existingBook = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingBook) {
      return res.status(404).send({
        message: "Book not found",
      });
    }

    if (existingBook.userEmail !== req.user.email) {
      return res.status(403).send({
        message: "Forbidden: You can only update your own books",
      });
    }

    const updatedData = {};

    const allowedFields = [
      "title",
      "author",
      "category",
      "description",
      "image",
      "copies",
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updatedData[field] = data[field];
      }
    });

    // Validate copies if provided
    if (updatedData.copies !== undefined) {
      updatedData.copies = Number(updatedData.copies);

      if (!Number.isInteger(updatedData.copies) || updatedData.copies < 0) {
        return res.status(400).send({
          message: "Invalid copies value",
        });
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).send({
        message: "No valid data provided",
      });
    }

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData },
    );

    res.status(200).send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to update book",
    });
  }
});

// 5. Delete Book (Protected with Ownership Check)
app.delete("/books/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidId(id)) {
      return res.status(400).send({
        message: "Invalid book ID",
      });
    }

    // Verify ownership
    const existingBook = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingBook) {
      return res.status(404).send({
        message: "Book not found",
      });
    }

    if (existingBook.userEmail !== req.user.email) {
      return res.status(403).send({
        message: "Forbidden: You can only delete your own books",
      });
    }

    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id),
    });

    // Remove related borrow records
    await borrowsCollection.deleteMany({
      bookId: id,
    });

    res.send({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to delete book",
    });
  }
});

// 6. Borrow a Book (Protected)
app.post("/borrows", verifyToken, async (req, res) => {
  try {
    const { bookId, bookTitle, bookImage, returnDate } = req.body;

    // Use verified JWT email to prevent borrowing with another user's email
    const userEmail = req.user.email;

    if (
      !bookId ||
      !isValidId(bookId) ||
      !bookTitle ||
      !bookImage ||
      !returnDate ||
      isNaN(new Date(returnDate).getTime())
    ) {
      return res.status(400).send({
        message: "Please provide valid borrowing information",
      });
    }

    // Decrease book copies
    const updateResult = await booksCollection.updateOne(
      {
        _id: new ObjectId(bookId),
        copies: { $gt: 0 },
      },
      {
        $inc: { copies: -1 },
      },
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).send({
        message: "Book is not available",
      });
    }

    const borrowData = {
      bookId,
      bookTitle,
      bookImage,
      userEmail,
      borrowDate: new Date(),
      returnDate: new Date(returnDate),
    };

    try {
      const result = await borrowsCollection.insertOne(borrowData);

      res.status(201).send({
        message: "Book borrowed successfully",
        insertedId: result.insertedId,
      });
    } catch (error) {
      // Restore copies if borrowing fails
      await booksCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { copies: 1 } },
      );

      if (error.code === 11000) {
        return res.status(400).send({
          message: "You have already borrowed this book",
        });
      }

      throw error;
    }
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to borrow book",
    });
  }
});

// 7. Get Borrowed Books (Protected - User's Own Borrows)
app.get("/borrows", verifyToken, async (req, res) => {
  try {
    // Only return the authenticated user's borrowings
    const userEmail = req.user.email;

    const borrows = await borrowsCollection
      .find({ userEmail })
      .toArray();

    res.send(borrows);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to get borrowed books",
    });
  }
});

// 8. Return Borrowed Book (Protected with Ownership Check)
app.delete("/borrows/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidId(id)) {
      return res.status(400).send({
        message: "Invalid borrow ID",
      });
    }

    const borrow = await borrowsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!borrow) {
      return res.status(404).send({
        message: "Borrow record not found",
      });
    }

    // Verify ownership: only the borrower can return this book
    if (borrow.userEmail !== req.user.email) {
      return res.status(403).send({
        message: "Forbidden: You cannot return another user's borrowing record",
      });
    }

    // Delete borrow record first
    const deleteResult = await borrowsCollection.deleteOne({
      _id: borrow._id,
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).send({
        message: "Book already returned",
      });
    }

    // Increase book copies
    await booksCollection.updateOne(
      { _id: new ObjectId(borrow.bookId) },
      { $inc: { copies: 1 } },
    );

    res.send({
      message: "Book returned successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to return book",
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`BookNook server is running on port ${PORT}`);
});

export default app;
