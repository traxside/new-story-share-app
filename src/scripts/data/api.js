import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`
};

// Register 
async function register(user) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const responseJson = await response.json();
    return responseJson;
  }
  catch (error) {
    console.error('Register error:', error.message);
    throw error;
  }
}

// LOGIN
async function login(user) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const responseJson = await response.json();
    return responseJson;
  } 
  catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

// STORIES
async function addNewStory(token, description, photoFile, lat = null, lon = null) {
  try {
    // FormData
    const formData = new FormData();

    // Add description
    formData.append('description', description);

    // Add photo file
    formData.append('photo', photoFile);

    // Add coordinates
    if (lat !== null) {
      formData.append('lat', lat);
    }
    if (lon !== null) {
      formData.append('lon', lon);
    }

    // Request
    const response = await fetch(ENDPOINTS.STORIES, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const responseJson = await response.json();
    return responseJson;
  }
  catch (error) {
    console.error('Add new story error:', error.message);
    throw error;
  }
}

// STORIES (GUEST)
async function addNewStoryGuest(description, photoFile, lat = null, lon = null) {
  try {
    // Make form data
    const formData = new FormData();

    // Add description
    formData.append('description', description);

    // Add photo file
    formData.append('photo', photoFile);

    // Add coordinates
    if (lat !== null) {
      formData.append('lat', lat);
    }
    if (lon !== null) {
      formData.append('lon', lon);
    }

    // Request 
    const response = await fetch(ENDPOINTS.STORIES_GUEST, {
      method: 'POST',
      body: formData,
    });

    const responseJson = await response.json();
    return responseJson;
  }   
  catch (error) {
    console.error('Add new story guest error:', error.message);
    throw error;
  }
}

// GET STORIES
async function getAllStories(token, { page = null, size = null, location = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (page !== null) {
      params.append('page', page);
    }
    if (size !== null) {
      params.append('size', size);
    }
    if (location !== null) {
      params.append('location', location);
    }

    const url = `${ENDPOINTS.STORIES}${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const responseJson = await response.json();
    return responseJson;
  }
  catch (error) {
    console.error('Get all stories error:', error.message);
    throw error;
  }
}

// STORIES (with ID)
async function getStoryDetail(token, storyID) {
  try {
    const response = await fetch(`${ENDPOINTS.STORIES}/${storyID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const responseJson = await response.json();
    return responseJson;
  }
  catch (error) {
    console.error('Get story detail error:', error.message);
    throw error;
  }
}

async function subscribeNotification(token, subscription) {
  try {
    const response = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      }),
    });

    const responseJson = await response.json();
    return responseJson;
  }
  catch (error) {
    console.error('Subscribe notification error:', error.message);
    throw error;
  }
}

async function unsubscribeNotification(token, endpoint) {
  try {
    const response = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: endpoint,
      }),
    });
      
    const responseJson = await response.json();
    return responseJson;
  }
  catch (error) {
    console.error('Unsubscribe notification error:', error.message);
    throw error;
  }
}

export {
  register,
  login,
  addNewStory,
  addNewStoryGuest,
  getAllStories,
  getStoryDetail,
  subscribeNotification,
  unsubscribeNotification
};