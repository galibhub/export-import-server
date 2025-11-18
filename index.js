const express=require('express');
const cors=require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app=express();
const port=process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json())


const uri = "mongodb+srv://export-import:6MIBVAWsy9DTYvTo@web-projects.djmog22.mongodb.net/?appName=web-projects";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
    await client.connect();
    
    //create collections 
    const db=client.db('export-import');
    const productCollection=db.collection('products');


    //latest 6 data
    app.get('/latest-products',async(req,res)=>{
        const result=await productCollection.find().sort({createdAt:-1}).limit(6).toArray();
        res.send(result)
    })


    //get all product data from mongodb
    app.get('/products',async(req,res)=>{
        const result=await productCollection.find().toArray()

        res.send(result)
    })










    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Export-Import server is Running')
})

app.listen(port,()=>{
    console.log(`Export-Import server is Running on Port:${port}`)
})