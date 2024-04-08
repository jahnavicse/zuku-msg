
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import cors from "cors";
import fs from "fs";


const app = express();


app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON bodies


mongoose.connect("mongodb://127.0.0.1:27017/flipcart", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  pass: { type: String, required: true },
  role: { type: String, required: true, default: "user" }
});

const postSchema = new mongoose.Schema({
  item: { type: String, required: true },
  file: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }
});

const userModel = mongoose.model("users", userSchema);
const postModel = mongoose.model("posts", postSchema);


const SECRET_KEY = "YOUR_SECRET_KEY";


app.post("/signup", async (req, res) => {
  const { email, name, pass, role } = req.body;
  try {
    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exist" });
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const result = await userModel.create({
      name: name,
      pass: Password,
      email: email,
      role: role
    });
    const token = jwt.sign(
      { email: result.email, role: result.role, id: result._id },
      SECRET_KEY
    );
    res.status(201).json({ user: result, token: token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, pass } = req.body;
    const existingUser = await userModel.findOne({ email: email });
    if (!existingUser) {
      return res.status(400).json({ message: "User not found" });
    }
    const matchPassword = await bcrypt.compare(pass, existingUser.pass);
    if (!matchPassword) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign(
      {
        email: existingUser.email,
        role: existingUser.role,
        id: existingUser._id
      },
      SECRET_KEY
    );
    res.status(200).json({ user: existingUser, token: token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});


const auth = (req, res, next) => {
  let token = req.headers.authorization;
  if (token) {
    try {
      token = token.split(" ")[1];
      let user = jwt.verify(token, SECRET_KEY);
      req.userId = user.id;
      req.role = user.role;
      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized Access" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized Access" });
  }
};

app.post("/message", auth, async (req, res) => {
  const { item } = req.body;
  try {
    const newPost = await postModel.create({
      item: item,
      userId: req.userId
    });
    res.status(201).json({ message: "Message sent successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post("/logout", auth, (req, res) => {
  res.json({ message: "Logged out successfully." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);
});
