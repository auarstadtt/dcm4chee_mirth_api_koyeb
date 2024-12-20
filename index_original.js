const express = require('express');
const app = express();
const port = 4444; // You can change the port number if needed

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// A simple GET endpoint
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// A simple POST endpoint
app.post('/echo', (req, res) => {
    const data = req.body;
    res.json({
        message: 'You sent me this data!',
        data: data
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Simple API listening at http://localhost:${port}`);
});