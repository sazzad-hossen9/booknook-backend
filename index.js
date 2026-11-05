import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//Connect MongoDB database
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  await client.connect();
  console.log("MongoDB connected successfully");

  return client.db("booknook");
}

const db = await connectDB();

const booksCollection = db.collection("books");
const borrowsCollection = db.collection("borrows");

await borrowsCollection.createIndex(
  { bookId: 1, userEmail: 1 },
  { unique: true },
);

const isValidId = (id) => ObjectId.isValid(id);

app.get("/", (req, res) => {
  res.send({ message: "BookNook server is running" });
});

app.get("/books", async (req, res) => {
//books
//books?search=dune
//books?category=Fiction
//books?sort=newest&limit=6
//books?email=rahim@gmail.com

  try {
    const { email, category, search, sort, limit } = req.query;

    const filter = {};

    if (email) {
      filter.userEmail = email;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

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

    if (limit) {
      result = result.limit(Number(limit));
    }

    const books = await result.toArray();

    res.send(books);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
