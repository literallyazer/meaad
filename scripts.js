// Constants
const API_KEY = '8LcaY6ntOG7zO0S8Z8fnIjrVUn62cbUP';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let lastSearchResults = [];

// DOM Elements and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Remove preloader after content loads
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }, 1000);
    }

    initializeEventListeners();
    initializeTheme();
    displayFavorites();
    updateCategoryFilter();
    
    // Initialize AOS animations
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Initialize cursor
    initializeCursor();

    // Load initial events (optional)
    //fetchEventsByLocation('New York', false);

    // Initialize tab functionality
    initializeTabs();
});

// Tab functionality
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.search-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const content = document.querySelector(`[data-content="${btn.dataset.tab}"]`);
            if (content) content.classList.add('active');
        });
    });
}

// Cursor initialization
function initializeCursor() {
    const cursor = document.querySelector('.cursor-outer');
    const cursorDot = document.querySelector('.cursor-inner');

    if (!cursor || !cursorDot) return;

    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    let dotX = -100;
    let dotY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        dotX += (mouseX - dotX) * 0.5;
        dotY += (mouseY - dotY) * 0.5;

        cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
        cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorDot.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        cursorDot.style.opacity = '1';
    });

    const clickables = document.querySelectorAll('a, button, .event-card, .category-card, input, select');
    clickables.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(1.5)`;
            cursorDot.style.opacity = '0';
        });
        element.addEventListener('mouseleave', () => {
            cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(1)`;
            cursorDot.style.opacity = '1';
        });
    });
}

// Loading animation
function showLoading() {
    let loading = document.getElementById('loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading';
        loading.className = 'loading-animation';
        loading.innerHTML = `
            <div class="loading-spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
            <p>Loading events...</p>
        `;
        document.body.appendChild(loading);
    }
    loading.style.display = 'flex';
    loading.style.opacity = '1';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
        }, 300);
    }
}

function initializeEventListeners() {
    document.getElementById('geolocation-button')?.addEventListener('click', handleGeolocation);
    document.getElementById('manual-search-button')?.addEventListener('click', handleManualSearch);
    
    document.getElementById('category-filter')?.addEventListener('change', (e) => {
        const location = document.getElementById('location-input')?.value;
        if (location) {
            showLoading();
            fetchEventsByLocation(location, false);
        }
    });

    document.getElementById('price-range')?.addEventListener('input', updatePriceDisplay);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.addEventListener('keydown', handleKeyboardShortcuts);

    document.querySelector('.shop-now')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
    });
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.querySelector('i').classList.toggle('fa-bars');
            menuToggle.querySelector('i').classList.toggle('fa-times');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').classList.add('fa-bars');
                menuToggle.querySelector('i').classList.remove('fa-times');
            });
        });
    }
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

// Category Filter Update
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.innerHTML = `
            <option value="">All Categories</option>
            <option value="Music">Music</option>
            <option value="Sports">Sports</option>
            <option value="Arts & Theatre">Arts & Theatre</option>
            <option value="Family">Family</option>
            <option value="Comedy">Comedy</option>
            <option value="Film">Film</option>
            <option value="Miscellaneous">Miscellaneous</option>
        `;
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
    let location = locationInput?.value || '';
    
    if (location.trim()) {
        location = location.trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s,-]/g, '');
        
        showLoading();
        fetchEventsByLocation(location, false);
    } else {
        alert('Please enter a location');
    }
}

// Event Fetching
async function fetchEventsByLocation(location, isCoordinates) {
    showLoading();
    try {
        const category = document.getElementById('category-filter')?.value || '';
        const maxPrice = document.getElementById('price-range')?.value || '1000';

        let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&size=20`;

        if (isCoordinates) {
            url += `&latlong=${location}&radius=50`;
        } else {
            url += `&keyword=${encodeURIComponent(location)}`;
        }

        if (category && category !== 'All') {
            url += `&classificationName=${encodeURIComponent(category)}`;
        }

        url += '&sort=date,asc';

        const response = await fetch(url);
        const data = await response.json();

        if (data._embedded && data._embedded.events) {
            lastSearchResults = filterEventsByPrice(data._embedded.events, maxPrice);
            displayEvents(lastSearchResults);
        } else {
            await fallbackSearch(location, category, maxPrice);
        }
    } catch (error) {
        console.error('Search error:', error);
        showErrorMessage(error);
    } finally {
        hideLoading();
    }
}

async function fallbackSearch(location, category, maxPrice) {
    try {
        let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&size=20`;
        url += `&city=${encodeURIComponent(location)}`;
        
        if (category && category !== 'All') {
            url += `&classificationName=${encodeURIComponent(category)}`;
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
        console.error('Fallback search error:', error);
        showNoEventsMessage();
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
            <button class="share-btn" onclick="shareToInstagram(event, this)">
        <i class="fab fa-instagram"></i>
    </button>
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
    displayEvents(lastSearchResults);
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
        e.preventDefault();
        toggleTheme();
    }
}

function showNoEventsMessage() {
    const container = document.getElementById('events-container');
    if (container) {
        container.innerHTML = `
            <div class="no-events-message">
                <i class="fas fa-search" style="font-size: 2em; margin-bottom: 1rem;"></i>
                <p>No events found for this location.</p>
                <p style="font-size: 0.9em; color: #666;">Try:</p>
                <ul style="list-style: none; padding: 0;">
                    <li>• Checking the spelling of the city</li>
                    <li>• Using a nearby larger city</li>
                    <li>• Removing filters</li>
                    <li>• Using the geolocation feature</li>
                </ul>
            </div>
        `;
    }
}

function showErrorMessage(error) {
    const container = document.getElementById('events-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>Error: ${error.message}</p>
                <p>Please try again later</p>
            </div>
        `;
    }
}
// Add this to your existing JavaScript

function initializeAbout() {
    const aboutLink = document.querySelector('a[href="#about"]');
    const aboutSection = document.querySelector('.about-overlay');
    const closeButton = document.querySelector('.close-about');

    if (aboutLink && aboutSection && closeButton) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutSection.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeButton.addEventListener('click', () => {
            aboutSection.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && aboutSection.classList.contains('active')) {
                aboutSection.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // ... your existing code ...
    initializeAbout();
});
// Add this with your other functions
async function shareToInstagram(e, button) {
    e.preventDefault();
    
    // Get event details from the card
    const card = button.closest('.event-card');
    const title = card.querySelector('.event-title').textContent;
    const image = card.querySelector('img').src;
    const date = card.querySelector('.event-date').textContent;
    const venue = card.querySelector('.event-venue').textContent;

    try {
        // Create a canvas to combine image and text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 1080; // Instagram preferred size
        canvas.height = 1080;
        
        // Load the event image
        const img = new Image();
        img.crossOrigin = "anonymous"; // Enable CORS
        
        img.onload = async () => {
            // Draw background
            ctx.fillStyle = '#121212';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image
            const scale = Math.max(canvas.width / img.width, canvas.height / img.width);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // Add gradient overlay
            const gradient = ctx.createLinearGradient(0, canvas.height/2, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width/2, canvas.height - 200);
            
            ctx.font = '32px Poppins';
            ctx.fillText(`${date} at ${venue}`, canvas.width/2, canvas.height - 120);
            
            // Add Meead watermark
            ctx.font = '24px Poppins';
            ctx.fillText('Discover more events at Meead', canvas.width/2, canvas.height - 50);
            
            try {
                // Convert canvas to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                
                // Create sharing URL
                const filesArray = [new File([blob], 'event.png', { type: 'image/png' })];
                
                // Check if Web Share API is supported
                if (navigator.share && navigator.canShare({ files: filesArray })) {
                    await navigator.share({
                        files: filesArray,
                        title: title,
                        text: `Check out this event: ${title} on ${date} at ${venue}\n\nDiscover more events at Meead!`
                    });
                } else {
                    // Fallback for browsers that don't support Web Share API
                    const shareUrl = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = shareUrl;
                    a.download = 'event.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } catch (error) {
                console.error('Error sharing:', error);
                alert('Unable to share to Instagram. You can screenshot the event instead!');
            }
        };
        
        img.src = image;
        
    } catch (error) {
        console.error('Error preparing share:', error);
        alert('Unable to prepare image for sharing. Please try again!');
    }
}
// Particle System and Advanced Animations
class ParticleSystem {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Setup
        this.canvas.classList.add('particle-canvas');
        document.body.prepend(this.canvas);
        this.resize();
        this.setupEventListeners();
        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speedX: Math.random() * 2 - 1,
                speedY: Math.random() * 2 - 1,
                color: `rgba(108, 99, 255, ${Math.random() * 0.5})`
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Mouse interaction
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                particle.x -= dx * 0.03;
                particle.y -= dy * 0.03;
            }

            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

            // Draw connections
            this.particles.forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(108, 99, 255, ${0.1 * (1 - distance/100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.stroke();
                }
            });
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Smooth Scroll with Parallax
class SmoothScroll {
    constructor() {
        this.current = 0;
        this.target = 0;
        this.ease = 0.075;
        this.container = document.querySelector('.scroll-container');
        this.setupStyles();
        this.setupEventListeners();
        this.animate();
    }

    setupStyles() {
        document.body.style.height = `${this.container.getBoundingClientRect().height}px`;
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
    }

    setupEventListeners() {
        window.addEventListener('scroll', () => {
            this.target = window.scrollY;
        });

        window.addEventListener('resize', () => {
            document.body.style.height = `${this.container.getBoundingClientRect().height}px`;
        });
    }

    animate() {
        this.current = lerp(this.current, this.target, this.ease);
        this.current = parseFloat(this.current.toFixed(2));
        
        const transform = `translateY(-${this.current}px)`;
        this.container.style.transform = transform;

        // Parallax effect for elements with .parallax class
        document.querySelectorAll('.parallax').forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = this.current * speed;
            element.style.transform = `translateY(${yPos}px)`;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Utility function for linear interpolation
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    new ParticleSystem();

    // Initialize smooth scroll
    new SmoothScroll();

    // Add parallax class to elements you want to animate
    document.querySelectorAll('.about-section, .event-card').forEach(el => {
        el.classList.add('parallax');
        el.dataset.speed = Math.random() * 0.2 + 0.1; // Random parallax speed
    });
});
