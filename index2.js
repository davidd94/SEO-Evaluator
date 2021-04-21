// Require express and body-parser
const express = require("express");
const bodyParser = require("body-parser");

// Initialize express and define a port
const app = express()
const PORT = 8080

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json())

// Routes
app.post("/hook", async (req, res) => {
    console.log('fdsfa');
    res.status(200).end(); // Responding to webhooks to prevent auto-disable or spamming events
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
