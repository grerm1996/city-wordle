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

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5173/city-wordle",
      "https://grerm1996.github.io",
      "https://grerm1996.github.io/city-wordle",
    ],
    credentials: true,
  })
);

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

app.get("/canada", (request, response) => {
  client.query(
    "SELECT * FROM canadacities ORDER BY random() LIMIT 1;",
    (err, res) => {
      if (err) {
        console.error("Error executing query", err);
        response.status(500).json({ error: "Error executing query" });
      } else {
        if (res.rows.length > 0) {
          const randomCanadianCity = res.rows[0];
          response.json(randomCanadianCity);
        } else {
          response.status(404).json({
            error: "No Canadian cities found",
          });
        }
      }
    }
  );
});

app.get("/autocomplete/:input", (req, response) => {
  let input = req.params.input.trim().replace(/^[,\s]+|[,\s]+$/g, "");
  if (input.includes(", ")) {
    let [cityInput, stateInput] = input.split(", ");

    client.query(
      "SELECT city, state_id, id FROM cities WHERE REPLACE(REPLACE(city, '.', ''), '-', ' ') ILIKE $1 || '%'  OR city ILIKE $1 || '%'  LIMIT 4",
      [cityInput, stateInput],
      (err, res) => {
        if (err) {
          console.error(err);
        } else {
          console.log(cityInput);
          console.log(res.rows);
          handleQueryResult(err, res, response);
        }
      }
    );
  } else {
    client.query(
      "SELECT city, state_id, id FROM cities WHERE REPLACE(REPLACE(city, '.', ''), '-', ' ') ILIKE $1 || '%' OR city ILIKE $1 || '%' LIMIT 4",
      [input],
      (err, res) => {
        if (err) {
          console.error(err);
        } else {
          console.log(input);
          console.log(res.rows);
          handleQueryResult(err, res, response);
        }
      }
    );
  }
});

function handleQueryResult(err, res, response) {
  if (err) {
    console.error("Error executing query", err);
    response.status(500).json({ error: "Error executing query" });
  } else {
    const suggestions = res.rows;
    response.json(suggestions);
  }
}

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
