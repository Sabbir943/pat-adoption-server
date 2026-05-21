const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
const PORT = process.env.SERVER_PORT;
const uri = process.env.MONGODB_URI;

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
      const db = client.db('pet-adoption');
      const patCollection = db.collection('pet-collection');
      const myRequest = db.collection("myRequest");

      const requestCollection = db.collection("requests");



      app.post('/addPets', async (req, res) => {
         const petData = {
            ...req.body, status: 'available'
         }
         const result = await patCollection.insertOne(petData);
         res.json(result);
      })


      app.get('/addPets', async (req, res) => {
         const result = await patCollection.find().toArray();
         res.json(result);
      })

      // for role based users:--->
      app.get('/myListing/:email', async (req, res) => {
         const email = req.params.email;
         const result = await patCollection.find({
            ownerEmail: email
         }).toArray();
         res.json(result)
      })
      // for signle pet
      app.get('/pet/:id', async (req, res) => {
         const { id } = req.params
         const result = await patCollection.findOne({
            _id: new ObjectId(id)
         })
         res.json(result);
      })
      // updated the pet
      app.patch('/pet/:id', async (req, res) => {
         const { id } = req.params;
         const updateData = req.body;
         const result = await patCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }

         )
         res.json(result);
      })

      //Delete pet
      app.delete('/pet/:id', async (req, res) => {
         const { id } = req.params
         const result = await patCollection.deleteOne({
            _id: new ObjectId(id)
         })
         res.json(result);
      })

      //adopt request
      app.post('/request', async (req, res) => {
         const body = req.body;
         const pet = await patCollection.findOne({ _id: new ObjectId(body.petId) })

         if (pet.ownerEmail === body.userEmail) {
            return res.status(400).json({
               message: 'Owner cannot adopt'
            })
         }
         if (pet.status === 'adopted') {
            return res.status(400).json({
               message: 'Already adopted'
            })
         }
         const result = await requestCollection.insertOne({
            ...body, status: "pending",
            requestDate: new Date()
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



app.get('/', async (req, res) => {
   res.send('server is ready!!!!!');
})


app.listen(PORT, () => {
   console.log(`server is running is port ${PORT}`);
})