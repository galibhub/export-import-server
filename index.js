const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://export-import:6MIBVAWsy9DTYvTo@web-projects.djmog22.mongodb.net/?appName=web-projects";

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

    //latest 6 data
    app.get("/latest-products", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    //get all product data from mongodb
    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();

      res.send(result);
    });

    //find and show a specific product
    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const result = await productCollection.findOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        result,
      });
    });

    // post for database
    
app.post('/products',async(req,res)=>{
  const data=req.body;
  console.log(data)
  const result= await productCollection.insertOne(data)

  res.send({
    success:true,
    result,
    insertedId: result.insertedId
  })
})


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
