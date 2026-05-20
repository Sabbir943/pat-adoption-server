const { MongoClient, ServerApiVersion } = require('mongodb');

const express=require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const app=express();
dotenv.config();
app.use(express.json());
app.use(cors());
const PORT=process.env.SERVER_PORT;
const uri =process.env.MONGODB_URI;

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
    const db=client.db('pet-adoption');
    const patCollection=db.collection('pet-collection');

    app.get('/pets',async(req,res)=>{
        const result=await patCollection.find().toArray();
        res.json(result);
    })

    app.post('/addPets',async(req,res)=>{
      const petData=req.body;
      const result= await patCollection.insertOne(petData);
      res.json(result);
    })

    app.get('/addPets',async(req,res)=>{
      const result=await patCollection.find().toArray();
      res.json(result);
    })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',async(req,res)=>{
    res.send('server is ready!!!!!');
})


app.listen(PORT,()=>{
    console.log(`server is running is port ${PORT}`);
})