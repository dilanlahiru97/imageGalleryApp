Cordova Image Gallery AppA simple, cross-platform mobile application built with Apache Cordova that allows users to capture or select images, upload them to Cloudinary, and manage them in a gallery backed by Firebase Realtime Database.
FeaturesImage Capture: Take photos using the device's native camera.Image Selection: Pick existing images from the device's photo library.Cloud Upload: Images are uploaded to a Cloudinary account for efficient storage and delivery.Realtime Database: Image URLs and metadata are stored and synced with Firebase Realtime Database.Gallery View: View all uploaded images in a simple, responsive grid.Image Management: Permanently delete images from both Firebase and Cloudinary.Image Viewer: Click on a gallery image to view it in a full-screen pop-up modal.Technology StackCore Framework: Apache CordovaFrontend: HTML, CSS, Plain JavaScriptCloud Storage: CloudinaryDatabase: Firebase Realtime DatabaseSecure Deletion Backend: Vercel Serverless Function (Recommended)Installation and Setup Guide (Recommended Secure Method)This recommended setup uses a Vercel serverless function to securely delete images and protect your API keys.Step 1: Configure Vercel Environment VariablesTo keep your Cloudinary secrets safe, store them as Environment Variables in your Vercel project dashboard.Navigate to your project's Settings -> Environment Variables.Add the following three variables:CLOUDINARY_CLOUD_NAMECLOUDINARY_API_KEYCLOUDINARY_API_SECRETEnsure your Vercel delete-image.js function reads these variables using process.env.Step 2: Configure Local ApplicationCreate www/js/config.js: Create this file and paste in the structure below, filling it with your actual keys.// www/js/config.js
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
    delete_api_url: 'https://YOUR_VERCEL_APP_URL/api/delete-image'
  }
};
Create .gitignore: In your project's root folder, create a .gitignore file to prevent secrets and build artifacts from being uploaded to GitHub.# Node modules
/node_modules/

# Cordova build folders
/platforms/
/plugins/

# Secret keys file
/www/js/config.js
Update index.html: Load the new config file by adding <script src="js/config.js"></script> right before the existing <script src="js/index.js"></script> tag. Your index.js should use the AppConfig object for all configurations.Step 3: Install Dependencies and BuildAdd Platform:cordova platform add android
Install Plugins: Run cordova prepare to automatically read config.xml and install all required plugins.cordova prepare
Build and Run:cordova build android
cordova run android --device
Alternative Setup (Insecure Direct Deletion)🔴 WARNING: DO NOT USE THIS IN PRODUCTION. This method exposes your Cloudinary API Secret in the client-side app, creating a major security risk. It is intended only for personal testing if you avoid setting up a Vercel server.Step 1: Add Hashing LibraryAdd the crypto-js library to the <head> of www/index.html.<script src="[https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js](https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js)"></script>
Step 2: Modify index.jsAdd your Cloudinary credentials directly to the top of index.js and replace the deleteImage function with the insecure version that builds the delete signature on the client side.// ADD THESE CONSTANTS AT THE TOP OF index.js
const CLOUDINARY_API_KEY = 'YOUR_CLOUDINARY_API_KEY';
const CLOUDINARY_API_SECRET = 'YOUR_CLOUDINARY_API_SECRET';
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';

// Replace the existing deleteImage function
function deleteImage(firebaseKey, publicId) {
  // ... (insert insecure delete function code here) ...
}
Ensure you replace the placeholder values with your actual Cloudinary credentials.
