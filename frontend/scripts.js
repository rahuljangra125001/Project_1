const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const CLIENT_ID = '758563348232-7um542rintc0snebd27cu1le6bfoaal4.apps.googleusercontent.com'; // Replace with your Client ID
const SECRET_KEY = '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'; // Change this to a more secure secret in production

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Allow cross-origin requests
app.use(session({ secret: 'your-session-secret', resave: false, saveUninitialized: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/packerandmover', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// Sign-Up Route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    try {
        await user.save();
        res.status(201).send('User created');
    } catch (error) {
        res.status(400).send('Error creating user');
    }
});

// Sign-In Route
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Google Sign-In route
const client = new OAuth2Client(CLIENT_ID);
app.post('/auth/google', async (req, res) => {
    const { id_token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: CLIENT_ID
        });
        const payload = ticket.getPayload();
        const userId = payload['sub'];
        const email = payload['email'];
        // Handle user authentication or registration
        req.session.user = { userId, email };
        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(400).json({ success: false, message: 'Invalid token' });
    }
});

// Serve static files (if you have static assets like CSS or JS files)
app.use(express.static('public'));

// Use a different port number
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
