package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found, using system environment variables")
	}

	tmdbKey := os.Getenv("TMDB_API_KEY")
	if tmdbKey == "" {
		log.Fatal("TMDB_API_KEY environment variable is required")
	}
	
	omdbKey := os.Getenv("OMDB_API_KEY")
	if omdbKey == "" {
		log.Print("Warning: OMDB_API_KEY not set - some features will be limited")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println(tmdbKey, omdbKey, port)

	// Start server
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}