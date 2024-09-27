const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./src/routes/allRoute");
const mongoose = require("mongoose");
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
require('dotenv').config();

// MongoDB connection URL
const mongoUrl = process.env.DBURL;

// Enable CORS for cross-origin requests
app.use(cors());

// Middleware for JSON request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

// Middleware for request logging
app.use(morgan(':method :url :status'));

// Use your routes
app.use(router);

// Connect to MongoDB with new options
mongoose.connect(mongoUrl, {
})
  .then(() => {
    console.log("*********🛡️🛡️ 🔥 🔥   Successfully Connected to MongoDB 🔥 🔥 🛡️🛡️ **********");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failure", err);
  });

// Define the port to listen on
const port = process.env.PORT || 8000;

// Start the Express server
const server = app.listen(port, () => {
  console.log(`🛡️🛡️ Server is listening on port ${port} 🛡️🛡️`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    if (!userData) {
      // If userData is undefined or null, emit an error message to the client
      socket.emit("error", "Please pass userData correctly");
      return;
    }

    // Pass the user_id
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    // Check if chat and chat.users are defined
    if (!chat || !chat.users) {
      console.log("Chat or chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      // Check if user._id is defined and not equal to newMessageReceived.sender._id
      if (user._id && user._id !== newMessageReceived.sender._id) {
        socket.in(user._id).emit("message received", newMessageReceived);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });
});
