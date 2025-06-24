# 🎬 Tuduum - Movie Discovery App

![App Screenshot](/path/to/screenshot.png) *(optional)*

## Features Implemented

- **Search Movies/TV Shows**
  - Real-time search with debouncing
  - TMDB API integration
  - Responsive results grid

- **Trending Content**
  - Weekly trending movies from TMDB

- **Detailed Movie View**
  - Complete movie metadata (title, plot, runtime)
  - Cast/crew information
  - Ratings (IMDb/TMDB)
  - YouTube trailer integration
  - "Add to Watchlist" button

- **Watchlist Management**
  - Add/remove movies
  - Mark as watched/unwatched
  - localStorage persistence
  - Dedicated watchlist view

### Technical Highlights
- Implemented proper API error handling
- Responsive design for all screen sizes
- Dynamic UI state management
- Efficient API call management

## Technology Stack

### Backend
| Component       | Technology                 |
|-----------------|----------------------------|
| Language        | Go (standard library)      |
| API Framework   | net/http (no frameworks)   |
| API Integration | TMDB API                   |
| Environment     | godotenv for .env          |

### Frontend
| Component       | Technology                 |
|-----------------|----------------------------|
| Core            | Vanilla JavaScript         |
| Styling         | Tailwind CSS               |
| Icons           | Heroicons                  |
| UI Patterns     | Modal dialogs, Card grids  |

### Development Tools
| Category        | Tools                      |
|-----------------|----------------------------|
| Version Control | Git/GitHub                 |
| API Testing     | curl/Postman               |
| Build Tool      | Go Modules                 |

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js (for Tailwind)
- TMDB API key

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/tuduum.git
cd tuduum

# Install backend dependencies
go mod tidy

# Set up environment
cp .env.example .env
# Add your TMDB_API_KEY and TMDB_ACCESS_TOKEN to .env

# Start backend server
go run main.go

# Access frontend at:
http://localhost:8080

## Future Improvements

- Implement user accounts  
- Add dark/light theme toggle  
- Include streaming availability data  
- Export watchlist (PDF/CSV)  
- Advanced filters (by genre, year, rating)  

## License  
MIT License - See LICENSE for details

## Acknowledgments  

- TMDB API for movie data  
- Tailwind CSS for styling  