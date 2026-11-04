import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 7000;

app.get("/", (req, res) => {
  res.send({ msg: "Server is running fine!" });
});

// mongodb start here:

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("SocialDB");
const createCollection = db.collection("events");
const joinedEventCollection = db.collection("joineds");

// events:post api:
app.post("/events", async (req, res) => {
  const data = req.body;
  const result = await createCollection.insertOne(data);
  // console.log(result)
  res.send(result);
});
// only upcoming all events get api:
app.get("/upcoming-events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await createCollection
    .find({ eventDate: { $gte: today } })
    .sort({ eventDate: 1 })
    .toArray();
  res.send(result);
  // console.log(result);
});
// creator event by user email: get api:
app.get("/manage-events/:email", async (req, res) => {
  const email = req.params.email;
  const result = await createCollection.find({ creatorEmail: email }).toArray();
  // console.log(result, 'creator event user by email is')
  res.send(result);
});
// event detail page api:
app.get("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id,'the id is');
  const result = await createCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
  // console.log(result, 'the single id data is');
});
// edit events patch api:
app.patch("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  const { _id, ...updateData } = req.body;
  const result = await createCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData },
  );
  res.send(result);
  // console.log(result,'and', updateData);
});
// delete event api:
app.delete('/upcoming-events/:id', async(req, res) => {
  const id = req.params.id;
  const result = await createCollection.deleteOne({_id: new ObjectId(id)});
  console.log(result)
  
  res.send(result);
})
// __________________________________
// joined-events post api:
app.post("/joined-events", async (req, res) => {
  const data = req.body;
  const result = await joinedEventCollection.insertOne(data);
  res.send(result);

  // console.log(result, "joined post api");
});
// joined-events get api:
app.get("/joined-events/:email", async (req, res) => {
  const email = req.params.email;
  const result = await joinedEventCollection
    .find({ email: email })
    .sort({ eventDate: 1 })
    .toArray();
  console.log(result, "get all joined data is");
  res.send(result);
});
// mongodb ends here:

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
