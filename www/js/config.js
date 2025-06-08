const AppConfig = {
  // Your Firebase Configuration Object
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  // Your Cloudinary Configuration
  cloudinary: {
    url: 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload',
    upload_preset: 'YOUR_UPLOAD_PRESET'
  },
  
  // Your Vercel (or other backend) API for deleting images
  vercel: {
    delete_api_url: 'https://your-vercel-app.vercel.app/api/delete-image'
  }
};