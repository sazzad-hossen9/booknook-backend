import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  await client.connect();
  console.log("MongoDB connected successfully");

  return client.db("booknook");
}

const db = await connectDB();


app.get("/", (req, res) => {
  res.send({ message: "BookNook server is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
