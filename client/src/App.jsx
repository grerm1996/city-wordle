import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { getBearing, haversineDistance } from "./functions.jsx";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import SimpleMap from "./components/Map.jsx";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ModeNightIcon from "@mui/icons-material/ModeNight";

function App() {
  const [targetCity, setTargetCity] = useState("");
  const [inputGuess, setInputGuess] = useState("");
  const [guessArchive, setGuessArchive] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [acIndex, setACIndex] = useState([]);
  const [mapkey, setMapkey] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [autocompleteValue, setAutocompleteValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const [isCanadianMode, setIsCanadianMode] = useState(() => {
    const saved = localStorage.getItem("canadianMode");
    return saved ? JSON.parse(saved) : false;
  });
  let modal = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputGuess === "") {
      setSuggestions([]);
    }
  }, [inputGuess]);

  function DarkModeToggle({ darkMode, toggleDarkMode }) {
    return (
      <div className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? <ModeNightIcon /> : <WbSunnyIcon />}
      </div>
    );
  }

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  const toggleMode = () => {
    setIsCanadianMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("canadianMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  const getNewTarget = useCallback(() => {
    setIsLoading(true);
    setTargetCity(null);
    const endpoint = isCanadianMode
      ? "https://citywordle.fly.dev/canada"
      : "https://citywordle.fly.dev/";
    fetch(endpoint, {
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
          let responseData = await response.json();
          if (isCanadianMode)
            responseData = {
              ...responseData,
              state_id: responseData.province_id,
            };
          console.log(responseData);
          setTargetCity(responseData);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isCanadianMode]);

  useEffect(() => {
    getNewTarget();
  }, [getNewTarget, isCanadianMode]);

  useEffect(() => setGuessArchive([]), [targetCity]);

  const handleInputChange = (e) => {
    setInputGuess(e.target.value);
    if (e.target.value === "") {
      setSuggestions([]);
    } else getAutocomplete(e.target.value);
  };

  const getAutocomplete = (input) => {
    const endpoint = isCanadianMode
      ? `https://citywordle.fly.dev/canadaautocomplete/${input}`
      : `https://citywordle.fly.dev/autocomplete/${input}`;
    fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(async (response) => {
      if (!response.ok) {
        console.log("fail");
      } else {
        console.log("hello");
        const responseData = await response.json();
        console.log("autocomplete response data: ", responseData);
        setSuggestions(responseData);
      }
    });
  };
  const submitGuess = (guess) => {
    if (guessArchive.map((city) => city.id).includes(guess.id)) {
      setInputGuess("");
      setAutocompleteValue(null);
      return;
    }
    setACIndex((acIndex) => acIndex + 1);
    setInputGuess("");
    setAutocompleteValue(null);
    setSuggestions([]);
    if (guess.id === targetCity.id) {
      setInputGuess("");
      modal.current.showModal();
      setGameOver(true);
      setMapkey((mapkey) => mapkey + 1);
    } else {
      guess.distance = Math.round(
        haversineDistance(
          [guess.lng, guess.lat],
          [targetCity.lng, targetCity.lat]
        )
      );
      guess.bearing = Math.round(
        getBearing(guess.lat, guess.lng, targetCity.lat, targetCity.lng)
      );

      switch (true) {
        case guess.distance === 0:
          guess.arrow = "";
          break;
        case guess.bearing > 337.5 || guess.bearing < 22.5:
          guess.arrow = "⬆";
          break;
        case guess.bearing >= 22.5 && guess.bearing < 67.5:
          guess.arrow = "⬈";
          break;
        case guess.bearing >= 67.5 && guess.bearing < 112.5:
          guess.arrow = "➡";
          break;
        case guess.bearing >= 112.5 && guess.bearing < 157.5:
          guess.arrow = "⬊";
          break;
        case guess.bearing >= 157.5 && guess.bearing < 202.5:
          guess.arrow = "⬇";
          break;
        case guess.bearing >= 202.5 && guess.bearing < 247.5:
          guess.arrow = "⬋";
          break;
        case guess.bearing >= 247.5 && guess.bearing < 292.5:
          guess.arrow = "⬅";
          break;

        case guess.bearing >= 292.5 && guess.bearing <= 337.5:
          guess.arrow = "⬉";
          break;
        default:
          guess.arrow = "";
      }
      setGuessArchive((guessArchive) => [...guessArchive, guess]);
    }
    setTimeout(() => {
      if (autocompleteRef.current) {
        if (autocompleteRef.current) {
          const input = autocompleteRef.current.querySelector("input");
          if (input) {
            input.focus();
          }
        }
      }
    }, 0);
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
    const normalizedInput = removeDiacritics(inputValue.toLowerCase());
    return options.filter((option) => {
      const optionLabel = `${option.city}, ${
        option.state_id || option.province_id
      }`;
      const normalizedLabel = removeDiacritics(optionLabel.toLowerCase());
      return normalizedLabel.includes(normalizedInput);
    });
  };
  (options, { inputValue }) => {
    const regex = new RegExp(inputValue, "i");
    return options.filter((option) =>
      regex.test(`${option.city}`.replace(".", "").replace("-", " "))
    );
  };

  const darkTheme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <div className={`app ${darkMode ? "dark-mode" : ""}`}>
        <div className="icon-holder">
          {" "}
          <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <div className="flag-toggle" onClick={toggleMode}>
            {isCanadianMode ? "🇨🇦" : "🇺🇸"}
          </div>
        </div>
        {isLoading ? (
          <div className="lds-dual-ring"></div>
        ) : targetCity ? (
          <>
            <div className="hints">
              <p className="population">
                Population:{" "}
                {parseInt(
                  isCanadianMode ? targetCity.population : targetCity.strict_pop
                ).toLocaleString()}
              </p>
              {!isCanadianMode && (
                <p className="urban-area">
                  (Urban area:{" "}
                  {parseInt(targetCity.population).toLocaleString()})
                </p>
              )}
              {isCanadianMode ? (
                <p>Density: {targetCity.density} people/km²</p>
              ) : (
                targetCity.county_name && (
                  <p>
                    {targetCity.county_name.includes(targetCity.city) ||
                    targetCity.city.includes(targetCity.county_name) ? (
                      <span className="county-redacted tooltip">
                        [redacted]
                        <span className="tooltiptext">
                          (This county name is the same as the city name.)
                        </span>
                      </span>
                    ) : (
                      targetCity.county_name
                    )}{" "}
                    County
                  </p>
                )
              )}
            </div>
            <Autocomplete
              ref={autocompleteRef}
              className="autocomplete"
              disablePortal
              inputValue={inputGuess}
              value={autocompleteValue}
              filterOptions={filterOptions}
              options={suggestions}
              getOptionLabel={(option) =>
                `${option.city}, ${option.state_id || option.province_id}`
              }
              sx={{
                width: 300,
                "& .MuiAutocomplete-input": {
                  color: "inherit",
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Enter guess"
                  InputLabelProps={{
                    style: { color: "inherit" },
                  }}
                  ref={inputRef}
                />
              )}
              onInputChange={(event, newInputValue) =>
                handleInputChange({ target: { value: newInputValue } })
              }
              key={acIndex}
              onChange={(event, value) => {
                if (value) {
                  submitGuess(value);
                  setAutocompleteValue(null);
                  setInputGuess("");
                  if (autocompleteRef.current) {
                    const input =
                      autocompleteRef.current.querySelector("input");
                    if (input) {
                      input.focus();
                    }
                  }
                }
              }}
            />
          </>
        ) : (
          <div className="lds-dual-ring"></div>
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
            {targetCity ? (
              <>
                <p className="readmore">
                  <a
                    href={`https://en.wikipedia.org/wiki/${targetCity.city}, ${targetCity.state_id}`}
                    target="_blank"
                  >
                    Read more about <strong>{targetCity.city}</strong> on
                    Wikipedia
                  </a>
                </p>

                <SimpleMap
                  lat={targetCity.lat}
                  lng={targetCity.lng}
                  mapkey={mapkey}
                />
              </>
            ) : (
              ""
            )}

            <button className="playagain" onClick={restartGame}>
              Play again?
            </button>
          </div>
        </dialog>
      </div>
    </ThemeProvider>
  );
}
export default App;
