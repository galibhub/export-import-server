const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://export-import-hub.netlify.app",
    ],
  })
);
app.use(express.json());

console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@web-projects.djmog22.mongodb.net/?appName=web-projects`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    //create collections
    const db = client.db("export-import");
    const productCollection = db.collection("products");
    const importCollection = db.collection("import");
    const userCollection = db.collection("users");

    //===========================user==============================//

    app.post("/users", async (req, res) => {
      const user = req.body;

      const existingUser = await userCollection.findOne({ email: user.email });
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }

      const result = await userCollection.insertOne({
        name: user.name || "Unknown",
        email: user.email,
        role: "user",
        createdAt: new Date(),
      });

      res.send(result);
    });

    //get api for user role

    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send({ role: user?.role || "user" });
    });

    //get user
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //admin role change api

    app.patch("/users/role/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;

      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );

      res.send(result);
    });

    //get admin products
    app.get("/admin/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    //update products
    app.patch("/products/approve/:id", async (req, res) => {
      const id = req.params.id;

      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "approved" } }
      );

      res.send(result);
    });

    //================================END=========================//

    //latest 6 data
    app.get("/latest-products", async (req, res) => {
      const result = await productCollection
        .find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    //get all product data from mongodb
    app.get("/products", async (req, res) => {
      const result = await productCollection
        .find({ status: "approved" })
        .toArray();

      res.send(result);
    });

    //find and show a specific product
    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const result = await productCollection.findOne({
        _id: new ObjectId(id),
        status: "approved",
      });

      res.send({
        success: true,
        result,
      });
    });

    app.post("/products", async (req, res) => {
      const data = {
        ...req.body,
        status: "pending", // ⛔ admin approve করবে
        createdAt: new Date(),
      };

      const result = await productCollection.insertOne(data);
      res.send({
        success: true,
        result,
        insertedId: result.insertedId,
      });
    });

    //update export product api
    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;

      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };
      const result = await productCollection.updateOne(filter, update);
      res.send({
        success: true,
        result,
      });
    });

    //delete api

    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      // const objectId=new ObjectId(id)
      //     const filter= {_id: objectId}

      const result = await productCollection.deleteOne({
        _id: new ObjectId(id),
      });
      console.log(result);

      res.send({
        success: true,
        result,
      });
    });

    // Api for My export
    app.get("/myExport", async (req, res) => {
      const email = req.query.email;
      const result = await productCollection
        .find({ exporterEmail: email })
        .toArray();
      res.send({
        success: true,
        result,
      });
    });

    //------ api for myImport

    app.post("/myImport", async (req, res) => {
      const data = req.body;
      const result = await importCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    app.get("/myImport", async (req, res) => {
      const email = req.query.email;
      const result = await importCollection
        .find({ importerEmail: email })
        .toArray();
      res.send(result);
    });

    // --- Delete form My Import List ---
    app.delete("/myImport/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await importCollection.deleteOne(query);
      res.send(result);
    });

    //Search All Product Api
    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      const result = await productCollection
        .find({
          productName: { $regex: search_text, $options: "i" },
          status: "approved",
        })
        .toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Export-Import server is Running");
});

app.listen(port, () => {
  console.log(`Export-Import server is Running on Port:${port}`);
});
