const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000
// middleware

app.use(cors())
app.use(express.json())

// fireBase midleware for verify token

const admin = require("firebase-admin");

// index.js
const decoded = Buffer.from(process.env.FIRE_BASE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const fireBaseverify = async (req, res, next) => {
    const authorization = req.headers.authorization
    const token = authorization.split(' ')[1]
    if (!authorization) {
        res.status(401).send('headers not found')
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token)

        req.token_email = decoded.email
        next()

    }
    catch {
        return res.status(401).send('unothorized')
    }

}




//uri
const uri = `mongodb+srv://${process.env.Db_user}:${process.env.Db_Pass}@first-mongobd-porject.tmjl5yc.mongodb.net/?appName=first-mongobd-porject`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const db = client.db('social-event')
        const eventcollection = db.collection('all-event')
        const joinedEventcollection = db.collection('joined-event')

        // upcoming event
        app.get('/upcomingEvent', async (req, res) => {
            const today = new Date()
            const cursor = eventcollection.find({ date: { $gte: today } }).sort({ date: 1 })
            const result = await cursor.toArray()
            res.send(result)
        })



        //create event
        app.post('/createEvent', fireBaseverify, async (req, res) => {
            const createEvent = req.body
            if (createEvent.date) {
                createEvent.date = new Date(createEvent.date);
            }

            const result = await eventcollection.insertOne(createEvent)
            res.send(result)
        })

        //view event
        app.get('/view-event/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await eventcollection.findOne(query)

            res.send(result)
        })

        //joined event
        app.post('/joinedEvent', fireBaseverify, async (req, res) => {
            const joinedData = req.body

            const isExist = await joinedEventcollection.findOne({
                email: joinedData.email,
                title: joinedData.title
            })

            if (isExist) {
                return res.status(409).send("Already joined this event")
            }

            const result = await joinedEventcollection.insertOne(joinedData)
            res.send(result)
        })

        // my  create event data
        app.get('/myjoinedData', fireBaseverify, async (req, res) => {
            const email = req.query.email
            const query = { email }
            if (email !== req.token_email) {
                res.status(401).send('token email not match')
            }
            const cursor = eventcollection.find(query).sort({ date: 1 })
            const result = await cursor.toArray()
            res.send(result)
        })

        // all  joined event data
        app.get('/alljoinedData', async (req, res) => {
            const email = req.query.email
            const query = { email }
            const cursor = joinedEventcollection.find(query).sort({ date: 1 })
            const result = await cursor.toArray()
            res.send(result)
        })
        // delete joined event data
        app.delete('/joindata/:id', fireBaseverify, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await eventcollection.deleteOne(query)
            res.send(result)
        })

        //update get
        app.get('/getUpdate/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await eventcollection.findOne(query)
            res.send(result)

        })



        //update joinedevent data

        app.patch('/joindata/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updateEvent = req.body
            if (updateEvent.date) {
                updateEvent.date = new Date(updateEvent.date)
            }
            const update = {
                $set: {
                    title: updateEvent.title,
                    date: updateEvent.date,
                    eventType: updateEvent.eventType,
                    photo: updateEvent.photo,
                    location: updateEvent.location
                }
            }
            const result = await eventcollection.updateOne(query, update)
            res.send(result)
        })


        //search api
        app.get('/search', async (req, res) => {
            const search = req.query.search
            const result = await eventcollection.find({ title: { $regex: search, $options: 'i' } }).toArray()
            res.send(result)
        })








        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})