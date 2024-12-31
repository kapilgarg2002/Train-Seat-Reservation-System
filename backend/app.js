const express = require("express");
const bodyParser = require("body-parser");
const { sequelize, User, Booking, DataTypes } = require("./models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).send({ error: "Token required" });
    const payload = jwt.verify(token, "secret_key");
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).send({ error: "Invalid token" });
  }
};

// Routes
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).send({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res
      .status(400)
      .send({ error: "Error creating user", message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, "secret_key");
    res.send({ token });
  } catch (err) {
    res.status(400).send({ error: "Login error" });
  }
});

app.post("/logout", authenticate, async (req, res) => {
  try {
    req.user = null;
    res.send({ message: "Logged out" });
  } catch (err) {
    res.status(400).send({ error: "Logout error" });
  }
});

app.get("/seats", authenticate, async (req, res) => {
  const seats = Array.from({ length: 80 }, (_, i) => i + 1);
  const bookings = await Booking.findAll();
  const reservedSeats = bookings.flatMap((b) => b.seatNumbers);
  const availableSeats = seats.filter((seat) => !reservedSeats.includes(seat));
  res.send({ availableSeats });
});

app.get("/current-user", authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.userId);
  res.send({ id: user.id, name: user.name, email: user.email });
});

app.post("/cancel", authenticate, async (req, res) => {
  try {
    await Booking.destroy({ where: { userId: req.user.userId } });
    res.send({ message: "Bookings cancelled" });
  } catch (err) {
    res.status(400).send({ error: "Error cancelling bookings" });
  }
});

app.post("/reserve", authenticate, async (req, res) => {
  const { seatCount } = req.body;
  if (seatCount > 7 || seatCount <= 0) {
    return res
      .status(400)
      .send({ error: "Seat count must be between 1 and 7" });
  }

  try {
    const seats = Array.from({ length: 80 }, (_, i) => i + 1);
    const bookings = await Booking.findAll();
    const reservedSeats = bookings.flatMap((b) => b.seatNumbers);

    const availableSeats = seats.filter(
      (seat) => !reservedSeats.includes(seat)
    );
    const rows = Array.from({ length: 11 }, (_, i) => {
      return seats.slice(i * 7, i * 7 + (i === 11 ? 3 : 7));
    });

    let selectedSeats = [];

    for (const row of rows) {
      const rowAvailableSeats = row.filter((seat) =>
        availableSeats.includes(seat)
      );
      if (rowAvailableSeats.length >= seatCount) {
        selectedSeats = rowAvailableSeats.slice(0, seatCount);
        break;
      }
    }

    if (selectedSeats.length === 0) {
      selectedSeats = availableSeats.slice(0, seatCount);
    }

    if (selectedSeats.length < seatCount) {
      return res.status(400).send({ error: "Not enough seats available" });
    }

    await Booking.create({
      userId: req.user.userId,
      seatNumbers: selectedSeats,
    });
    res.send({ reservedSeats: selectedSeats });
  } catch (err) {
    res.status(400).send({ error: "Reservation error" });
  }
});

// Sync Database
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synchronized");
  app.listen(3001, () => console.log("Server running on port 3001"));
});
