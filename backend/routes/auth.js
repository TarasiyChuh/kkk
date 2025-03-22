const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Comment = require('../models/Comment');
const Game = require('../models/Game');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Твій секретний ключ для JWT
const JWT_SECRET = 'supersecretkey123';  // Той самий ключ, що й у server.js

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Перевіряємо чи вже існує користувач
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Хешуємо пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Створюємо користувача
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Знаходимо користувача
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Генеруємо токен
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,  // Використовуємо ключ 
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Додавання коментаря
router.post('/comments', async (req, res) => {
  try {
    const { userId, gameId, comment, rating } = req.body;

    if (!userId || !gameId || !comment || !rating) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Перевірка чи є такий користувач
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Перевірка чи є така гра
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Створення нового коментаря
    const newComment = new Comment({
      userId,
      gameId,
      comment,
      rating,
    });

    await newComment.save();

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Отримання всіх ігор
router.get('/', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching games' });
  }
});

// Отримання гри за її ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching game' });
  }
});

module.exports = router;
