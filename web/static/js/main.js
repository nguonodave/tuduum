const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
let debounceTimer;

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

async function searchMovies(query) {
    try {
        // Ensure we're showing search results
        watchlistView.classList.add('hidden');
        searchView.classList.remove('hidden');
        watchlistBtn.classList.remove('active');

        resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading...</div>';

        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok) {
            // Handle custom error messages from our backend
            const error = data.error || 'Failed to fetch data';
            throw new Error(error);
        }

        displayResults(data);
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-red-500 mb-2">${error.message}</div>
                <div class="text-sm text-gray-500">Try a different search term</div>
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
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" data-imdbid="${movie.imdbID}">
            <div class="h-48 bg-gray-200 overflow-hidden">
                ${movie.Poster !== 'N/A' ?
            `<img src="${movie.Poster}" alt="${movie.Title}" class="w-full h-full object-cover">` :
            `<div class="w-full h-full flex items-center justify-center text-gray-500">No image available</div>`}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${movie.Title}</h3>
                <p class="text-gray-600">${movie.Year} • ${movie.Type}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('[data-imdbid]').forEach(card => {
        card.addEventListener('click', () => {
            const imdbID = card.getAttribute('data-imdbid');
            showMovieDetails(imdbID);
        });
    });
}

async function showMovieDetails(imdbID) {
    try {
        // Create overlay
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

        // Fetch movie details
        const response = await fetch(`/api/movie/${imdbID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }

        const movie = await response.json();
        renderMovieDetails(movie, overlay, imdbID);
    } catch (error) {
        const content = overlay.querySelector('#movieDetailsContent');
        if (content) {
            content.innerHTML = `<div class="text-red-500">${error.message}</div>`;
        }
    }
}

function renderMovieDetails(movie, overlay, imdbID) {
    const content = overlay.querySelector('#movieDetailsContent');
    const isInWatchlist = watchlist.some(item => item.imdbID === imdbID);

    const ratingsHTML = movie.Ratings?.map(rating => `
        <div class="mb-2">
            <span class="font-semibold">${rating.Source}:</span> ${rating.Value}
        </div>
    `).join('') || 'No ratings available';

    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
                ${movie.Poster !== 'N/A' ?
            `<img src="${movie.Poster}" alt="${movie.Title}" class="w-full rounded-lg shadow-md">` :
            `<div class="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg text-gray-500">No image available</div>`}
                    
                <div class="mt-4 flex justify-center">
                    <button id="watchlistAction" class="px-4 py-2 rounded-lg ${isInWatchlist ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                        ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            </div>
            <div class="md:col-span-2">
                <div class="mb-4">
                    <h2 class="text-2xl font-bold">${movie.Title} (${movie.Year})</h2>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">${movie.Rated}</span>
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">${movie.Runtime}</span>
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${movie.Genre}</span>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2">Plot</h3>
                    <p>${movie.Plot}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Details</h3>
                        <p><span class="font-semibold">Released:</span> ${movie.Released}</p>
                        <p><span class="font-semibold">Director:</span> ${movie.Director}</p>
                        <p><span class="font-semibold">Writers:</span> ${movie.Writer}</p>
                        <p><span class="font-semibold">Actors:</span> ${movie.Actors}</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Ratings</h3>
                        ${ratingsHTML}
                        <p><span class="font-semibold">IMDb Rating:</span> ${movie.imdbRating}/10 (${movie.imdbVotes} votes)</p>
                    </div>
                </div>
                
                ${movie.BoxOffice ? `<p><span class="font-semibold">Box Office:</span> ${movie.BoxOffice}</p>` : ''}
                ${movie.Awards !== 'N/A' ? `<p><span class="font-semibold">Awards:</span> ${movie.Awards}</p>` : ''}
            </div>
        </div>
    `;

    const watchlistAction = content.querySelector('#watchlistAction');
    watchlistAction.addEventListener('click', () => {
        if (isInWatchlist) {
            removeFromWatchlist(imdbID);
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

// Watchlist functionality
const watchlistBtn = document.getElementById('watchlistBtn');
const watchlistView = document.getElementById('watchlistView');
const searchView = document.getElementById('searchView');
const watchlistItems = document.getElementById('watchlistItems');

let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Toggle watchlist view
watchlistBtn.addEventListener('click', () => {
    const isWatchlistVisible = !watchlistView.classList.contains('hidden');
    if (isWatchlistVisible) {
        return
    }

    watchlistView.classList.toggle('hidden');
    searchView.classList.toggle('hidden');
    watchlistBtn.classList.toggle('active');

    searchInput.style.display = "none"

    if (!watchlistView.classList.contains('hidden')) {
        renderWatchlist();
    }
});

// Add to watchlist function (to be called from movie details)
function addToWatchlist(movie) {
    if (!watchlist.some(item => item.imdbID === movie.imdbID)) {
        watchlist.push({
            imdbID: movie.imdbID,
            Title: movie.Title,
            Year: movie.Year,
            Poster: movie.Poster,
            Type: movie.Type,
            watched: false
        });
        saveWatchlist();
        return true;
    }
    return false;
}

// Remove from watchlist
function removeFromWatchlist(imdbID) {
    watchlist = watchlist.filter(item => item.imdbID !== imdbID);
    saveWatchlist();
}

// Toggle watched status
function toggleWatched(imdbID) {
    const item = watchlist.find(item => item.imdbID === imdbID);
    if (item) {
        item.watched = !item.watched;
        saveWatchlist();
    }
}

// Save watchlist to localStorage
function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
}

// Render watchlist items
function renderWatchlist() {
    if (watchlist.length === 0) {
        watchlistItems.innerHTML = '<div class="col-span-full text-center py-8">Your watchlist is empty</div>';
        return;
    }

    watchlistItems.innerHTML = watchlist.map(item => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
            ${item.watched ? '<div class="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">Watched</div>' : ''}
            <div class="h-48 bg-gray-200 overflow-hidden">
                ${item.Poster !== 'N/A' ?
            `<img src="${item.Poster}" alt="${item.Title}" class="w-full h-full object-cover">` :
            `<div class="w-full h-full flex items-center justify-center text-gray-500">No image available</div>`}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${item.Title}</h3>
                <p class="text-gray-600">${item.Year} • ${item.Type}</p>
                <div class="flex justify-between mt-3">
                    <button class="toggle-watched text-xs px-2 py-1 rounded ${item.watched ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}" data-imdbid="${item.imdbID}">
                        ${item.watched ? 'Mark Unwatched' : 'Mark Watched'}
                    </button>
                    <button class="remove-from-watchlist text-xs px-2 py-1 rounded bg-red-100 text-red-700" data-imdbid="${item.imdbID}">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.toggle-watched').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatched(btn.dataset.imdbid);
        });
    });

    document.querySelectorAll('.remove-from-watchlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromWatchlist(btn.dataset.imdbid);
        });
    });

    document.querySelectorAll('#watchlistItems [data-imdbid]').forEach(card => {
        card.addEventListener('click', () => {
            const imdbID = card.getAttribute('data-imdbid');
            showMovieDetails(imdbID);
        });
    });
}

renderWatchlist();