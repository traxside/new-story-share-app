import { subscribeNotification, unsubscribeNotification } from '../data/api';
import Auth from '../data/auth';
import { showAlert } from './index';

// Register the service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('Service Worker is not supported in this browser');
    return null;
  }
};

// Check if push is supported
const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check if the user has already subscribed to push notifications
const isUserSubscribed = async (swRegistration) => {
  if (!swRegistration) return false;
  
  const subscription = await swRegistration.pushManager.getSubscription();
  return subscription !== null;
};

// Subscribe user to push notification
const subscribeUserToPush = async (swRegistration) => {
  try {
    // Check if service worker is registered and push is supported
    if (!swRegistration || !isPushNotificationSupported()) {
      console.log('Push notification not supported');
      return;
    }
    
    // Check if user is already subscribed
    const isSubscribed = await isUserSubscribed(swRegistration);
    if (isSubscribed) {
      console.log('User is already subscribed to push notifications');
      return;
    }
    
    // Get token
    const token = Auth.getToken();
    if (!token) {
      console.log('User must be authenticated to subscribe to notifications');
      return;
    }

    // Get permission from user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // VAPID key from the API
    const vapidPublicKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    
    // Convert VAPID key to array buffer
    const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
    
    // Subscribe user
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    
    // Send subscription to server
    const response = await subscribeNotification(token, subscription);
    
    if (response.error) {
      console.error('Failed to subscribe to push notifications:', response.message);
      showAlert('Failed to subscribe to push notifications', 'error');
    } else {
      console.log('Successfully subscribed to push notifications');
      showAlert('Push notifications enabled!', 'success');
      return subscription;
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    showAlert('Error enabling push notifications', 'error');
  }
  
  return null;
};

// Unsubscribe user from push notification
const unsubscribeUserFromPush = async (swRegistration) => {
  try {
    // Check if service worker is registered
    if (!swRegistration) {
      console.log('Service worker not registered');
      return false;
    }
    
    // Get existing subscription
    const subscription = await swRegistration.pushManager.getSubscription();
    if (!subscription) {
      console.log('No subscription to unsubscribe from');
      return true;
    }
    
    // Get endpoint
    const endpoint = subscription.endpoint;
    
    // Get token
    const token = Auth.getToken();
    if (!token) {
      console.log('User must be authenticated to unsubscribe from notifications');
      return false;
    }
    
    // Unsubscribe from push
    const unsubscribed = await subscription.unsubscribe();
    
    if (unsubscribed) {
      // Inform server
      const response = await unsubscribeNotification(token, endpoint);
      
      if (response.error) {
        console.error('Failed to unsubscribe from server:', response.message);
        showAlert('Failed to unsubscribe from push notifications', 'error');
        return false;
      } else {
        console.log('Successfully unsubscribed from push notifications');
        showAlert('Push notifications disabled', 'success');
        return true;
      }
    } else {
      console.log('Failed to unsubscribe from push');
      return false;
    }
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    showAlert('Error disabling push notifications', 'error');
    return false;
  }
};

// Convert base64 string to UInt8Array
// Required to handle VAPID keys
const urlB64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};

// Toggle push notification subscription
const togglePushNotification = async (swRegistration, subscribeBtn) => {
  try {
    if (!swRegistration) {
      console.log('Service worker not registered');
      return;
    }
    
    const isSubscribed = await isUserSubscribed(swRegistration);
    
    if (isSubscribed) {
      // Unsubscribe
      const success = await unsubscribeUserFromPush(swRegistration);
      if (success && subscribeBtn) {
        subscribeBtn.textContent = 'Enable Notifications';
        subscribeBtn.classList.remove('btn-danger');
        subscribeBtn.classList.add('btn-primary');
      }
    } else {
      // Subscribe
      const subscription = await subscribeUserToPush(swRegistration);
      if (subscription && subscribeBtn) {
        subscribeBtn.textContent = 'Disable Notifications';
        subscribeBtn.classList.remove('btn-primary');
        subscribeBtn.classList.add('btn-danger');
      }
    }
  } catch (error) {
    console.error('Error toggling push notifications:', error);
    showAlert('Error managing push notifications', 'error');
  }
};

// Update button state based on subscription status
const updateSubscriptionButton = async (swRegistration, subscribeBtn) => {
  if (!subscribeBtn) return;
  
  try {
    const isSubscribed = await isUserSubscribed(swRegistration);
    
    if (isSubscribed) {
      subscribeBtn.textContent = 'Disable Notifications';
      subscribeBtn.classList.remove('btn-primary');
      subscribeBtn.classList.add('btn-danger');
    } else {
      subscribeBtn.textContent = 'Enable Notifications';
      subscribeBtn.classList.remove('btn-danger');
      subscribeBtn.classList.add('btn-primary');
    }
    
    subscribeBtn.disabled = false;
  } catch (error) {
    console.error('Error updating subscription button:', error);
    subscribeBtn.disabled = true;
  }
};

export {
  registerServiceWorker,
  isPushNotificationSupported,
  isUserSubscribed,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  togglePushNotification,
  updateSubscriptionButton
};