package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/joho/godotenv"
)

type Movie struct {
	Title  string `json:"Title"`
	Year   string `json:"Year"`
	Poster string `json:"Poster"`
	Type   string `json:"Type"`
	ImdbID string `json:"imdbID"`
}

type SearchResponse struct {
	Search       []Movie `json:"Search"`
	TotalResults string  `json:"totalResults"`
	Response     string  `json:"Response"`
}

// Add new structs for detailed movie response
type MovieDetails struct {
	Title      string `json:"Title"`
	Year       string `json:"Year"`
	Rated      string `json:"Rated"`
	Released   string `json:"Released"`
	Runtime    string `json:"Runtime"`
	Genre      string `json:"Genre"`
	Director   string `json:"Director"`
	Writer     string `json:"Writer"`
	Actors     string `json:"Actors"`
	Plot       string `json:"Plot"`
	Language   string `json:"Language"`
	Country    string `json:"Country"`
	Awards     string `json:"Awards"`
	Poster     string `json:"Poster"`
	Ratings    []Rating `json:"Ratings"`
	Metascore  string `json:"Metascore"`
	ImdbRating string `json:"imdbRating"`
	ImdbVotes  string `json:"imdbVotes"`
	ImdbID     string `json:"imdbID"`
	Type       string `json:"Type"`
	DVD        string `json:"DVD"`
	BoxOffice  string `json:"BoxOffice"`
	Production string `json:"Production"`
	Website    string `json:"Website"`
	Response   string `json:"Response"`
}

type Rating struct {
	Source string `json:"Source"`
	Value  string `json:"Value"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found, using system environment variables")
	}

	// Serve static files
	fs := http.FileServer(http.Dir("web/static"))
	http.Handle("/web/static/", http.StripPrefix("/web/static/", fs))
	
	// Serve HTML template
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "web/templates/index.html")
	})

	http.HandleFunc("/api/search", searchHandler)
	http.HandleFunc("/api/movie/", movieDetailsHandler) // New endpoint
	port := ":8080"
	fmt.Printf("Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func searchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Query parameter is required", http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("OMDB_API_KEY")
	// fmt.Println(apiKey)
	if apiKey == "" {
		http.Error(w, "OMDB API key not configured", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("http://www.omdbapi.com/?apikey=%s&s=%s", apiKey, url.QueryEscape(query))

	println(url)

	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching data: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read the response body first
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        http.Error(w, fmt.Sprintf(`{"error": "Error reading response: %v"}`, err), http.StatusInternalServerError)
        return
    }

    var result SearchResponse
    if err := json.Unmarshal(body, &result); err != nil {
        http.Error(w, fmt.Sprintf(`{"error": "Error decoding response: %v"}`, err), http.StatusInternalServerError)
        return
    }

	// Check if the response is valid
    if result.Response == "False" {
        // Try to extract the error message from OMDB
        var errorResponse struct {
            Error string `json:"Error"`
        }
        if err := json.Unmarshal(body, &errorResponse); err == nil && errorResponse.Error != "" {
            http.Error(w, fmt.Sprintf(`{"error": "%s"}`, errorResponse.Error), http.StatusNotFound)
        } else {
            http.Error(w, `{"error": "No results found"}`, http.StatusNotFound)
        }
        return
    }

    // Limit the number of results to 10
    if len(result.Search) > 10 {
        result.Search = result.Search[:10]
    }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result.Search)
}

func movieDetailsHandler(w http.ResponseWriter, r *http.Request) {
	imdbID := r.URL.Path[len("/api/movie/"):]
	if imdbID == "" {
		http.Error(w, "IMDb ID is required", http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("OMDB_API_KEY")
	if apiKey == "" {
		http.Error(w, "OMDB API key not configured", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("http://www.omdbapi.com/?apikey=%s&i=%s&plot=full", apiKey, imdbID)

	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching data: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var result MovieDetails
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding response: %v", err), http.StatusInternalServerError)
		return
	}

	if result.Response == "False" {
		http.Error(w, "Film not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
