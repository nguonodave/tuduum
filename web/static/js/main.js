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
        resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading...</div>';
        
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        
        // console.log(response.ok)

        if (!response.ok) {
            throw new Error(response.status === 404 ? 'No results found' : 'Failed to fetch data');
        }

        const movies = await response.json();
        displayResults(movies);
    } catch (error) {
        resultsContainer.innerHTML = `<div class="col-span-full text-center py-8 text-red-500">${error.message}</div>`;
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

    // Add click event listeners to all movie cards
    document.querySelectorAll('[data-imdbid]').forEach(card => {
        card.addEventListener('click', () => {
            const imdbID = card.getAttribute('data-imdbid');
            showMovieDetails(imdbID);
        });
    });
}

async function showMovieDetails(imdbID) {
    try {
        // Create overlay for loading/details
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
        
        // Add event listener for close button
        overlay.querySelector('#closeDetails').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Fetch movie details
        const response = await fetch(`/api/movie/${imdbID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }

        const movie = await response.json();
        renderMovieDetails(movie, overlay);
    } catch (error) {
        const content = overlay.querySelector('#movieDetailsContent');
        if (content) {
            content.innerHTML = `<div class="text-red-500">${error.message}</div>`;
        }
    }
}

function renderMovieDetails(movie, overlay) {
    const content = overlay.querySelector('#movieDetailsContent');
    
    // Format ratings
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
}