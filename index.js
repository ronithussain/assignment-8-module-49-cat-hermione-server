import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

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

// jwt start here::::::
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  // console.log(authHeader, "auth header is...");

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  // console.log(token, "without bearer token is");

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload, "the payload is...");
    next();
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "The token is not verifyed, Internal Server Error!" });
  }
};
// jwt ends here:::::::

// events:post api:
const getToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

app.post("/events", verifyToken, async (req, res) => {
  const data = req.body;
  if (!data.eventDate || data.eventDate < getToday()) {
    return res.status(400).json({ message: "Past dates are not allowed" });
  }
  data.createAt = new Date();
  const result = await createCollection.insertOne(data);
  res.send(result);
  // console.log(result, "the post result is...");
});

// limit use and 6 data show homepage:api
app.get("/recent-events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await createCollection
    .find({ eventDate: { $gte: today } })
    .sort({ eventDate: 1 })
    .limit(8)
    .toArray();
  res.send(result);
});

// only upcoming all events get api:
app.get("/upcoming-events", async (req, res) => {
  const result = await createCollection
    .find({ eventDate: { $gte: getToday() } })
    .sort({ eventDate: 1 })
    .toArray();
  res.send(result);
  // console.log(result);
});
// past events for galary section:
app.get("/past-events", async (req, res) => {
  const result = await createCollection
    .find({ eventDate: { $lt: getToday() } })
    .sort({ eventDate: -1 })
    .toArray();
  res.send(result);
});
// creator event by user email: get api:
app.get("/manage-events/:email", verifyToken, async (req, res) => {
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
app.patch("/upcoming-events/:id", verifyToken, async (req, res) => {
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
app.delete("/upcoming-events/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await createCollection.deleteOne({ _id: new ObjectId(id) });
  // console.log(result);

  res.send(result);
});
// __________________________________
// joined-events post api:
app.post("/joined-events", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await joinedEventCollection.insertOne(data);
  res.send(result);

  // console.log(result, "joined post api");
});
// joined-events get api:
app.get("/joined-events/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const result = await joinedEventCollection
    .find({ email: email })
    .sort({ eventDate: 1 })
    .toArray();
  // console.log(result, "get all joined data is");
  res.send(result);
});
// mongodb ends here:

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;