const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/yourDatabase', {
    useNewUrlParser: true, // Deprecated, but still used for compatibility
    useUnifiedTopology: true // Deprecated, but still used for compatibility
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    comment: String,
    rating: Number
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Routes
app.get('/feedback', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ _id: -1 }).limit(20);
        res.json(feedbacks);
    } catch (error) {
        res.status(500).send('Error fetching feedback');
    }
});

app.post('/feedback', async (req, res) => {
    const { name, email, comment, rating } = req.body;
    if (!name || !email || !comment || !rating) {
        return res.status(400).send('All fields are required');
    }
    try {
        const feedback = new Feedback({ name, email, comment, rating });
        await feedback.save();
        res.status(201).send('Feedback received');
    } catch (error) {
        res.status(500).send('Error saving feedback');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
