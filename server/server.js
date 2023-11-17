require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { Client } = require("pg");

const client = new Client({ connectionString: process.env.DATABASE_URL });

client
  .connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => console.error("Error connecting to database", err));

app.use(cors({ credentials: true, origin: ["http://localhost:5173"] }));

app.get("/", (request, response) => {
  client.query(
    "SELECT * FROM cities WHERE population > 300000 AND strict_pop > 150000 ORDER BY random() LIMIT 1;",
    (err, res) => {
      if (err) {
        console.error("Error executing query", err);
        response.status(500).json({ error: "Error executing query" });
      } else {
        if (res.rows.length > 0) {
          const randomCity = res.rows[0];
          response.json(randomCity);
        } else {
          response.status(404).json({
            error: "No cities found with a population greater than 300,000",
          });
        }
      }
    }
  );
});

app.get("/autocomplete/:input", (req, response) => {
  if (
    req.params.input.includes(", ") &&
    req.params.input.split(", ")[1].length > 0
  ) {
    let temp = req.params.input.split(", ");
    let cityinput = temp[0];
    let stateinput = temp[1];
    client.query(
      "SELECT city, state_id, id FROM cities WHERE city ILIKE $1 AND state_id ILIKE $2 || '%' LIMIT 6",
      [cityinput, stateinput],
      (err, res) => {
        if (err) {
          console.error("Error executing query", err);
          response.status(500).json({ error: "Error executing query" });
        } else {
          const suggestions = res.rows;
          response.json(suggestions);
        }
      }
    );
  } else {
    client.query(
      "SELECT city, state_id, id FROM cities WHERE city ILIKE $1 || '%' LIMIT 6",
      [req.params.input.trim()],
      (err, res) => {
        if (err) {
          console.error("Error executing query", err);
          response.status(500).json({ error: "Error executing query" });
        } else {
          const suggestions = res.rows;
          response.json(suggestions);
        }
      }
    );
  }
});

app.get("/guess/:city", (req, response) => {
  client.query(
    "SELECT * FROM cities WHERE id = $1",
    [req.params.city],
    (err, res) => {
      if (err) {
        console.error("Error executing query", err);
        response.status(500).json({ error: "Error executing query" });
      } else {
        if (res.rows.length > 0) {
          const guessedCity = res.rows[0];
          response.json(guessedCity);
        } else {
          response.status(404).json({
            error: "No cities found",
          });
        }
      }
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
