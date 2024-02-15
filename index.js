const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.watftgx.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const menuCollection = client.db("bistroDB-recap").collection("menu");
    const reviewCollection = client.db("bistroDB-recap").collection("review");

    app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray()
      res.send(result)
    })
    
    app.get('/review',async(req,res)=>{
      const result = await reviewCollection.find().toArray()
      res.send(result)
    })
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('boss is running')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })