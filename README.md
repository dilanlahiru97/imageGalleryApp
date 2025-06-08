# Cordova Image Gallery App

A simple, cross-platform mobile application built with Apache Cordova that allows users to capture or select images, upload them to Cloudinary, and manage them in a gallery backed by Firebase Realtime Database.

## Features

- **Image Capture:** Take photos using the device's native camera.
- **Image Selection:** Pick existing images from the device's photo library.
- **Cloud Upload:** Images are uploaded to a Cloudinary account for efficient storage and delivery.
- **Realtime Database:** Image URLs and metadata are stored and synced with Firebase Realtime Database.
- **Gallery View:** View all uploaded images in a simple, responsive grid.
- **Image Management:** Permanently delete images from both Firebase and Cloudinary.
- **Image Viewer:** Click on a gallery image to view it in a full-screen pop-up modal.

## Technology Stack

- **Core Framework:** [Apache Cordova](https://cordova.apache.org/)
- **Frontend:** HTML, CSS, Plain JavaScript
- **Cloud Storage:** [Cloudinary](https://cloudinary.com/)
- **Database:** [Firebase Realtime Database](https://firebase.google.com/products/realtime-database)
- **Secure Deletion Backend:** [Vercel Serverless Function](https://vercel.com/) (Recommended)

---

## Installation and Setup Guide (Recommended Secure Method)

This is the recommended setup for keeping your API keys safe. It uses a Vercel serverless function to handle the secure deletion of images from Cloudinary.

### Step 1: Deploy the Deletion Server to Vercel

The `delete-image.js` file is a serverless function that must be deployed to a cloud provider like Vercel.

1.  **Create a Backend Folder:** Outside your Cordova project folder, create a new folder for your backend code (e.g., `image-gallery-backend`).
2.  **Create an `api` Subfolder:** Inside the new backend folder, create another folder named `api`.
3.  **Move the File:** Place your `delete-image.js` file inside the `api` folder. The final path should be `image-gallery-backend/api/delete-image.js`.
4.  **Initialize the Project:** Open a terminal inside the `image-gallery-backend` folder and run the following commands to create a `package.json` file and install the Cloudinary dependency.
    ```bash
    npm init -y
    npm install cloudinary
    ```
5.  **Deploy to Vercel:** Make sure you have the Vercel CLI installed (`npm install -g vercel`). Then, from the `image-gallery-backend` folder, run the deploy command.
    ```bash
    vercel
    ```
    Follow the on-screen prompts. After deployment, Vercel will give you a production URL. **Copy this URL**, as you will need it in Step 3.

### Step 2: Configure Vercel Environment Variables

To keep your Cloudinary secrets safe, you must store them as Environment Variables in your Vercel project dashboard.

1.  Go to your newly created project's dashboard on the Vercel website.
2.  Go to **Settings** -> **Environment Variables**.
3.  Add three new variables:
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
4.  Ensure your Vercel `delete-image.js` function reads these variables using `process.env`.

### Step 3: Configure Local Cordova Application

1.  **Create `www/js/config.js`:** Create this file and paste in the structure below, filling it with your actual keys and the Vercel URL you copied in Step 1.

    ```javascript
    // www/js/config.js
    const AppConfig = {
      firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
      },
      cloudinary: {
        url: '[https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload](https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload)',
        upload_preset: 'YOUR_UPLOAD_PRESET'
      },
      vercel: {
        // Paste the URL from your Vercel deployment here
        delete_api_url: 'https://YOUR_VERCEL_APP_URL/api/delete-image'
      }
    };
    ```

2.  **Create `.gitignore`:** In your project's root folder, create a `.gitignore` file to prevent secrets and build artifacts from being uploaded to GitHub.

    ```
    # Node modules
    /node_modules/

    # Cordova build folders
    /platforms/
    /plugins/

    # Secret keys file
    /www/js/config.js
    ```

3.  **Update `index.html`:** Load the new config file by adding `<script src="js/config.js"></script>` right before the existing `<script src="js/index.js"></script>` tag. Your `index.js` should use the `AppConfig` object for all configurations.

### Step 4: Install Dependencies and Build

1.  **Add Platform:**
    ```bash
    cordova platform add android
    ```

2.  **Install Plugins:** Run `cordova prepare` to automatically read `config.xml` and install all required plugins.
    ```bash
    cordova prepare
    ```

3.  **Build and Run:**
    ```bash
    cordova build android
    cordova run android --device
    ```

---

## Alternative Setup (Insecure Direct Deletion)

**🔴 WARNING: DO NOT USE THIS METHOD IN A PRODUCTION APP.** This method exposes your Cloudinary `API Secret` inside your app, creating a major security vulnerability. Use this only for personal testing if you do not want to set up a Vercel server.

### **Step 1: Add Hashing Library**

Add the `crypto-js` library to `www/index.html` inside the `<head>` tag. This is required to create the secure signature Cloudinary needs.

```html
<head>
  <!-- ... -->
  <script src="[https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js](https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js)"></script>
  <!-- ... -->
</head>

Step 2: Modify index.js for Direct Deletion
Add your Cloudinary credentials directly to the top of index.js and replace the deleteImage function with the insecure version.
// ADD THESE CONSTANTS AT THE TOP OF index.js
const CLOUDINARY_API_KEY = 'YOUR_CLOUDINARY_API_KEY';
const CLOUDINARY_API_SECRET = 'YOUR_CLOUDINARY_API_SECRET';
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';

// Replace the existing deleteImage function
/**
 * [INSECURE] Deletes an image directly from Cloudinary.
 * WARNING: This method exposes your API Secret in the app. Not for production use.
 * @param {string} firebaseKey - The key of the image entry in Firebase.
 * @param {string} publicId - The public ID of the image in Cloudinary.
 */
function deleteImage(firebaseKey, publicId) {
  const confirmationMessage = 'Are you sure you want to permanently delete this image?';

  function onConfirm(buttonIndex) {
    if (buttonIndex !== 1) { // 1 is usually the "OK" or "Yes" button
      return; // User cancelled
    }

    // --- Cloudinary Deletion Logic ---
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = CryptoJS.SHA1(stringToSign).toString();

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const cloudinaryDestroyUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;

    // 1. Send request to Cloudinary to delete the file
    fetch(cloudinaryDestroyUrl, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.result === 'ok') {
        console.log('Image successfully deleted from Cloudinary.');
        
        // 2. If Cloudinary deletion is successful, delete from Firebase
        const db = firebase.database();
        return db.ref('images/' + firebaseKey).remove();
      } else {
        // If Cloudinary returns an error, throw it to the .catch block
        throw new Error(data.error ? data.error.message : 'Cloudinary deletion failed.');
      }
    })
    .then(() => {
      console.log('Image reference successfully removed from Firebase.');
      alert('✅ Image permanently deleted.');
      loadGallery(); // Refresh the gallery
    })
    .catch(err => {
      console.error('Error during deletion process:', err);
      alert('❌ Error deleting image: ' + err.message);
    });
  }

  // Check for native dialogs plugin
  if (navigator.notification && navigator.notification.confirm) {
    navigator.notification.confirm(confirmationMessage, onConfirm, 'Confirm Deletion', ['OK', 'Cancel']);
  } else {
    if (confirm(confirmationMessage)) {
      onConfirm(1);
    }
  }
}

Remember to replace the placeholder values with your actual Cloudinary credentials.

