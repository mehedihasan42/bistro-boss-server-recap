const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorize access'})
  };
  const token = authorization.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).status({error:true,message:'unauthorize access'})
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const orderCollection = client.db("bistroDB-recap").collection("order");
    const userCollection = client.db("bistroDB-recap").collection("user");

    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email:email}
      const user = await userCollection.findOne(query)
      if(user.role !== 'admin'){
          return res.status(403).send({error:true,message:'forbidden access'})
      }
      next()
    }


    //jwt api
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
      res.send({token})
    })

    //user apis
    app.get('/users',verifyJWT,verifyAdmin,async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
          return res.status(403).send({message:'unauthorize access'})
      }
      const query = {email:email}
      const user = await userCollection.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.patch('/users/admin/:email',async(req,res)=>{
      const email = req.params.email;
      const query = {email: email}
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(query,updateDoc)
      res.send(result)
    })

    app.post('/users',async(req,res)=>{
      const user = req.body;
      const query = {email:user.email}
      const existingEmail = await userCollection.findOne(query)
      if(existingEmail){
        return res.send({message:'user already axist'})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    //manu apis
    app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray()
      res.send(result)
    })

    //orders api
    app.get('/order',verifyJWT,async(req,res)=>{
      const email = req.query.email;
      if(!email){
        return res.send([])
      }
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(401).send({message:'forbidden access'})
      }
      const query = {email:email}
      const result = await orderCollection.find(query).toArray()
      res.send(result)
    })
    
    app.post('/order',async(req,res)=>{
      const body = req.body;
      console.log(res)
      const result = await orderCollection.insertOne(body)
      res.send(result)
    })

    app.delete('/order/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })
   
    //review apis
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