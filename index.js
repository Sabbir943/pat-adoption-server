const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)
const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized"
    })
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    })
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  }
  catch (e) {
    return res.status(401).json({
      message: "unauthorized"
    })
  }



}

async function run() {
  try {

    const db = client.db('pet-adoption');

    const patCollection = db.collection('pet-collection');
    const requestCollection = db.collection('requests');

 

    // ADD PET
    app.post('/addPets', verifyToken ,async (req, res) => {
      const petData = {
        ...req.body,
        status: 'available'
      };

      const result = await patCollection.insertOne(petData);
      res.json(result);
    });




    // GET SINGLE USER LISTINGS
    app.get('/myListing/:email',verifyToken ,async (req, res) => {
      const result = await patCollection.find({
        ownerEmail: req.params.email
      }).toArray();

      res.json(result);
    });

    // GET SINGLE PET
    app.get('/pet/:id', verifyToken, async (req, res) => {
      const result = await patCollection.findOne({
        _id: new ObjectId(req.params.id)
      });

      res.json(result);
    });

    // UPDATE PET
    app.patch('/pet/:id', verifyToken,async (req, res) => {
      const result = await patCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );

      res.json(result);
    });

    // DELETE PET
    app.delete('/pet/:id', verifyToken, async (req, res) => {
      const result = await patCollection.deleteOne({
        _id: new ObjectId(req.params.id)
      });

      res.json(result);
    });

    /* -------------------- ADOPTION REQUEST -------------------- */

    // CREATE REQUEST
    app.post('/request', verifyToken,async (req, res) => {
      const body = req.body;

      const pet = await patCollection.findOne({
        _id: new ObjectId(body.petId)
      });

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // owner cannot adopt own pet
      if (pet.ownerEmail === body.userEmail) {
        return res.status(400).json({
          message: 'Owner cannot adopt own pet'
        });
      }

      // already adopted
      if (pet.status === 'adopted') {
        return res.status(400).json({
          message: 'Pet already adopted'
        });
      }

      const result = await requestCollection.insertOne({
        ...body,
        status: 'pending',
        requestDate: new Date()
      });

      res.json(result);
    });

    // GET MY REQUESTS (USER)
    app.get('/myRequest/:email', verifyToken ,async (req, res) => {
      const result = await requestCollection.find({
        userEmail: req.params.email
      }).toArray();

      res.json(result);
    });

    // CANCEL REQUEST
    app.delete('/myRequest/:id',verifyToken ,async (req, res) => {
      const result = await requestCollection.deleteOne({
        _id: new ObjectId(req.params.id)
      });

      res.json(result);
    });

    // GET REQUESTS BY PET (OWNER MODAL)
    app.get('/requests/:petId', async (req, res) => {
      const result = await requestCollection.find({
        petId: req.params.petId
      }).toArray();

      res.json(result);
    });



    // APPROVE REQUEST
    app.patch('/approve/:id',verifyToken ,async (req, res) => {

      const request = await requestCollection.findOne({
        _id: new ObjectId(req.params.id)
      });

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      // mark approved
      await requestCollection.updateOne(
        { _id: request._id },
        { $set: { status: 'approved' } }
      );

      // mark pet adopted
      await patCollection.updateOne(
        { _id: new ObjectId(request.petId) },
        { $set: { status: 'adopted' } }
      );

      // reject other pending requests
      await requestCollection.updateMany(
        { petId: request.petId, status: 'pending' },
        { $set: { status: 'rejected' } }
      );

      res.json({ message: 'Request approved successfully' });
    });

    // REJECT REQUEST
    app.patch('/reject/:id',verifyToken ,async (req, res) => {

      const result = await requestCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: 'rejected' } }
      );

      res.json(result);
    });



    app.get('/addPets', async (req, res) => {
      const { search, species, sort } = req.query;

      let query = {};
      if (search) {
        query.petName = {
          $regex: search,
          $options: "i"
        };
      }


      if (species) {
        query.species = {
          $in: species.split(",")
        };
      }


      let sortOption = {};

      if (sort === "low") {
        sortOption.adoptionFee = 1;
      }
      else if (sort === "high") {
        sortOption.adoptionFee = -1;
      }
      else {
        sortOption._id = -1;
      }

      const result =
        await patCollection
          .find(query)
          .sort(sortOption)
          .toArray();

      res.json(result);

    });

    /* -------------------- SERVER STATUS -------------------- */

    app.get('/', (req, res) => {
      res.send('Server is running 🚀');
    });

    console.log("MongoDB Connected Successfully!");

  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});