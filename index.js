const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

 // await client.connect();
 const db=client.db('pet-adoption');
 const patCollection=db.collection('pet-collection');
 const myRequest=db.collection("myRequest");


app.post('/addPets',async(req,res)=>{
 const petData=req.body;
 const result= await patCollection.insertOne(petData);
 res.json(result);
 })

app.get('/addPets',async(req,res)=>{
 const result=await patCollection.find().toArray();
 res.json(result);
 })

 // for role based users:--->
 app.get('/addPets/:email',async(req,res)=>{
   const email=req.params.email;
   const result = await patCollection.find({
      ownerEmail:email
   }).toArray();
   res.json(result)
 })
 // created api for deleted

 app.delete('/addPets/:id',async(req,res)=>{
 const {id}=req.params
 const result = await patCollection.deleteOne({
 _id:new ObjectId(id)
 })
res.json(result);
 })

 // created  api for updated in single card
 app.patch('/addPets/:id',async(req,res)=>{
 const{id}=req.params;
 const updateData=req.body;
 const result =await patCollection.updateOne(
 {_id: new ObjectId(id)},
{$set:updateData}

 )
 res.json(result);
 })

 //for my request pet 
 app.post('/myRequest',async(req,res)=>{
 const petData=req.body;
 const result=await myRequest.insertOne(petData);
 res.json(result);
 })

 app.get('/myRequest',async(req,res)=>{
   const reqData=req.body;
   const result=await myRequest.find().toArray();
   res.json(result);
 })

app.get('/bookings/:userId', async (req, res) => {
 const { userId } = req.params; 
 const result = await bookingCollection.find({ userEmail: userId }).toArray();
 res.json(result);
})



 app.get('/addPets/:id',async(req,res)=>{
const {id}=req.params;
const result= await patCollection.findOne({
 _id:new ObjectId(id)
})
res.json(result);
 })

 // await client.db("admin").command({ ping: 1 });
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