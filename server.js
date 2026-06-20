import cors from "cors"
import express from "express"
import mongoose, { Schema } from "mongoose"
import avocadoSalesData from "./data/avocado-sales.json" with { type: "json" };

const avocadoSchema = new Schema({
  id: Number,
  date: String,
  averagePrice: Number,
  totalVolume: Number,
  totalBagsSold: Number,
  smallBagsSold: Number,
  largeBagsSold: Number,
  xLargeBagsSold: Number,
  region: String
});

const Avocado = mongoose.model('Avocado', avocadoSchema);

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-first-api"
mongoose.connect(mongoUrl)
mongoose.Promise = Promise

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// Start defining your routes here
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to my Avocados-API",
    endpoints: {
      allAvocados: "GET /avocados",
      singleAvocado: "GET /avocados/:id",
      stats: "GET /avocados/stats"
    }
  })
});  

app.get("/avocados", async (req, res) => {
  const { region, page = 1, limit = 20 } = req.query;
  const query = {};

  if (region) {
    query.region = region;
  }

  const skip = (page - 1) * limit;

  try {
  const avocados = await Avocado.find(query)
  .limit(Number(limit))
  .skip(Number(skip));
  res.json(avocados)
  } catch (err) {
    res.status(500).json({error: "Cant pick up the avocados.." });
  }
});

app.get("/avocados/stats", async (req, res) => {
  try {
    const stats = await Avocado.aggregate([
      {
        $group: {
          _id: "$region",
          averagePrice: { $avg: "$averagePrice" },
          totalCount: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Cant find the statistics"});
  }
});

app.get("/avocados/:id", async (req, res) => {
  const avocado = await Avocado.findOne({ id: req.params.id })
  res.json(avocado)
})

if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await Avocado.deleteMany({});
    await Avocado.insertMany(avocadoSalesData);
    console.log("Database is up.");
  };

  seedDatabase();
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
