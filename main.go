package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/joho/godotenv"
)

type TMDBMovie struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	ReleaseDate string  `json:"release_date"`
	PosterPath  string  `json:"poster_path"`
	VoteAverage float64 `json:"vote_average"`
	Overview    string  `json:"overview"`
}

type TMDBResponse struct {
	Results []TMDBMovie `json:"results"`
}

type TMDBMovieDetails struct {
	ID               int                    `json:"id"`
	Title            string                 `json:"title"`
	Overview         string                 `json:"overview"`
	PosterPath       string                 `json:"poster_path"`
	ReleaseDate      string                 `json:"release_date"`
	Runtime          int                    `json:"runtime"`
	VoteAverage      float64                `json:"vote_average"`
	Genres           []Genre                `json:"genres"`
	Credits          Credits                `json:"credits"`
	Videos           Videos                 `json:"videos"`
	ProductionCompanies []ProductionCompany `json:"production_companies"`
}

type Genre struct {
	Name string `json:"name"`
}

type Credits struct {
	Cast []CastMember `json:"cast"`
	Crew []CrewMember `json:"crew"`
}

type CastMember struct {
	Name string `json:"name"`
}

type CrewMember struct {
	Name string `json:"name"`
	Job  string `json:"job"`
}

type Videos struct {
	Results []Video `json:"results"`
}

type Video struct {
	Key  string `json:"key"`
	Site string `json:"site"`
	Type string `json:"type"`
}

type ProductionCompany struct {
	Name string `json:"name"`
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
	http.HandleFunc("/api/movie/", movieDetailsHandler)
	http.HandleFunc("/api/trending", trendingHandler)

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

	apiKey := os.Getenv("TMDB_API_KEY")
	if apiKey == "" {
		http.Error(w, "TMDB API key not configured", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("https://api.themoviedb.org/3/search/movie?api_key=%s&query=%s", apiKey, url.QueryEscape(query))

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("TMDB_ACCESS_TOKEN")))
	req.Header.Add("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching data: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var result TMDBResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding response: %v", err), http.StatusInternalServerError)
		return
	}

	if len(result.Results) > 10 {
		result.Results = result.Results[:10]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result.Results)
}

func movieDetailsHandler(w http.ResponseWriter, r *http.Request) {
	movieID := r.URL.Path[len("/api/movie/"):]
	if movieID == "" {
		http.Error(w, "Movie ID is required", http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("TMDB_API_KEY")
	if apiKey == "" {
		http.Error(w, "TMDB API key not configured", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("https://api.themoviedb.org/3/movie/%s?api_key=%s&append_to_response=credits,videos", movieID, apiKey)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("TMDB_ACCESS_TOKEN")))
	req.Header.Add("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching data: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var result TMDBMovieDetails
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding response: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func trendingHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("TMDB_API_KEY")
	if apiKey == "" {
		http.Error(w, "TMDB API key not configured", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("https://api.themoviedb.org/3/trending/movie/week?api_key=%s", apiKey)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("TMDB_ACCESS_TOKEN")))
	req.Header.Add("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching data: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var result TMDBResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding response: %v", err), http.StatusInternalServerError)
		return
	}

	if len(result.Results) > 12 {
		result.Results = result.Results[:12]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result.Results)
}