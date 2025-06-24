// DOM Elements
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const watchlistBtn = document.getElementById('watchlistBtn');
const watchlistView = document.getElementById('watchlistView');
const searchView = document.getElementById('searchView');
const watchlistItems = document.getElementById('watchlistItems');
const trendingResults = document.getElementById('trendingResults');
const trendingSection = document.getElementById('trendingSection');

let debounceTimer;
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Initialize the app
function initApp() {
    loadTrendingMovies();
    setupEventListeners();
    renderWatchlist();
}

function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 3) {
            resultsContainer.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            searchMovies(query);
        }, 500);
    });

    // Watchlist toggle
    watchlistBtn.addEventListener('click', () => {
        const isWatchlistVisible = !watchlistView.classList.contains('hidden');
        if (isWatchlistVisible) return;

        watchlistView.classList.remove('hidden');
        searchView.classList.add('hidden');
        trendingSection.classList.add('hidden');
        watchlistBtn.classList.add('active');
        searchInput.style.display = "none";
        renderWatchlist();
    });
}

// Trending Movies
async function loadTrendingMovies() {
    try {
        trendingResults.innerHTML = '<div class="col-span-full text-center py-8">Loading trending movies...</div>';
        
        const response = await fetch('/api/trending');
        if (!response.ok) throw new Error('Failed to load trending movies');

        const movies = await response.json();
        displayTrendingResults(movies);
    } catch (error) {
        trendingResults.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-500">
                ${error.message}
            </div>
        `;
    }
}

function displayTrendingResults(movies) {
    if (!movies || movies.length === 0) {
        trendingResults.innerHTML = '<div class="col-span-full text-center py-8">No trending movies found</div>';
        return;
    }

    trendingResults.innerHTML = movies.map(movie => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" data-movieid="${movie.id}">
            <div class="h-48 bg-gray-200 overflow-hidden">
                ${movie.poster_path ? 
                    `<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="w-full h-full object-cover">` : 
                    `<div class="w-full h-full flex items-center justify-center text-gray-500">No image available</div>`}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${movie.title}</h3>
                <p class="text-gray-600">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('#trendingResults [data-movieid]').forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.getAttribute('data-movieid');
            showMovieDetails(movieId);
        });
    });
}

// Search Movies
async function searchMovies(query) {
    try {
        resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading...</div>';
        
        watchlistView.classList.add('hidden');
        searchView.classList.remove('hidden');
        trendingSection.classList.add('hidden');
        watchlistBtn.classList.remove('active');
        searchInput.style.display = "block";

        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch data');

        const movies = await response.json();
        displayResults(movies);
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-500">
                ${error.message}
            </div>
        `;
    }
}

function displayResults(movies) {
    if (!movies || movies.length === 0) {
        resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">No results found</div>';
        return;
    }

    resultsContainer.innerHTML = movies.map(movie => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" data-movieid="${movie.id}">
            <div class="h-48 bg-gray-200 overflow-hidden">
                ${movie.poster_path ? 
                    `<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="w-full h-full object-cover">` : 
                    `<div class="w-full h-full flex items-center justify-center text-gray-500">No image available</div>`}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${movie.title}</h3>
                <p class="text-gray-600">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('#results [data-movieid]').forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.getAttribute('data-movieid');
            showMovieDetails(movieId);
        });
    });
}

// Watchlist functionality
function addToWatchlist(movie) {
    if (!watchlist.some(item => item.id === movie.id)) {
        watchlist.push({
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            watched: false
        });
        saveWatchlist();
        return true;
    }
    return false;
}

function removeFromWatchlist(movieId) {
    watchlist = watchlist.filter(item => item.id.toString() !== movieId.toString());
    saveWatchlist();
    // refresh the view if we're currently showing the watchlist
    if (!watchlistView.classList.contains('hidden')) {
        renderWatchlist();
    }
}

function toggleWatched(movieId) {
    const item = watchlist.find(item => item.id.toString() === movieId.toString());
    if (item) {
        item.watched = !item.watched;
        saveWatchlist();
        // refresh the view if we're currently showing the watchlist
        if (!watchlistView.classList.contains('hidden')) {
            renderWatchlist();
        }
    }
}

function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
}

function renderWatchlist() {
    if (watchlist.length === 0) {
        watchlistItems.innerHTML = '<div class="col-span-full text-center py-8">Your watchlist is empty</div>';
        return;
    }

    watchlistItems.innerHTML = watchlist.map(item => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
            ${item.watched ? '<div class="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">Watched</div>' : ''}
            <div class="h-48 bg-gray-200 overflow-hidden">
                ${item.poster_path ? 
                    `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title}" class="w-full h-full object-cover">` : 
                    `<div class="w-full h-full flex items-center justify-center text-gray-500">No image available</div>`}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${item.title}</h3>
                <p class="text-gray-600">${item.release_date ? item.release_date.split('-')[0] : 'N/A'}</p>
                <div class="flex justify-between mt-3">
                    <button class="toggle-watched px-3 py-1 rounded ${item.watched ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}" data-movieid="${item.id}">
                        ${item.watched ? '✓ Watched' : 'Mark Watched'}
                    </button>
                    <button class="remove-from-watchlist px-3 py-1 rounded bg-red-100 text-red-700" data-movieid="${item.id}">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners using event delegation
    watchlistItems.addEventListener('click', (e) => {
        const target = e.target;
        
        // Handle "Mark Watched" button
        if (target.classList.contains('toggle-watched')) {
            const movieId = target.getAttribute('data-movieid');
            toggleWatched(movieId);
            e.stopPropagation();
        }
        
        // Handle "Remove" button
        if (target.classList.contains('remove-from-watchlist')) {
            const movieId = target.getAttribute('data-movieid');
            removeFromWatchlist(movieId);
            e.stopPropagation();
        }
        
        // Handle clicking on the movie card
        const card = target.closest('[data-movieid]');
        if (card && !target.closest('button')) {
            const movieId = card.getAttribute('data-movieid');
            showMovieDetails(movieId);
        }
    });
}

// Movie Details
async function showMovieDetails(movieId) {
    try {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold">Loading...</h2>
                        <button id="closeDetails" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div id="movieDetailsContent"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.querySelector('#closeDetails').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        const response = await fetch(`/api/movie/${movieId}`);
        if (!response.ok) throw new Error('Failed to fetch movie details');

        const movie = await response.json();
        renderMovieDetails(movie, overlay, movieId);
    } catch (error) {
        const content = overlay.querySelector('#movieDetailsContent');
        if (content) {
            content.innerHTML = `<div class="text-red-500">${error.message}</div>`;
        }
    }
}

function renderMovieDetails(movie, overlay, movieId) {
    const content = overlay.querySelector('#movieDetailsContent');
    const isInWatchlist = watchlist.some(item => item.id === movieId);

    // Format directors
    const directors = movie.credits?.crew?.filter(person => person.job === "Director") || [];
    const directorNames = directors.map(d => d.name).join(', ') || "Unknown";
    
    // Format main cast (first 5)
    const mainCast = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || "Unknown";
    
    // Find trailer
    const trailer = movie.videos?.results?.find(video => 
        video.type === "Trailer" && video.site === "YouTube"
    );

    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
                ${movie.poster_path ? 
                    `<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="w-full rounded-lg shadow-md">` : 
                    `<div class="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg text-gray-500">No image available</div>`}
                    
                <div class="mt-4 flex justify-center">
                    <button id="watchlistAction" class="px-4 py-2 rounded-lg ${isInWatchlist ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                        ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
                
                ${trailer ? `
                <div class="mt-4">
                    <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-lg transition-colors">
                        Watch Trailer
                    </a>
                </div>
                ` : ''}
            </div>
            <div class="md:col-span-2">
                <div class="mb-4">
                    <h2 class="text-2xl font-bold">${movie.title} (${movie.release_date.split('-')[0]})</h2>
                    <div class="flex flex-wrap gap-2 mt-2 items-center">
                        <span class="bg-yellow-400 text-black px-2 py-1 rounded text-sm font-bold flex items-center">
                            ★ ${movie.vote_average.toFixed(1)}
                        </span>
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                            ${movie.runtime} min
                        </span>
                        ${movie.genres?.map(genre => `
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                ${genre.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2">Overview</h3>
                    <p>${movie.overview || "No overview available."}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Details</h3>
                        <p><span class="font-semibold">Release Date:</span> ${movie.release_date}</p>
                        <p><span class="font-semibold">Director:</span> ${directorNames}</p>
                        <p><span class="font-semibold">Cast:</span> ${mainCast}</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Production</h3>
                        ${movie.production_companies?.map(company => `
                            <p>${company.name}</p>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    const watchlistAction = content.querySelector('#watchlistAction');
    watchlistAction.addEventListener('click', () => {
        if (isInWatchlist) {
            removeFromWatchlist(movieId);
            watchlistAction.textContent = 'Add to Watchlist';
            watchlistAction.className = 'px-4 py-2 rounded-lg bg-blue-100 text-blue-700';
        } else {
            if (addToWatchlist(movie)) {
                watchlistAction.textContent = 'Remove from Watchlist';
                watchlistAction.className = 'px-4 py-2 rounded-lg bg-red-100 text-red-700';
            }
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);