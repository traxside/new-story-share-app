export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showLoading(element) {
  element.innerHTML = `
    <div class="loading-container">
      <div class="lds-ripple"><div></div><div></div></div>
    </div>
  `;
}

export function showAlert(message, type = 'info', duration = 3000) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${type}`;
  alertContainer.textContent = message;
  
  document.body.appendChild(alertContainer);
  
  // Animation to show alert
  setTimeout(() => {
    alertContainer.classList.add('show');
  }, 100);
  
  // Remove alert after duration
  setTimeout(() => {
    alertContainer.classList.remove('show');
    setTimeout(() => {
      alertContainer.remove();
    }, 500);
  }, duration);
}

export function createStoryItemTemplate(story) {
  const hasLocation = story.lat && story.lon;
  
  return `
    <article class="story-item">
      <div class="story-image-container">
        <img class="story-image lazyload" 
          src="${story.photoUrl}" 
          alt="Story image from ${story.name}" 
          loading="lazy">
      </div>
      <div class="story-content">
      <h3 class="story-name">${story.name}</h3>
      <p class="story-description">${story.description}</p>
      <div class="story-meta">
      <p class="story-date">${showFormattedDate(story.createdAt)}</p>
      </div>
      <a href="#/story/${story.id}" class="story-link" aria-label="View details of story by ${story.name}">
        <span class="visually-hidden">View ${story.name}'s story</span>
      </a>
        ${hasLocation ? `
          <div class="story-map-container" data-id="${story.id}" data-lat="${story.lat}" data-lon="${story.lon}">
            <div class="story-inline-map" id="map-${story.id}"></div>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

export function initMap(containerId, options = {}) {
  // Default values for map initialization
  const defaultLocation = { lat: -6.2088, lng: 106.8456 }; // Jakarta
  const { lat, lng } = options.center || defaultLocation;
  const zoom = options.zoom || 10;
  
  const mapContainer = document.getElementById(containerId);
  if (!mapContainer) {
    console.error(`Map container with ID ${containerId} not found`);
    return null;
  }
  
  // Clear map 
  mapContainer.innerHTML = '';

  // Ensure the container has dimensions
  if (!mapContainer.style.height) {
    mapContainer.style.height = '400px';
  }
  if (!mapContainer.style.width) {
    mapContainer.style.width = '100%';
  }
  
  // Make sure Leaflet is available
  if (typeof L === 'undefined') {
    console.error('Leaflet library is not loaded');
    return null;
  }
  
  try {
    // Initialize map with specific options to fix rendering issues
    const map = L.map(containerId, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: true,
      zoomAnimation: true,
      fadeAnimation: true,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 18
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);
    
    setTimeout(() => {
      map.invalidateSize(true);
    }, 300);
    
    return map;
  } catch (error) {
    console.error('Error initializing map:', error);
    return null;
  }
}

// Create a visible marker
export function addMarker(map, lat, lng, options = {}) {
  if (!map) {
    console.error('Map is not initialized');
    return null;
  }
  
  try {
    const marker = L.marker([lat, lng], {
      draggable: options.draggable || false,
      title: options.title || 'Location',
      alt: options.alt || 'Location marker'
    }).addTo(map);
    
    // Add a popup 
    if (options.popupContent) {
      marker.bindPopup(options.popupContent).openPopup();
    }
    
    return marker;
  } catch (error) {
    console.error('Error adding marker:', error);
    return null;
  }
}

export function updateLocationDisplay(elementId, lat, lng, storyName = null) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div style="background-color: #f0f8ff; border-left: 4px solid #3498db; padding: 10px; margin: 10px 0; border-radius: 4px;">
        <strong>${storyName ? `${storyName}'s Story Location` : 'Location selected:'}</strong>
        <p>Lat: ${parseFloat(lat).toFixed(6)}, Lng: ${parseFloat(lng).toFixed(6)}</p>
      </div>
    `;
  }
}

export function createCameraElement(videoContainerId, snapshotContainerId) {
  let stream = null;
  let videoElement = null;
  
  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      const videoContainer = document.getElementById(videoContainerId);
      
      // Clear any existing content
      videoContainer.innerHTML = '';
      
      // Create video element
      videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true; // Important for iOS
      videoElement.muted = true;
      videoElement.classList.add('camera-preview');
      
      // Append to container
      videoContainer.appendChild(videoElement);
      
      // Wait for video to load before taking any measurements
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve();
        };
      });
      
      // Start playing
      await videoElement.play();
      
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Camera access denied. Please grant permission in your browser settings.'
        : `Could not access camera: ${error.message}`;
      
      document.getElementById(videoContainerId).innerHTML = `
        <div style="color: white; text-align: center; padding: 20px;">
          <p>${errorMessage}</p>
        </div>
      `;
      throw error;
    }
  };
  
  const takeSnapshot = () => {
    if (!videoElement || !stream) {
      console.error('Camera is not initialized');
      return null;
    }
    
    // Create canvas with video dimensions
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Show the snapshot
    const snapshotContainer = document.getElementById(snapshotContainerId);
    snapshotContainer.innerHTML = `
      <img src="${canvas.toDataURL('image/jpeg')}" alt="Camera snapshot" class="snapshot-preview">
    `;
    
    // Return as blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement = null;
    }
  };
  
  return {
    start: startCamera,
    takeSnapshot,
    stop: stopCamera
  };
}