import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { getBearing, haversineDistance } from "./functions.jsx";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import SimpleMap from "./components/Map.jsx";

function App() {
  const [targetCity, setTargetCity] = useState("");
  const [inputGuess, setInputGuess] = useState("");
  const [guessArchive, setGuessArchive] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [acIndex, setACIndex] = useState([]);
  const [mapkey, setMapkey] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  let modal = useRef(null);

  useEffect(() => {
    if (inputGuess === "") {
      setSuggestions([]);
    }
  }, [inputGuess]);

  const getNewTarget = useCallback(() => {
    fetch("https://citywordle.fly.dev/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          console.log("fail");
        } else {
          console.log("success");
          const responseData = await response.json();
          console.log(responseData);
          setTargetCity(responseData);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  useEffect(() => {
    getNewTarget();
  }, [getNewTarget]);

  useEffect(() => setGuessArchive([]), [targetCity]);

  const handleInputChange = (e) => {
    setInputGuess(e.target.value);
    if (e.target.value === "") {
      setSuggestions([]);
    } else getAutocomplete(e.target.value);
  };

  const getAutocomplete = (input) => {
    fetch(`https://citywordle.fly.dev/autocomplete/${input}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(async (response) => {
      if (!response.ok) {
        console.log("fail");
      } else {
        const responseData = await response.json();
        console.log(responseData);
        setSuggestions(responseData);
      }
    });
  };

  const submitGuess = (guess) => {
    if (guessArchive.map((city) => city.id).includes(guess)) {
      return setInputGuess("");
    }
    setACIndex((acIndex) => setACIndex(acIndex + 1));
    setInputGuess("");
    setSuggestions([]);
    fetch(`https://citywordle.fly.dev/guess/${guess}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          console.log("fail");
        } else {
          const responseData = await response.json();
          console.log("guessed city: ", responseData);
          //correct guess
          if (responseData.id === targetCity.id) {
            setInputGuess("");
            modal.current.showModal();
            setGameOver(true);
            setMapkey((mapkey) => mapkey + 1);
          } else {
            responseData.distance = Math.round(
              haversineDistance(
                [responseData.lng, responseData.lat],
                [targetCity.lng, targetCity.lat]
              )
            );
            responseData.bearing = Math.round(
              getBearing(
                responseData.lat,
                responseData.lng,
                targetCity.lat,
                targetCity.lng
              )
            );

            switch (true) {
              case responseData.distance === 0:
                responseData.arrow = "";
                break;
              case responseData.bearing > 337.5 || responseData.bearing < 22.5:
                responseData.arrow = "⬆";
                break;
              case responseData.bearing >= 22.5 && responseData.bearing < 67.5:
                responseData.arrow = "⬈";
                break;
              case responseData.bearing >= 67.5 && responseData.bearing < 112.5:
                responseData.arrow = "➡";
                break;
              case responseData.bearing >= 112.5 &&
                responseData.bearing < 157.5:
                responseData.arrow = "⬊";
                break;
              case responseData.bearing >= 157.5 &&
                responseData.bearing < 202.5:
                responseData.arrow = "⬇";
                break;
              case responseData.bearing >= 202.5 &&
                responseData.bearing < 247.5:
                responseData.arrow = "⬋";
                break;
              case responseData.bearing >= 247.5 &&
                responseData.bearing < 292.5:
                responseData.arrow = "⬅";
                break;

              case responseData.bearing >= 292.5 &&
                responseData.bearing <= 337.5:
                responseData.arrow = "⬉";
                break;
              default:
                responseData.arrow = "";
            }
            setGuessArchive((guessArchive) => [...guessArchive, responseData]);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  const restartGame = () => {
    modal.current.close();
    setInputGuess("");
    getNewTarget();
    setSuggestions([]);
    setGuessArchive([]);
    setGameOver(false);
  };

  const filterOptions = (options, { inputValue }) => {
    const regex = new RegExp(inputValue, "i");
    return options.filter((option) => {
      const optionLabel = `${option.city}, ${option.state_id}`;
      const sanitizedOptionLabel = optionLabel
        .replace(".", "")
        .replace("-", " ");
      return regex.test(optionLabel) || regex.test(sanitizedOptionLabel);
    });
  };

  (options, { inputValue }) => {
    const regex = new RegExp(inputValue, "i");
    return options.filter((option) =>
      regex.test(`${option.city}`.replace(".", "").replace("-", " "))
    );
  };

  return (
    <>
      {targetCity ? (
        <>
          <div className="hints">
            <p className="population">
              Population: {parseInt(targetCity.strict_pop).toLocaleString()}
            </p>
            <p className="urban-area">
              (Urban area: {parseInt(targetCity.population).toLocaleString()})
            </p>

            <p>
              {targetCity.county_name === targetCity.city ? (
                <span className="county-redacted">[redacted]</span>
              ) : (
                targetCity.county_name
              )}{" "}
              County
            </p>
          </div>
          <Autocomplete
            className="autocomplete"
            disablePortal
            filterOptions={filterOptions}
            options={suggestions}
            getOptionLabel={(option) => `${option.city}, ${option.state_id}`}
            sx={{ width: 300, color: "primary.main" }}
            renderInput={(params) => (
              <TextField {...params} label="Enter guess" />
            )}
            onInputChange={(inputGuess) => handleInputChange(inputGuess)}
            key={acIndex}
            onChange={(event, value) => {
              if (value) {
                // Make sure value is not null or undefined
                submitGuess(value.id);
              }
            }}
          />
        </>
      ) : (
        <div class="lds-dual-ring"></div>
      )}

      <div className="lower-container">
        <table className="guess-table">
          {guessArchive.map((guess) => (
            <tr key={guess.id}>
              <td>
                {guess.city}, {guess.state_id}
              </td>
              <td>
                {guess.distance} km away{" "}
                <span className="arrow">{guess.arrow}</span>
              </td>
            </tr>
          ))}
        </table>
      </div>

      <dialog ref={modal}>
        <div className="modal">
          <h1>Bingo!</h1>
          <p>
            You found the city in <strong>{guessArchive.length + 1}</strong>{" "}
            guesses.
          </p>
          <p className="readmore">
            <a
              href={`https://en.wikipedia.org/wiki/${targetCity.city}, ${targetCity.state_id}`}
              target="_blank"
            >
              Read more about <strong>{targetCity.city}</strong> on Wikipedia
            </a>
          </p>
          {targetCity.lat ? (
            <SimpleMap
              lat={targetCity.lat}
              lng={targetCity.lng}
              mapkey={mapkey}
            />
          ) : (
            ""
          )}

          <button className="playagain" onClick={restartGame}>
            Play again?
          </button>
        </div>
      </dialog>
    </>
  );
}
export default App;
