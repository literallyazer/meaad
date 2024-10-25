// Constants
const API_KEY = '8LcaY6ntOG7zO0S8Z8fnIjrVUn62cbUP';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let lastSearchResults = [];

// DOM Elements and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeTheme();
    displayFavorites();
    
    // Initialize AOS animations
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
});

function initializeEventListeners() {
    // Main functionality buttons
    document.getElementById('geolocation-button')?.addEventListener('click', handleGeolocation);
    document.getElementById('manual-search-button')?.addEventListener('click', handleManualSearch);
    document.getElementById('category-filter')?.addEventListener('change', handleFilters);
    document.getElementById('price-range')?.addEventListener('input', updatePriceDisplay);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Add event listener to "Find Events" button in hero section
    document.querySelector('.shop-now')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
    });
}

// Theme Functions
function initializeTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        updateThemeIcon(currentTheme === 'dark-theme');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark-theme' : '');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Price Range Functions
function updatePriceDisplay() {
    const value = document.getElementById('price-range')?.value || '0';
    const priceDisplay = document.getElementById('price-value');
    if (priceDisplay) {
        priceDisplay.textContent = `Max Price: $${value}`;
    }
}

// Geolocation Handler
function handleGeolocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            position => fetchEventsByLocation(`${position.coords.latitude},${position.coords.longitude}`, true),
            error => {
                hideLoading();
                alert('Error getting location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

// Manual Search Handler
function handleManualSearch() {
    const locationInput = document.getElementById('location-input');
    const location = locationInput?.value || '';
    if (location.trim()) {
        showLoading();
        fetchEventsByLocation(location, false);
    } else {
        alert('Please enter a location');
    }
}

// Event Fetching
async function fetchEventsByLocation(location, isCoordinates) {
    try {
        const category = document.getElementById('category-filter')?.value || '';
        const maxPrice = document.getElementById('price-range')?.value || '1000';

        let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&size=20`;

        if (isCoordinates) {
            url += `&latlong=${location}&radius=50`;
        } else {
            url += `&keyword=${encodeURIComponent(location)}`;
        }

        if (category) {
            url += `&classificationName=${category}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data._embedded && data._embedded.events) {
            lastSearchResults = filterEventsByPrice(data._embedded.events, maxPrice);
            displayEvents(lastSearchResults);
        } else {
            showNoEventsMessage();
        }
    } catch (error) {
        showErrorMessage(error);
    } finally {
        hideLoading();
    }
}

// Filter Events by Price
function filterEventsByPrice(events, maxPrice) {
    return events.filter(event => {
        if (!event.priceRanges) return true;
        return event.priceRanges.some(range => range.min <= maxPrice);
    });
}

// Display Events
function displayEvents(events) {
    const container = document.getElementById('events-container');
    if (!container) return;
    
    container.innerHTML = '';

    events.forEach((event, index) => {
        const card = createEventCard(event);
        card.classList.add('animate__animated', 'animate__fadeIn');
        card.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(card);
    });
}

// Create Event Card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const isFavorite = favorites.some(fav => fav.id === event.id);
    
    card.innerHTML = `
        <div class="card-image-container">
            <img src="${event.images[0].url}" alt="${event.name}" loading="lazy">
        </div>
        <div class="card-content">
            <h3 class="event-title">${event.name}</h3>
            <div class="event-details">
                <p class="event-date">${formatDate(event.dates.start.localDate)}</p>
                <p class="event-venue">${event._embedded?.venues[0]?.name || 'Venue TBA'}</p>
                ${event.priceRanges ? 
                    `<p class="event-price">Price: $${event.priceRanges[0].min} - $${event.priceRanges[0].max}</p>` : 
                    '<p class="event-price">Price: TBA</p>'}
            </div>
            <div class="card-actions">
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                    onclick="toggleFavorite(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}"></i>
                </button>
                <a href="${event.url}" target="_blank" class="ticket-btn">Get Tickets</a>
            </div>
        </div>
    `;
    
    return card;
}

// Favorite Functions
function toggleFavorite(e, event) {
    e.stopPropagation();
    const index = favorites.findIndex(fav => fav.id === event.id);
    
    if (index === -1) {
        favorites.push(event);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
    displayEvents(lastSearchResults); // Refresh current events display
}

function displayFavorites() {
    const container = document.getElementById('favorites-container');
    if (!container) return;
    
    container.innerHTML = favorites.length ? 
        favorites.map(event => `
            <div class="favorite-item animate__animated animate__fadeIn">
                <span>${event.name}</span>
                <button onclick="toggleFavorite(event, ${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    <i class="fas fa-times"></i>
                 </button>
            </div>
        `).join('') :
        '<p>No favorite events yet</p>';
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('location-input')?.focus();
    }
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault(); // Prevent default behavior
        toggleTheme();
    }
}

function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'block';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showNoEventsMessage() {
    const container = document.getElementById('events-container');
    if (container) {
        container.innerHTML = '<p class="no-events">No events found for this location.</p>';
    }
}

function showErrorMessage(error) {
    const container = document.getElementById('events-container');
    if (container) {
        container.innerHTML = `<p class="error">Error fetching events: ${error.message}</p>`;
    }
}