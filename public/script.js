// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    feather.replace(); // Initialize Feather icons

    const loginButton = document.getElementById('login-button');
    const authSection = document.getElementById('auth-section');
    const dashboardHeaderSection = document.getElementById('dashboard-header-section');
    const dashboardChartsSection = document.getElementById('dashboard-charts-section');
    const rightSidebarContent = document.getElementById('right-sidebar-content'); // Main container for right sidebar elements

    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const overviewTitle = document.getElementById('overview-title'); // For login state
    const authMessage = document.getElementById('auth-message'); // For login state

    const playlistOverviewTitle = document.getElementById('playlist-overview-title');
    const totalTracksStat = document.getElementById('total-tracks-stat');
    const topArtistsCountStat = document.getElementById('top-artists-count-stat');
    const topGenresCountStat = document.getElementById('top-genres-count-stat');
    const topContributorsCountStat = document.getElementById('top-contributors-count-stat');

    const artistChartDiv = document.getElementById('artistChart'); // Still exists in HTML but will be hidden/unused
    const artistChartLabelsDiv = document.getElementById('artistChartLabels'); // Still exists in HTML but will be hidden/unused
    const topArtistsListDisplay = document.getElementById('top-artists-list-display'); // New element for artists list

    const genreChartDiv = document.getElementById('genreChart'); // Still exists in HTML but will be hidden/unused
    const genreChartLabelsDiv = document.getElementById('genreChartLabels'); // Still exists in HTML but will be hidden/unused
    const genreDistributionList = document.getElementById('genre-distribution-list'); // New element for genres list

    const trackSearchBox = document.getElementById('track-search-box');
    const playlistTracksList = document.getElementById('playlist-tracks-list');
    const tracksLoadingMessage = document.getElementById('tracks-loading-message');
    const showAllTracksBtn = document.getElementById('show-all-tracks-btn');

    const topContributorsDisplay = document.getElementById('top-contributors-display');
    const allContributorsList = document.getElementById('all-contributors-list');

    // Hardcode the specific playlist ID to analyze
    const TARGET_PLAYLIST_ID = '1BZY7mhShLhc2fIlI6uIa4';

    let accessToken = localStorage.getItem('spotify_access_token');
    let refreshToken = localStorage.getItem('spotify_refresh_token');
    let tokenExpiryTime = localStorage.getItem('spotify_token_expiry') ? parseInt(localStorage.getItem('spotify_token_expiry')) : 0;

    let allTracksData = [];

    // Store all data globally
    let allContributorsData = [];
    let allArtistsData = [];
    let allGenresData = [];

    /**
     * Helper to get initials from a name for avatars.
     * @param {string} name
     * @returns {string} Initials (up to two letters)
     */
    function getInitials(name) {
        if (!name || typeof name !== 'string') {
            return '?';
        }
        const words = name.trim().split(/\s+/);
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        } else if (name.length >= 2) {
            return name.substring(0, 2).toUpperCase();
        } else if (name.length === 1) {
            return name.toUpperCase();
        }
        return '?';
    }


    /**
     * Shows the loading indicator and hides main content areas.
     */
    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        dashboardHeaderSection.classList.add('hidden');
        dashboardChartsSection.classList.add('hidden');
        rightSidebarContent.classList.add('hidden');
        authSection.classList.remove('hidden');
        overviewTitle.textContent = "Loading Data...";
        authMessage.textContent = "Fetching playlist insights...";
        loginButton.classList.add('hidden');
    }

    /**
     * Hides the loading indicator and shows/hides content based on success.
     * @param {boolean} success - True if data loaded successfully, false otherwise.
     */
    function hideLoading(success) {
        loadingIndicator.classList.add('hidden');
        if (success) {
            errorMessage.classList.add('hidden');
            authSection.classList.add('hidden');
            dashboardHeaderSection.classList.remove('hidden');
            dashboardChartsSection.classList.remove('hidden');
            rightSidebarContent.classList.remove('hidden');
        } else {
            errorMessage.classList.remove('hidden');
            authSection.classList.remove('hidden');
            dashboardHeaderSection.classList.add('hidden');
            dashboardChartsSection.classList.add('hidden');
            rightSidebarContent.classList.add('hidden');
            loginButton.classList.remove('hidden');
        }
    }

    /**
     * Displays a temporary message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - 'success', 'error', 'info'.
     */
    function showUserMessage(message, type = 'info') {
        let msgElement = document.getElementById('user-message');
        if (!msgElement) {
            msgElement = document.createElement('div');
            msgElement.id = 'user-message';
            document.body.appendChild(msgElement);
        }

        msgElement.textContent = message;
        msgElement.className = 'fixed top-4 right-4 p-3 rounded-lg shadow-lg text-white z-50 transition-transform transform translate-x-full';
        msgElement.style.transition = 'transform 0.3s ease-out';

        if (type === 'success') {
            msgElement.style.backgroundColor = '#22c55e';
        } else if (type === 'error') {
            msgElement.style.backgroundColor = '#ef4444';
        } else {
            msgElement.style.backgroundColor = '#3b82f6';
        }

        void msgElement.offsetWidth;
        msgElement.style.transform = 'translateX(0)';

        setTimeout(() => {
            msgElement.style.transform = 'translateX(100%)';
            msgElement.addEventListener('transitionend', () => {
                if (msgElement.style.transform === 'translateX(100%)') {
                    msgElement.remove();
                }
            }, { once: true });
        }, 3000);
    }


    /**
     * Fetches data from a given endpoint with authorization header.
     * @param {string} endpoint - The API endpoint to fetch from.
     * @returns {Promise<object|null>} The JSON response or null on error.
     */
    async function fetchData(endpoint, useAuth = true) {
        const headers = {};
        if (useAuth && accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        try {
            console.log(`[fetchData] Fetching: ${endpoint}`); // <-- Log endpoint being fetched
            const response = await fetch(endpoint, { headers });
            if (!response.ok) {
                if (response.status === 401 && useAuth) {
                    console.log('Token expired or invalid, attempting refresh...');
                    const refreshed = await attemptTokenRefresh();
                    if (refreshed) {
                        headers['Authorization'] = `Bearer ${accessToken}`;
                        console.log(`[fetchData] Retrying: ${endpoint}`); // <-- Log retry
                        const retryResponse = await fetch(endpoint, { headers });
                        if (retryResponse.ok) {
                            const retryJson = await retryResponse.json();
                            console.log(`[fetchData] Success (retry):`, retryJson); // <-- Log retry data
                            return retryJson;
                        } else {
                            const errorBody = await retryResponse.text();
                            throw new Error(`HTTP error (retry failed)! status: ${retryResponse.status}, body: ${errorBody}`);
                        }
                    } else {
                        throw new Error('Failed to refresh token. Please log in again.');
                    }
                }
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }
            const json = await response.json();
            console.log(`[fetchData] Success:`, json); // <-- Log fetched data
            return json;
        } catch (error) {
            console.error(`[fetchData] Error fetching from ${endpoint}:`, error);
            errorMessage.textContent = `Error: ${error.message}`;
            hideLoading(false);
            return null;
        }
    }

    /**
     * Attempts to refresh the Spotify access token.
     * @returns {Promise<boolean>}
     */
    async function attemptTokenRefresh() {
        if (!refreshToken) {
            console.log('No refresh token available. Cannot refresh.');
            return false;
        }
        try {
            const response = await fetch(`/auth/refresh_token?refresh_token=${refreshToken}`);
            if (!response.ok) {
                throw new Error('Failed to refresh token from backend.');
            }
            const data = await response.json();
            accessToken = data.access_token;
            refreshToken = data.refresh_token || refreshToken;
            tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000;

            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.setItem('spotify_refresh_token', refreshToken);
            localStorage.setItem('spotify_token_expiry', tokenExpiryTime.toString());
            console.log('Token refreshed successfully!');
            showUserMessage('Spotify session refreshed!', 'success');
            return true;
        } catch (error) {
            console.error('Error refreshing token:', error);
            showUserMessage('Session expired. Please log in again.', 'error');
            clearSpotifyTokens();
            updateUIForLoggedOut();
            return false;
        }
    }

    /**
     * Clears Spotify tokens from localStorage.
     */
    function clearSpotifyTokens() {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        accessToken = null;
        refreshToken = null;
        tokenExpiryTime = 0;
    }

    /**
     * Updates the UI to show the login button and hide dashboard content.
     */
    function updateUIForLoggedOut() {
        loginButton.classList.remove('hidden');
        authSection.classList.remove('hidden');
        overviewTitle.textContent = "Welcome to KamiLimu.inthe.Ears";
        authMessage.textContent = "Please log in to analyze your Spotify playlist.";
        dashboardHeaderSection.classList.add('hidden');
        dashboardChartsSection.classList.add('hidden');
        rightSidebarContent.classList.add('hidden');
    }

    /**
     * Updates the UI for a logged-in state, showing dashboard content.
     */
    function updateUIForLoggedIn() {
        loginButton.classList.add('hidden');
        authSection.classList.add('hidden');
        dashboardHeaderSection.classList.remove('hidden');
        dashboardChartsSection.classList.remove('hidden');
        rightSidebarContent.classList.remove('hidden');
    }

    /**
     * Renders overall stats (Total Tracks, Top Artists/Genres/Contributors counts).
     * @param {object} analyzeData - Data from /playlist/analyze endpoint.
     * @param {Array<object>} tracksData - All tracks data.
     */
    function renderOverviewStats(analyzeData, tracksData) {
        totalTracksStat.textContent = tracksData ? tracksData.length : '0';
        playlistOverviewTitle.textContent = "Playlist Overview";
        document.getElementById('top-artists-name-stat').textContent =
            allArtistsData && allArtistsData.length > 0 ? allArtistsData[0].artist : '-';
        document.getElementById('top-genres-name-stat').textContent =
            allGenresData && allGenresData.length > 0 ? allGenresData[0].genre : '-';
        // Always show the contributor with the highest count
        let topContributor = '-';
        if (allContributorsData && allContributorsData.length > 0) {
            const sortedContributors = [...allContributorsData].sort((a, b) => b.count - a.count);
            topContributor = sortedContributors[0].name;
        }
        document.getElementById('top-contributors-name-stat').textContent = topContributor;
    }

    /**
     * Renders the top artists list.
     * @param {Array<object>} artists - Array of artist objects { artist, count }.
     * @param {Array<object>} allTracks - All tracks data to infer genres.
     */
    function renderArtistList(artists, allTracks) {
        topArtistsListDisplay.innerHTML = ''; // Clear previous content

        if (!artists || artists.length === 0) {
            topArtistsListDisplay.innerHTML = '<p class="text-gray-500 text-center mt-4">No artist data available.</p>';
            return;
        }

        const topArtistsData = artists.slice(0, 10); // Display top 10

        topArtistsData.forEach(artist => {
            // Attempt to infer a genre for the artist from the tracks
            const artistTracks = allTracks.filter(track => track.artist.includes(artist.artist));
            let inferredGenres = [];
            artistTracks.forEach(track => {
                // This is a simplification: real genre data per artist would come from Spotify's artist endpoint
                // For now, we'll just collect all genres mentioned for this artist's tracks (if any)
                // This assumes the backend's `getArtistsDetails` returns genres per artist,
                // which our current backend does, but we need to pass this info through.
                // For now, we'll use a placeholder or derive from top genres if backend doesn't provide per artist.
            });

            // Fallback/simplification: Just indicate "Various" or "Multiple Genres"
            let genreText = "Various Genres";
            if (inferredGenres.length > 0) {
                genreText = inferredGenres.slice(0, 2).join(', '); // Show up to 2 genres
                if (inferredGenres.length > 2) genreText += '...';
            }


            const artistItem = document.createElement('div');
            artistItem.className = 'artists-list-item';
            artistItem.innerHTML = `
                <div class="artists-list-item-info">
                    <div class="artists-list-item-name">${artist.artist}</div>
                    <div class="artists-list-item-details">${artist.count} tracks • ${genreText}</div>
                </div>
            `;
            topArtistsListDisplay.appendChild(artistItem);
        });
    }

    /**
     * Renders the genre distribution list.
     * @param {Array<object>} genres - Array of genre objects { genre, count }.
     */
    function renderGenreList(genres) {
        genreDistributionList.innerHTML = '';

        if (!genres || genres.length === 0) {
            genreDistributionList.innerHTML = '<p class="text-gray-500 text-center mt-4">No genre data available.</p>';
            return;
        }

        const topGenresData = genres.slice(0, 10); // Display top 10 genres

        topGenresData.forEach(genre => {
            const genreItem = document.createElement('div');
            genreItem.className = 'genres-list-item';
            genreItem.innerHTML = `
                <div class="genres-list-item-info">
                    <div class="genres-list-item-name">${genre.genre}</div>
                    <div class="genres-list-item-details">${genre.count} songs</div>
                </div>
            `;
            genreDistributionList.appendChild(genreItem);
        });
    }


    /**
     * Renders a subset of tracks or all tracks in the right sidebar.
     * @param {Array<object>} tracks - Array of track objects.
     * @param {boolean} showAll - True to show all tracks, false for a limited view.
     */
    function renderTracks(tracks, showAll = false) {
        playlistTracksList.innerHTML = '';
        tracksLoadingMessage.classList.add('hidden');

        if (!tracks || tracks.length === 0) {
            playlistTracksList.innerHTML = '<p class="text-gray-500 text-center mt-4">No track data available.</p>';
            showAllTracksBtn.classList.add('hidden');
            return;
        }

        const tracksToDisplay = showAll ? tracks : tracks.slice(0, 10);

        tracksToDisplay.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.innerHTML = `
                <div class="track-avatar">${getInitials(track.name)}</div>
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <a href="${track.spotify_url}" target="_blank" class="track-time" title="Listen on Spotify">
                    <i data-feather="external-link" style="width: 1em; height: 1em;"></i>
                </a>
            `;
            playlistTracksList.appendChild(trackItem);
        });
        feather.replace();

        if (tracks.length > 10) {
            showAllTracksBtn.classList.remove('hidden');
            showAllTracksBtn.textContent = showAll ? 'Show Less' : 'Show All';
        } else {
            showAllTracksBtn.classList.add('hidden');
        }
    }

    // Render only top 10 in dashboard, sorted by count
    function renderContributors(contributors) {
        topContributorsDisplay.innerHTML = '';
        allContributorsList.innerHTML = '';

        if (!contributors || contributors.length === 0) {
            topContributorsDisplay.innerHTML = '<p class="text-gray-500 text-center mt-4">No contributor data available.</p>';
            return;
        }

        // Sort contributors by count descending
        const sortedContributors = [...contributors].sort((a, b) => b.count - a.count);
        const topContributors = sortedContributors.slice(0, 10);
        topContributors.forEach(user => {
            const topContributorDiv = document.createElement('div');
            topContributorDiv.className = 'top-contributor';
            topContributorDiv.innerHTML = `
                <div class="top-contributor-avatar">${getInitials(user.name)}</div>
                <div class="top-contributor-name">${user.name}</div>
                <div class="top-contributor-tracks">${user.count} tracks</div>
            `;
            topContributorsDisplay.appendChild(topContributorDiv);
        });

        // Store all for modal (sorted)
        allContributorsData = sortedContributors;
    }

    // Show all contributors in modal, sorted by count
    function showAllContributorsModal() {
        const modal = document.getElementById('contributors-modal');
        const list = document.getElementById('all-contributors-modal-list');
        list.innerHTML = '';
        allContributorsData.forEach(user => {
            const div = document.createElement('div');
            div.className = 'modal-list-item';
            div.innerHTML = `<span class="modal-list-name">${user.name}</span> <span class="modal-list-count">(${user.count} tracks)</span>`;
            list.appendChild(div);
        });
        modal.classList.add('show');
        modal.classList.remove('hidden');
    }

    // Hide modal
    function hideContributorsModal() {
        const modal = document.getElementById('contributors-modal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }

    // Show all artists in modal
    function showAllArtistsModal() {
        const modal = document.getElementById('artists-modal');
        const list = document.getElementById('all-artists-modal-list');
        list.innerHTML = '';
        allArtistsData.forEach(artist => {
            const div = document.createElement('div');
            div.className = 'modal-list-item';
            div.innerHTML = `<span class="modal-list-name">${artist.artist}</span> <span class="modal-list-count">(${artist.count} tracks)</span>`;
            list.appendChild(div);
        });
        modal.classList.add('show');
        modal.classList.remove('hidden');
    }
    function hideArtistsModal() {
        const modal = document.getElementById('artists-modal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }

    // Show all genres in modal
    function showAllGenresModal() {
        const modal = document.getElementById('genres-modal');
        const list = document.getElementById('all-genres-modal-list');
        list.innerHTML = '';
        allGenresData.forEach(genre => {
            const div = document.createElement('div');
            div.className = 'modal-list-item';
            div.innerHTML = `<span class="modal-list-name">${genre.genre}</span> <span class="modal-list-count">(${genre.count})</span>`;
            list.appendChild(div);
        });
        modal.classList.add('show');
        modal.classList.remove('hidden');
    }
    function hideGenresModal() {
        const modal = document.getElementById('genres-modal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }

    // Utility to close modal when clicking outside modal-content
    function addModalClickOutsideClose(modalId, closeFn) {
        const modal = document.getElementById(modalId);
        modal.addEventListener('mousedown', function(e) {
            if (e.target === modal) {
                closeFn();
            }
        });
    }
    addModalClickOutsideClose('artists-modal', hideArtistsModal);
    addModalClickOutsideClose('genres-modal', hideGenresModal);
    addModalClickOutsideClose('contributors-modal', hideContributorsModal);

    // Add event listeners after DOMContentLoaded
    document.getElementById('see-all-contributors-btn').addEventListener('click', showAllContributorsModal);
    document.getElementById('close-contributors-modal').addEventListener('click', hideContributorsModal);
    document.getElementById('see-all-artists-btn').addEventListener('click', showAllArtistsModal);
    document.getElementById('close-artists-modal').addEventListener('click', hideArtistsModal);
    document.getElementById('see-all-genres-btn').addEventListener('click', showAllGenresModal);
    document.getElementById('close-genres-modal').addEventListener('click', hideGenresModal);

    /**
     * Handles the analysis of the hardcoded playlist.
     */
    async function analyzeFixedPlaylist() {
        showLoading();
        let success = true;

        const analyzeData = await fetchData(`/playlist/analyze/${TARGET_PLAYLIST_ID}`);
        if (analyzeData) {
            allArtistsData = analyzeData.allArtists; // Store full artist data
            allGenresData = analyzeData.allGenres; // Store full genre data
            allContributorsData = analyzeData.allContributors; // Store for full list

            renderArtistList(allArtistsData, allTracksData); // Pass allTracksData to infer genres
            renderGenreList(allGenresData);
            renderContributors(allContributorsData);
        } else {
            success = false;
        }

        const tracksData = await fetchData(`/playlist/tracks/${TARGET_PLAYLIST_ID}`);
        if (tracksData) {
            allTracksData = tracksData;
            renderTracks(allTracksData, false);
        } else {
            success = false;
        }

        if (analyzeData && tracksData) {
            renderOverviewStats(analyzeData, tracksData);
        }

        hideLoading(success);
        if (success) {
            showUserMessage('Playlist analysis complete!', 'success');
        } else {
            showUserMessage('Failed to analyze playlist.', 'error');
        }
    }


    // --- Event Listeners ---
    loginButton.addEventListener('click', () => {
        window.location.href = 'https://tracker-xbj3.onrender.com/auth/login';
    });

    let showingAllTracks = false;
    showAllTracksBtn.addEventListener('click', () => {
        showingAllTracks = !showingAllTracks;
        renderTracks(allTracksData, showingAllTracks);
    });

    trackSearchBox.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredTracks = allTracksData.filter(track =>
            track.name.toLowerCase().includes(searchTerm) ||
            track.artist.toLowerCase().includes(searchTerm) ||
            track.album.toLowerCase().includes(searchTerm)
        );
        renderTracks(filteredTracks, true);
        showAllTracksBtn.classList.add('hidden');
    });


    // API Explorer "Copy JSON" functionality
    

    

    async function initApp() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const urlAccessToken = params.get('access_token');
        const urlRefreshToken = params.get('refresh_token');
        const urlExpiresIn = params.get('expires_in');
        const urlError = params.get('error');

        window.history.replaceState({}, document.title, window.location.pathname);

        if (urlError) {
            showUserMessage(`Authentication error: ${urlError}. Please try logging in again.`, 'error');
            clearSpotifyTokens();
            updateUIForLoggedOut();
            return;
        }

        if (urlAccessToken && urlRefreshToken && urlExpiresIn) {
            accessToken = urlAccessToken;
            refreshToken = urlRefreshToken;
            tokenExpiryTime = Date.now() + (parseInt(urlExpiresIn) - 300) * 1000;

            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.setItem('spotify_refresh_token', refreshToken);
            localStorage.setItem('spotify_token_expiry', tokenExpiryTime.toString());

            showUserMessage('Successfully logged in to Spotify!', 'success');
        } else if (accessToken && Date.now() < tokenExpiryTime) {
            showUserMessage('Already logged in.', 'info');
        } else if (refreshToken) {
            showUserMessage('Refreshing Spotify session...', 'info');
            const refreshed = await attemptTokenRefresh();
            if (!refreshed) {
                updateUIForLoggedOut();
                return;
            }
        } else {
            updateUIForLoggedOut();
            return;
        }

        updateUIForLoggedIn();
        await analyzeFixedPlaylist();
    }

    initApp();

    // Resolves Spotify user IDs to display names using the Spotify Web API.
    // Returns an array of objects: [{ userId, displayName }]
    async function resolveUserDisplayNames(userIds, accessToken) {
        const results = [];

        for (const userId of userIds) {
            try {
                console.log(`[resolveUserDisplayNames] Fetching user: ${userId}`); // <-- Log userId being fetched
                const res = await fetch(`https://api.spotify.com/v1/users/${encodeURIComponent(userId)}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (!res.ok) throw new Error('Request failed');
                const data = await res.json();
                console.log(`[resolveUserDisplayNames] Success:`, data); // <-- Log user data
                results.push({
                    userId,
                    displayName: data.display_name || userId
                });
            } catch (e) {
                console.error(`[resolveUserDisplayNames] Error for user ${userId}:`, e); // <-- Log error
                results.push({
                    userId,
                    displayName: userId
                });
            }
        }

        return results;
    }
});

