# This PowerShell script updates existing frontend files in the 'trackerr/public' directory
# to implement the new "Music Insights Dashboard" UI with adjusted artist/genre display
# and enhanced responsiveness.

# Define the root directory for the project. Make sure this matches your project setup.
$projectRoot = ".\trackerr"
$publicDir = Join-Path $projectRoot "public"

# Verify the project root and public directories exist
if (-not (Test-Path $projectRoot -PathType Container)) {
    Write-Error "Error: The directory '$projectRoot' does not exist. Please ensure your project structure is correct."
    exit 1
}
if (-not (Test-Path $publicDir -PathType Container)) {
    Write-Error "Error: The directory '$publicDir' does not exist. Please ensure your project structure is correct."
    exit 1
}

# Define file paths
$indexHtmlPath = Join-Path $publicDir "index.html"
$styleCssPath = Join-Path $publicDir "style.css"
$scriptJsPath = Join-Path $publicDir "script.js"

Write-Host "Starting update of frontend UI files in '$publicDir' for new display and responsiveness..."

# --- Update public/index.html ---
Write-Host "Updating public/index.html..."
$indexHtmlContent = @'
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KamiLimu.inthe.Ears - Music Insights Dashboard</title>
    <!-- Feather Icons for iconography -->
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="dashboard">
        <!-- Left Sidebar -->
        <div class="sidebar">
            <div class="logo" id="app-logo">🎵 Music Insights</div>
            <nav>
                <div class="nav-item active">Home</div>
                <div class="nav-item">Tracks</div>
                <div class="nav-item">Contributors</div>
                <div class="nav-item">API Explorer</div>
                <div class="nav-item">Settings</div>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content" id="main-dashboard-content">
            <!-- Initial Login Prompt / Loading -->
            <div id="auth-section" class="header-section text-center">
                <h1 id="overview-title" class="overview-title">Welcome to KamiLimu.inthe.Ears</h1>
                <p id="auth-message" class="text-gray-400 mt-4">Please log in to analyze your Spotify playlist.</p>
                <button id="login-button" class="btn mt-6">Login with Spotify</button>
                <div id="loading-indicator" class="mt-8 text-green-400 font-semibold text-lg animate-pulse hidden">
                    <i data-feather="loader" class="inline-block align-middle animate-spin mr-2"></i> Loading data...
                </div>
                <div id="error-message" class="mt-8 text-red-500 font-semibold text-lg hidden">
                    <i data-feather="alert-triangle" class="inline-block align-middle mr-2"></i> An error occurred. Please try again later.
                </div>
            </div>

            <!-- Header Section (Dashboard Content - hidden until logged in) -->
            <div id="dashboard-header-section" class="header-section hidden">
                <h1 class="overview-title" id="playlist-overview-title">Playlist Overview</h1>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Tracks</div>
                        <div class="stat-number" id="total-tracks-stat">0</div>
                        <div class="stat-label">tracks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Top Artists</div>
                        <div class="stat-number" id="top-artists-count-stat">0</div>
                        <div class="stat-label">artists</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Top Genres</div>
                        <div class="stat-number" id="top-genres-count-stat">0</div>
                        <div class="stat-label">genres</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Top Contributors</div>
                        <div class="stat-number" id="top-contributors-count-stat">0</div>
                        <div class="stat-label">contributors</div>
                    </div>
                </div>
            </div>

            <!-- Main Charts/Lists Section (Dashboard Content - hidden until logged in) -->
            <div id="dashboard-charts-section" class="charts-section hidden">
                <div class="chart-container">
                    <div class="chart-title">Top 10 Artists</div>
                    <!-- Changed from bar-chart to a list display -->
                    <div class="artists-list" id="top-artists-list-display">
                        <p class="text-gray-500 text-center mt-4">Loading top artists...</p>
                    </div>
                </div>

                <div class="chart-container">
                    <div class="chart-title">Genre Distribution</div>
                    <!-- Changed from bar-chart to a list display -->
                    <div class="genres-list" id="genre-distribution-list">
                        <p class="text-gray-500 text-center mt-4">Loading genres...</p>
                    </div>
                </div>
            </div>

            <!-- API Explorer -->
            <div class="api-section">
                <div class="api-title">API Explorer</div>

                <div class="api-endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/playlist/analyze/<span class="text-green-400 font-mono italic">playlistId</span></div>
                    <div class="endpoint-desc">Analyzes the playlist to identify top artists, genres, and contributors.</div>
                    <div class="code-block">
{
  "topGenres": [
    { "genre": "afro soul", "count": 51 },
    { "genre": "amapiano", "count": 46 }
  ],
  "topArtists": [
    { "artist": "Brendan Ross", "count": 8 },
    { "artist": "Eminem", "count": 8 }
  ],
  "topContributors": [
    { "name": "Dr. C", "count": 70 },
    { "name": "Pepp🍂", "count": 24 }
  ]
}
                    </div>
                    <button class="btn copy-btn">Copy JSON</button>
                </div>

                <div class="api-endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/playlist/tracks/<span class="text-green-400 font-mono italic">playlistId</span></div>
                    <div class="endpoint-desc">Retrieve the listing of tracks in the playlist.</div>
                    <div class="code-block">
{
  "tracks": [
    {"name": "Midnight Cinema", "artist": "Dark Hearts", "album": "Synthwave Dreams", "release_date": "2023", "spotify_url": "https://open.spotify.com/track/..."}
  ]
}
                    </div>
                    <button class="btn copy-btn">Copy JSON</button>
                </div>

                <div class="api-endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/playlist/contributors/<span class="text-green-400 font-mono italic">playlistId</span></div>
                    <div class="endpoint-desc">Lists all contributors to the playlist.</div>
                    <div class="code-block">
[
  { "name": "Dr. C", "count": 70 },
  { "name": "Pepp🍂", "count": 24 }
]
                    </div>
                    <button class="btn copy-btn">Copy JSON</button>
                </div>
            </div>
        </div>

        <!-- Right Sidebar -->
        <div class="right-sidebar" id="right-sidebar-content">
            <!-- Playlist Tracks -->
            <div class="playlist-section">
                <div class="section-title">Playlist Tracks</div>
                <input type="text" class="search-box" id="track-search-box" placeholder="Search tracks">
                <div id="playlist-tracks-list">
                    <!-- Dynamic track items will go here -->
                    <p class="text-gray-500 text-center mt-4" id="tracks-loading-message">Loading tracks...</p>
                </div>
                <button id="show-all-tracks-btn" class="btn mt-4 hidden">Show All</button>
            </div>

            <!-- Contributors -->
            <div class="contributors-section">
                <div class="section-title">Who Added What</div>
                <div class="top-contributors" id="top-contributors-display">
                    <!-- Top contributors will go here -->
                    <p class="text-gray-500 text-center mt-4">Loading contributors...</p>
                </div>
                <div id="all-contributors-list" class="mt-4">
                    <!-- All contributors list will go here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Message element for showUserMessage -->
    <div id="user-message"></div>

    <script src="script.js"></script>
</body>
</html>
'@
Set-Content -Path $indexHtmlPath -Value $indexHtmlContent -Force
Write-Host "Updated public/index.html successfully."

# --- Update public/style.css ---
Write-Host "Updating public/style.css..."
$styleCssContent = @'
/* public/style.css */
/* Minimal reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0f0a; /* Dark green/black background */
    color: #ffffff;
    overflow-x: hidden; /* Prevent horizontal scrolling unless absolutely necessary for specific components */
}

/* Main Dashboard Layout */
.dashboard {
    display: grid;
    grid-template-columns: 250px 1fr 300px; /* Sidebar | Main Content | Right Sidebar */
    min-height: 100vh;
    gap: 20px;
    padding: 20px;
}

/* Left Sidebar */
.sidebar {
    background: #1a2520; /* Slightly lighter dark green */
    border-radius: 12px;
    padding: 20px;
    height: fit-content; /* Adjusts height to content */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 30px;
    font-weight: 600;
    font-size: 20px;
    color: #4ade80; /* Green highlight for logo */
}

.logo::before {
    content: '🎵'; /* Unicode musical note icon */
    font-size: 20px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    color: #8a9a8a; /* Muted grey for inactive nav items */
    cursor: pointer;
    transition: color 0.2s, background-color 0.2s;
    border-radius: 6px;
    font-weight: 500;
}

.nav-item:hover {
    color: #4ade80; /* Green on hover */
    background-color: rgba(74, 222, 128, 0.1); /* Subtle green background on hover */
}

.nav-item.active {
    color: #4ade80; /* Active green color */
    background-color: rgba(74, 222, 128, 0.2); /* More prominent green background for active */
    font-weight: 600;
}

.nav-item::before {
    width: 16px;
    height: 16px;
    /* Placeholder for icon, actual icons will be rendered by Feather Icons */
    /* content: '○'; */
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Main Content Area */
.main-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.header-section {
    background: linear-gradient(135deg, #2a4a3a, #1a3a2a); /* Dark green gradient */
    border-radius: 16px;
    padding: 40px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    text-align: center; /* For login section */
}

/* Abstract background shape for header */
.header-section::after {
    content: '';
    position: absolute;
    right: 20px;
    top: 20px;
    width: 100px;
    height: 100px;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 L30 90 L70 90 Z" fill="%23ffffff20"/></svg>'); /* Faint white triangle */
    opacity: 0.3;
    transform: rotate(45deg); /* Added rotation for more dynamic look */
}

.overview-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 10px;
    color: #ffffff;
}

.text-gray-400 { color: #a0aec0; } /* Tailwind-like class for muted text */
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.hidden { display: none; }
.inline-block { display: inline-block; }
.align-middle { vertical-align: middle; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.mr-2 { margin-right: 0.5rem; }
.text-green-400 { color: #4ade80; }
.text-red-500 { color: #ef4444; }
.font-semibold { font-weight: 600; }
.text-lg { font-size: 1.125rem; }


.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* Changed to 4 columns for all stats */
    gap: 20px;
    margin-top: 30px; /* Spacing from title */
}

.stat-card {
    text-align: center;
    background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent background */
    padding: 15px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-number {
    font-size: 28px; /* Slightly larger */
    font-weight: 700;
    color: #4ade80; /* Green highlight */
    margin-bottom: 5px;
}

.stat-label {
    color: #8a9a8a;
    font-size: 14px;
}

/* Charts Section (now also includes lists) */
.charts-section {
    display: grid;
    grid-template-columns: 2fr 1fr; /* Larger left chart, smaller right */
    gap: 20px;
}

.chart-container {
    background: #1a2520;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.chart-title {
    font-size: 18px; /* Slightly larger */
    font-weight: 600;
    margin-bottom: 20px;
    color: #ffffff; /* White title for better contrast */
}

/* Generic list styling for artists and genres */
.artists-list, .genres-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    list-style: none; /* Remove default list bullets */
    padding: 0;
    margin: 0;
    max-height: 250px; /* Limit height for scrolling if needed */
    overflow-y: auto;
}

.artists-list-item, .genres-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #2a3a2a;
    color: #ffffff;
    font-size: 14px;
}

.artists-list-item:last-child, .genres-list-item:last-child {
    border-bottom: none;
}

.artists-list-item-info, .genres-list-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.artists-list-item-name, .genres-list-item-name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.artists-list-item-details, .genres-list-item-details {
    color: #8a9a8a;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Adjustments for no bar charts */
.bar-chart { /* This class will still exist in HTML but its styles are overridden/ignored for lists */
    display: none;
}
.chart-labels { /* This class will still exist in HTML but its styles are overridden/ignored for lists */
    display: none;
}


/* API Explorer Section */
.api-section {
    background: #1a2520;
    border-radius: 12px;
    padding: 20px;
    margin-top: 0; /* No extra top margin as it's part of main-content gap */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.api-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #ffffff;
}

.api-endpoint {
    background: #0f1a0f;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid #2a3a2a;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.endpoint-method {
    color: #4ade80;
    font-weight: 600;
    font-size: 12px;
}

.endpoint-path {
    color: #ffffff;
    margin: 5px 0;
    font-family: monospace;
    font-size: 14px;
}

.endpoint-desc {
    color: #8a9a8a;
    font-size: 14px;
}

.code-block {
    background: #0a1a0a;
    border-radius: 6px;
    padding: 12px;
    margin: 10px 0;
    font-family: monospace;
    font-size: 12px;
    color: #4ade80;
    border: 1px solid #2a3a2a;
    overflow-x: auto; /* Allow scrolling for wide code blocks */
}

.btn {
    background: #4ade80;
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-right: 10px;
    transition: background 0.2s, transform 0.2s;
}

.btn:hover {
    background: #22c55e;
    transform: translateY(-2px);
}

.btn:active {
    transform: translateY(0);
}

.btn-secondary {
    background: transparent;
    color: #8a9a8a;
    border: 1px solid #2a3a2a;
}

.btn-secondary:hover {
    background: rgba(42, 58, 42, 0.3); /* Darker on hover */
    color: #ffffff;
}

/* Right Sidebar */
.right-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.playlist-section, .contributors-section, .tracks-section {
    background: #1a2520;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #ffffff;
}

.track-item, .contributor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #2a3a2a;
    transition: background-color 0.2s;
    cursor: pointer; /* Indicate clickable */
}

.track-item:hover, .contributor-item:hover {
    background-color: rgba(74, 222, 128, 0.1); /* Subtle green background on hover */
    border-radius: 6px; /* Apply border-radius on hover */
}
.track-item:last-child, .contributor-item:last-child {
    border-bottom: none;
}

.track-avatar, .contributor-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(45deg, #4ade80, #22c55e); /* Green gradient avatar */
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #000;
    flex-shrink: 0; /* Prevent shrinking */
}

.track-info, .contributor-info {
    flex: 1;
    overflow: hidden; /* Hide overflowing text */
}

.track-name, .contributor-name {
    font-weight: 600;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-artist, .contributor-role {
    color: #8a9a8a;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-time {
    color: #6a7a6a;
    font-size: 12px;
    flex-shrink: 0; /* Prevent shrinking */
}

.search-box {
    background: #0f1a0f;
    border: 1px solid #2a3a2a;
    border-radius: 8px;
    padding: 10px 15px;
    color: #ffffff;
    width: 100%;
    margin-bottom: 15px;
    outline: none; /* Remove default focus outline */
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-box:focus {
    border-color: #4ade80; /* Green border on focus */
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3); /* Green glow on focus */
}

.search-box::placeholder {
    color: #6a7a6a;
}

.top-contributors {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: space-around; /* Distribute items */
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
}

.top-contributor {
    text-align: center;
    flex: 1;
    min-width: 80px; /* Minimum width for contributor cards */
    max-width: 120px;
    padding: 5px;
}

.top-contributor-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(45deg, #4ade80, #22c55e);
    margin: 0 auto 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #000;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.top-contributor-name {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.top-contributor-tracks {
    font-size: 10px;
    color: #8a9a8a;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
    .dashboard {
        grid-template-columns: 200px 1fr 250px; /* Adjust column sizes */
        gap: 15px;
        padding: 15px;
    }
    .sidebar {
        padding: 15px;
    }
    .header-section {
        padding: 30px;
    }
    .overview-title {
        font-size: 28px;
    }
    .stats-grid {
        gap: 15px;
    }
    .stat-number {
        font-size: 24px;
    }
    .chart-container {
        padding: 15px;
    }
    .chart-title {
        font-size: 16px;
    }
    .api-section {
        padding: 15px;
    }
    .section-title {
        font-size: 16px;
    }
    .track-item, .contributor-item, .api-endpoint {
        padding: 10px;
    }
    .track-avatar, .contributor-avatar {
        width: 35px;
        height: 35px;
        font-size: 14px;
    }
    .top-contributor-avatar {
        width: 45px;
        height: 45px;
        font-size: 16px;
    }
}

@media (max-width: 768px) {
    .dashboard {
        grid-template-columns: 1fr; /* Stack columns on mobile */
        gap: 15px;
        padding: 15px;
    }
    .sidebar {
        width: 100%;
        position: relative;
        height: auto;
        padding: 15px;
    }
    .main-content, .right-sidebar {
        padding: 0; /* Remove padding as dashboard already has it */
    }
    .header-section {
        padding: 25px;
    }
    .overview-title {
        font-size: 24px;
    }
    .stats-grid {
        grid-template-columns: repeat(2, 1fr); /* 2 columns for stats on small screens */
        gap: 10px;
    }
    .charts-section {
        grid-template-columns: 1fr; /* Stack charts */
    }
    .chart-container {
        padding: 10px;
    }
    .bar-chart {
        height: 120px; /* Reduce chart height */
        gap: 5px;
    }
    .chart-labels {
        font-size: 10px;
    }
    .api-section {
        padding: 10px;
    }
    .api-endpoint {
        padding: 10px;
    }
    .section-title {
        font-size: 16px;
    }
    .search-box {
        padding: 8px 12px;
    }
    .track-item, .contributor-item {
        padding: 8px 0;
        gap: 8px;
    }
    .track-avatar, .contributor-avatar {
        width: 30px;
        height: 30px;
        font-size: 12px;
    }
    .top-contributor-avatar {
        width: 40px;
        height: 40px;
        font-size: 14px;
    }
    .btn {
        padding: 6px 12px;
        font-size: 14px;
    }
    .top-contributors {
        flex-direction: column; /* Stack top contributors vertically */
        align-items: center;
    }
    .top-contributor {
        width: 100%; /* Full width for stacked items */
        max-width: none;
        padding: 10px 0;
        border-bottom: 1px solid #2a3a2a;
    }
    .top-contributor:last-child {
        border-bottom: none;
    }
}
'@
Set-Content -Path $styleCssPath -Value $styleCssContent -Force
Write-Host "Updated public/style.css successfully."

# --- Update public/script.js ---
Write-Host "Updating public/script.js..."
$scriptJsContent = @'
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
    let allContributorsData = [];
    let allArtistsData = []; // To store full artist data including genres
    let allGenresData = []; // To store full genre data

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
            const response = await fetch(endpoint, { headers });
            if (!response.ok) {
                if (response.status === 401 && useAuth) {
                    console.log('Token expired or invalid, attempting refresh...');
                    const refreshed = await attemptTokenRefresh();
                    if (refreshed) {
                        headers['Authorization'] = `Bearer ${accessToken}`;
                        const retryResponse = await fetch(endpoint, { headers });
                        if (retryResponse.ok) {
                            return await retryResponse.json();
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
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            errorMessage.textContent = `Error: ${error.message}`;
            hideLoading(false);
            return null;
        }
    }

    /**
     * Attempts to refresh the Spotify access token.
     * @returns {Promise<boolean>} True if refresh was successful, false otherwise.
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
        topArtistsCountStat.textContent = analyzeData.topArtists ? analyzeData.topArtists.length : '0';
        topGenresCountStat.textContent = analyzeData.topGenres ? analyzeData.topGenres.length : '0';
        topContributorsCountStat.textContent = analyzeData.topContributors ? analyzeData.topContributors.length : '0';
        playlistOverviewTitle.textContent = "Playlist Overview";
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
        genreDistributionList.innerHTML = ''; // Clear previous content

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
                    <div class="genres-list-item-details">${genre.count} artists</div>
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

    /**
     * Renders the top contributors and the full list of contributors.
     * @param {Array<object>} contributors - Array of contributor objects { name, count }.
     */
    function renderContributors(contributors) {
        topContributorsDisplay.innerHTML = '';
        allContributorsList.innerHTML = '';

        if (!contributors || contributors.length === 0) {
            topContributorsDisplay.innerHTML = '<p class="text-gray-500 text-center mt-4">No contributor data available.</p>';
            return;
        }

        // Render Top 3 Contributors
        const topThreeContributors = contributors.slice(0, 3);
        topThreeContributors.forEach(user => {
            const topContributorDiv = document.createElement('div');
            topContributorDiv.className = 'top-contributor';
            topContributorDiv.innerHTML = `
                <div class="top-contributor-avatar">${getInitials(user.name)}</div>
                <div class="top-contributor-name">${user.name}</div>
                <div class="top-contributor-tracks">${user.count} tracks</div>
            `;
            topContributorsDisplay.appendChild(topContributorDiv);
        });

        // Render All Contributors List
        contributors.forEach(user => {
            const contributorItemDiv = document.createElement('div');
            contributorItemDiv.className = 'contributor-item';
            contributorItemDiv.innerHTML = `
                <div class="contributor-avatar">${getInitials(user.name)}</div>
                <div class="contributor-info">
                    <div class="contributor-name">${user.name}</div>
                    <div class="contributor-role">${user.count} tracks added</div>
                </div>
            `;
            allContributorsList.appendChild(contributorItemDiv);
        });
    }

    /**
     * Handles the analysis of the hardcoded playlist.
     */
    async function analyzeFixedPlaylist() {
        showLoading();
        let success = true;

        const analyzeData = await fetchData(`/playlist/analyze/${TARGET_PLAYLIST_ID}`);
        if (analyzeData) {
            allArtistsData = analyzeData.topArtists; // Store full artist data
            allGenresData = analyzeData.topGenres; // Store full genre data
            allContributorsData = analyzeData.topContributors; // Store for full list

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
        window.location.href = '/auth/login';
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
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const codeBlock = this.parentElement.querySelector('.code-block');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text:', err);
                    showUserMessage('Failed to copy text.', 'error');
                });
            }
        });
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

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
});
'@
Set-Content -Path $scriptJsPath -Value $scriptJsContent -Force
Write-Host "Updated public/script.js successfully."

Write-Host "`nAll frontend UI files have been updated in the 'trackerr/public' folder."
Write-Host "`nNext Steps:"
Write-Host "1. Ensure your backend server is running (npm run dev in the 'trackerr' directory)."
Write-Host "2. Open http://localhost:8888 (or your specified PORT) in your browser to see the new UI."
