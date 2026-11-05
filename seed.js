import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not set in .env!");
  process.exit(1);
}

const client = new MongoClient(uri);

const dummyBooks = [
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    category: "Fiction",
    image: "/covers/the-midnight-library.jpg",
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    copies: 3,
    userName: "Sazzad Islam",
    userEmail: "sazzad@example.com",
    addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Others",
    image: "/covers/atomic-habits.jpg",
    description:
      "An easy and proven way to build good habits and break bad ones. Learn how tiny daily choices compound into remarkable long-term success.",
    copies: 4,
    userName: "Sazzad Islam",
    userEmail: "sazzad@example.com",
    addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    image: "/covers/the-alchemist.jpg",
    description:
      "A mystical journey of Santiago, an Andalusian shepherd boy who yearns to travel in search of worldly treasure and discovers the true meaning of his personal legend.",
    copies: 2,
    userName: "Elena Vance",
    userEmail: "elena@example.com",
    addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    image: "/covers/the-great-gatsby.jpg",
    description:
      "The exemplary novel of the Jazz Age, exploring themes of decadence, idealism, social upheaval, and the elusive nature of the American Dream.",
    copies: 5,
    userName: "Elena Vance",
    userEmail: "elena@example.com",
    addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "History",
    image: "/covers/to-kill-a-mockingbird.jpg",
    description:
      "A deeply moving tale of compassion, conscience, and racial injustice in the American South, seen through the innocent eyes of young Scout Finch.",
    copies: 3,
    userName: "David Miller",
    userEmail: "david@example.com",
    addedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    category: "Kids",
    image: "/covers/harry-potter.jpg",
    description:
      "Follow Harry Potter on his wondrous eleventh birthday when he discovers he is a wizard and begins his first year at Hogwarts School of Witchcraft and Wizardry.",
    copies: 4,
    userName: "David Miller",
    userEmail: "david@example.com",
    addedDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: "/covers/a-brief-history-of-time.jpg",
    description:
      "From the Big Bang to black holes, the iconic theoretical physicist explains the mysteries of time and space in clear and fascinating prose.",
    copies: 2,
    userName: "Sarah Jenkins",
    userEmail: "sarah@example.com",
    addedDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
  },
  {
    title: "The Book of Lost Names",
    author: "Kristin Harmel",
    category: "History",
    image: "/covers/the-book-of-lost-names.jpg",
    description:
      "Inspired by an incredible true story from World War II, a young French woman uses her artistic forgery skills to forge documents that save hundreds of refugee children.",
    copies: 3,
    userName: "Sarah Jenkins",
    userEmail: "sarah@example.com",
    addedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  },
  {
    title: "The Creative Act: A Way of Being",
    author: "Rick Rubin",
    category: "Others",
    image: "/covers/the-creative-act.jpg",
    description:
      "A transcendent guide to cultivating your creative intuition and developing an intimate relationship with inspiration, art, and the universe.",
    copies: 2,
    userName: "Sazzad Islam",
    userEmail: "sazzad@example.com",
    addedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
  },
  {
    title: "Charlotte's Web",
    author: "E. B. White",
    category: "Kids",
    image: "/covers/charlottes-web.jpg",
    description:
      "The heartwarming story of Wilbur the pig and his tender friendship with Charlotte, a wise gray spider who weaves messages of hope into her web.",
    copies: 5,
    userName: "Elena Vance",
    userEmail: "elena@example.com",
    addedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History",
    image: "/covers/sapiens.jpg",
    description:
      "Explores how biology and history have defined us and enhanced our understanding of what it means to be human from ancient foraging bands to modern silicon.",
    copies: 3,
    userName: "David Miller",
    userEmail: "david@example.com",
    addedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Science",
    image: "/covers/dune.jpg",
    description:
      "Set on the harsh desert planet Arrakis, Dune follows Paul Atreides as his family assumes control of the galaxy's most coveted and dangerous resource: the spice melange.",
    copies: 3,
    userName: "Sarah Jenkins",
    userEmail: "sarah@example.com",
    addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
];

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");

    const db = client.db("booknook");
    const booksCollection = db.collection("books");

    let insertedCount = 0;
    let skippedCount = 0;

    for (const book of dummyBooks) {
      const existing = await booksCollection.findOne({ title: book.title });
      if (existing) {
        skippedCount++;
      } else {
        await booksCollection.insertOne(book);
        insertedCount++;
        console.log(`Inserted: "${book.title}"`);
      }
    }

    console.log(
      `Seeding completed. Inserted: ${insertedCount}, Skipped (already exist): ${skippedCount}`
    );
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await client.close();
  }
}

seed();

