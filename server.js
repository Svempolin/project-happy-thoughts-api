import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
    trim: true,
  },
  description: {
    type: String,
    minlength: 2,
    maxlength: 35,
    trim: true,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const Thought = mongoose.model("Thought", ThoughtSchema);

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(listEndpoints(app));
});

// Start defining your routes here
app.get("/thought", async (req, res) => {
  const {
    sort,
    page,
    perPage,
    sortNum = Number(sort),
    pageNum = Number(page),
    perPageNum = Number(perPage),
  } = req.query;

  let thought = await Thought.find({})
    .sort({ createdAt: sortNum })
    .skip((pageNum - 1) * perPageNum)
    .limit(perPageNum);

  if (thought) {
    thought = await Thought.find().sort({ createdAt: "desc" }).limit(20);
    res.status(200).json({ response: thought, success: true });
  } else {
    res.status(404).json({ response: "Data not found", success: false });
  }
});

app.post("/thought", async (req, res) => {
  const { message } = req.body;
  try {
    const newThought = await new Thought({ message }).save();
    res.status(201).json({ response: newThought, success: true });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});
app.post("/thought/:id/like", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      id,
      {
        $inc: {
          hearts: 1,
        },
      },
      {
        new: true,
      }
    );
    res.status(200).json({ response: updatedThought, success: true });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

app.delete("/thought/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteThought = await Thought.findOneAndDelete({ _id: id });
    if (deleteThought) {
      res.status(200).json({ response: deleteThought, success: true });
    } else {
      res.status(404).json({ response: "Member not found", success: false });
    }
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

app.patch("/thought/:id", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    const updatedThought = await Thought.findOneAndUpdate(
      { _id: id },
      { message },
      { new: true }
    );
    if (updatedThought) {
      res.status(200).json({ response: updatedThought, success: true });
    } else {
      res.status(404).json({ response: "Member not found", success: false });
    }
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`);
});
