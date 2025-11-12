const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000
// middleware

app.use(cors())
app.use(express.json())

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
        await client.connect();
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
        app.post('/createEvent', async (req, res) => {
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
        app.post('/joinedEvent', async (req, res) => {
            const joinedData = req.body
            console.log(joinedData)
            const result = await joinedEventcollection.insertOne(joinedData)
            res.send(result)
        })

        // all joined event data
        app.get('/alljoinedData', async (req, res) => {
            const cursor = joinedEventcollection.find().sort({ date: 1 })
            const result = await cursor.toArray()
            res.send(result)
        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})