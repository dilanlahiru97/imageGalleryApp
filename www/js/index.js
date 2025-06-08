// Event listener for when the device is ready
document.addEventListener("deviceready", onDeviceReady, false);

// Cloudinary configuration constants
const CLOUDINARY_URL = AppConfig.cloudinary.url;
const CLOUDINARY_UPLOAD_PRESET = AppConfig.cloudinary.upload_preset;

/**
 * Function called when the Cordova device is ready.
 * Initializes Firebase and sets up event listeners for buttons.
 */
function onDeviceReady() {
  console.log("Cordova is ready and device features can be used.");
  checkAndRequestStoragePermission();

  // Firebase configuration
  const firebaseConfig = AppConfig.firebase;

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized.");

  // Add event listeners to buttons
  document
    .getElementById("pickBtn")
    .addEventListener("click", () =>
      captureImage(Camera.PictureSourceType.PHOTOLIBRARY)
    );
  document
    .getElementById("cameraBtn")
    .addEventListener("click", () =>
      captureImage(Camera.PictureSourceType.CAMERA)
    );
  document.getElementById("loadGallery").addEventListener("click", loadGallery);
}
function checkAndRequestStoragePermission() {
  const permission =
    cordova.plugins.diagnostic.permission.WRITE_EXTERNAL_STORAGE;

  cordova.plugins.diagnostic.getPermissionAuthorizationStatus(
    function (status) {
      if (status === cordova.plugins.diagnostic.permissionStatus.GRANTED) {
        console.log("Storage permission already granted.");
      } else {
        cordova.plugins.diagnostic.requestRuntimePermission(
          function (result) {
            if (
              result === cordova.plugins.diagnostic.permissionStatus.GRANTED
            ) {
              console.log("Storage permission granted.");
            } else {
              alert(
                "Storage permission denied. You might not be able to download images."
              );
            }
          },
          function (error) {
            console.error("Storage permission request failed: " + error);
          },
          permission
        );
      }
    },
    function (error) {
      console.error("Error checking storage permission: " + error);
    },
    permission
  );
}

/**
 * Captures an image using the device camera or photo library.
 * @param {number} sourceType - The source type (Camera.PictureSourceType.CAMERA or Camera.PictureSourceType.PHOTOLIBRARY).
 */
function captureImage(sourceType) {
  if (!navigator.camera) {
    alert(
      "Camera plugin is not available. This feature might not work in a browser preview without Cordova."
    );
    console.error(
      "Camera plugin not found. Ensure it's installed and you're on a device/emulator."
    );
    return;
  }
  navigator.camera.getPicture(onSuccess, onFail, {
    quality: 80, // Image quality (0-100)
    destinationType: Camera.DestinationType.DATA_URL, // Return image as base64-encoded string
    sourceType: sourceType,
    encodingType: Camera.EncodingType.JPEG,
    targetWidth: 1200, // Optional: resize width
    targetHeight: 1200, // Optional: resize height
    correctOrientation: true, // Corrects image orientation
  });

  function onSuccess(imageData) {
    console.log("Image capture successful.");
    const base64Img = "data:image/jpeg;base64," + imageData;
    uploadToCloudinary(base64Img);
  }

  function onFail(message) {
    alert("Image capture failed: " + message);
    console.error("Image capture failed: " + message);
  }
}

/**
 * Uploads a base64 encoded image to Cloudinary.
 * @param {string} base64Image - The base64 encoded image string.
 */
function uploadToCloudinary(base64Image) {
  console.log("Starting upload to Cloudinary...");
  const data = new FormData();
  data.append("file", base64Image);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  fetch(CLOUDINARY_URL, {
    method: "POST",
    body: data,
  })
    .then((response) => {
      if (!response.ok) {
        // If response is not ok, try to parse error from Cloudinary
        return response
          .json()
          .then((errData) => {
            throw new Error(
              errData.error
                ? errData.error.message
                : `HTTP error! status: ${response.status}`
            );
          })
          .catch(() => {
            // If parsing error fails, throw a generic error
            throw new Error(`HTTP error! status: ${response.status}`);
          });
      }
      return response.json();
    })
    .then((data) => {
      if (data.secure_url && data.public_id) {
        console.log("Upload to Cloudinary successful:", data.secure_url);
        saveToFirebase(data.secure_url, data.public_id);
        alert("✅ Image uploaded successfully!");
      } else {
        console.error("Cloudinary upload failed. Response data:", data);
        alert("❌ Upload failed. Unexpected response from Cloudinary.");
      }
    })
    .catch((err) => {
      console.error("Error uploading to Cloudinary:", err);
      alert("❌ Upload error: " + err.message);
    });
}

/**
 * Saves the image URL and public ID to Firebase Realtime Database.
 * @param {string} imageUrl - The URL of the uploaded image from Cloudinary.
 * @param {string} publicId - The public ID of the image in Cloudinary.
 */
function saveToFirebase(imageUrl, publicId) {
  console.log("Saving image reference to Firebase...");
  const db = firebase.database();
  const imagesRef = db.ref("images"); // Reference to the 'images' node in Firebase
  imagesRef
    .push({
      url: imageUrl,
      public_id: publicId,
      timestamp: firebase.database.ServerValue.TIMESTAMP, // Store upload time
    })
    .then(() => {
      console.log("Image reference saved to Firebase.");
    })
    .catch((error) => {
      console.error("Error saving image reference to Firebase:", error);
      alert("Error saving image data to database: " + error.message);
    });
}

/**
 * Loads images from Firebase and displays them in the gallery.
 */
function loadGallery() {
  console.log("Loading gallery from Firebase...");
  const galleryElement = document.getElementById("gallery");
  galleryElement.innerHTML = "<p>Loading images...</p>"; // Show loading message

  const db = firebase.database();
  const imagesRef = db.ref("images");

  imagesRef.once(
    "value",
    (snapshot) => {
      galleryElement.innerHTML = ""; // Clear loading message or previous images
      if (!snapshot.exists()) {
        galleryElement.innerHTML =
          "<p>No images in the gallery yet. Upload some!</p>";
        console.log("No images found in Firebase.");
        return;
      }

      snapshot.forEach((childSnapshot) => {
        const imageKey = childSnapshot.key; // Firebase key for the image entry
        const imageData = childSnapshot.val();

        if (!imageData || !imageData.url) {
          console.warn("Skipping an image with no data or URL:", imageKey);
          return; // Skip if data is incomplete
        }

        // Create wrapper for image and buttons
        const wrapper = document.createElement("div");
        wrapper.classList.add("gallery-item-wrapper"); // Use class from HTML for styling

        // Create image element
        const img = document.createElement("img");
        img.src = imageData.url;
        img.alt = "Gallery Image"; // Accessibility: provide alt text

        img.onclick = () => openImageViewer(imageData.url);

        // Create delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ Delete";
        delBtn.classList.add("delete-btn"); // Add class for styling
        delBtn.onclick = () => deleteImage(imageKey, imageData.public_id);

        // Create download button
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "⬇️ Download";
        downloadBtn.classList.add("download-btn"); // Add class for styling
        downloadBtn.onclick = () =>
          downloadImage(
            imageData.url,
            imageData.public_id || `image_${imageKey}`
          );

        // Append elements to wrapper, then wrapper to gallery
        wrapper.appendChild(img);
        wrapper.appendChild(delBtn);
        wrapper.appendChild(downloadBtn);
        galleryElement.appendChild(wrapper);
      });
      console.log("Gallery loaded.");
    },
    (error) => {
      console.error("Error loading gallery from Firebase:", error);
      galleryElement.innerHTML =
        "<p>Error loading images. Please try again.</p>";
      alert("Error loading gallery: " + error.message);
    }
  );
}

/**
 * Initiates the download of an image.
 /**
 * Initiates the download of an image with DETAILED LOGGING.
/**
 * Initiates the download of an image using the File and MediaScanner plugins.
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} publicId - The public ID, used for naming the file.
 */
function downloadImage(imageUrl, publicId) {
  fetch(imageUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then((blob) => {
      const fileName = (publicId || "image_" + Date.now()) + ".jpg";

      // Step 1: Get access to the root of the external storage.
      window.resolveLocalFileSystemURL(
        cordova.file.externalRootDirectory,
        function (rootDir) {
          console.log("Successfully accessed root storage directory.");

          // Step 2: Get or create the 'Download' directory.
          rootDir.getDirectory(
            "Download",
            { create: true },
            function (downloadDir) {
              console.log(
                "Successfully accessed/created the Download directory."
              );

              // Step 3: Get or create the file handle.
              downloadDir.getFile(
                fileName,
                { create: true },
                function (fileEntry) {
                  console.log("File handle created:", fileEntry.name);

                  // Step 4: Create a FileWriter to write to the file.
                  fileEntry.createWriter(
                    function (fileWriter) {
                      // This function runs when the write is complete.
                      fileWriter.onwriteend = function () {
                        console.log("File successfully written to device.");
                        alert("✅ Image saved to your 'Download' folder!");
                      };

                      // This function runs if an error occurs.
                      fileWriter.onerror = function (e) {
                        console.error("Failed to write file:", e.toString());
                        alert("❌ Failed to save file.");
                      };

                      // Step 5: Write the downloaded image data (the blob) into the file.
                      fileWriter.write(blob);
                    },
                    (err) => {
                      alert("Failed to create file writer.");
                      console.error("Error creating file writer:", err);
                    }
                  );
                },
                (err) => {
                  alert("Failed to create the final file.");
                  console.error("Error creating file:", err);
                }
              );
            },
            (err) => {
              alert("Failed to create the Download directory.");
              console.error("Error creating Download directory:", err);
            }
          );
        },
        (err) => {
          alert("Failed to access device storage.");
          console.error("Error resolving file system URL:", err);
        }
      );
    })
    .catch((err) => {
      console.error("Failed to download image blob:", err);
      alert("Failed to download image: " + err.message);
    });
}
/**
 * Deletes an image from Firebase and attempts to delete from Cloudinary via a serverless function.
 * @param {string} firebaseKey - The key of the image entry in Firebase.
 * @param {string} publicId - The public ID of the image in Cloudinary.
 */
function deleteImage(firebaseKey, publicId) {
  if (
    !confirm(
      "Are you sure you want to delete this image? This action cannot be undone."
    )
  ) {
    return; // User cancelled the deletion
  }
  console.log(
    `Attempting to delete image. Firebase key: ${firebaseKey}, Cloudinary public_id: ${publicId}`
  );

  const db = firebase.database();
  // 1. Remove from Firebase
  db.ref("images/" + firebaseKey)
    .remove()
    .then(() => {
      console.log("Image reference removed from Firebase.");
      // 2. Send request to Vercel API (or your backend) to remove from Cloudinary
      // Ensure your serverless function URL is correct and handles Cloudinary deletion.
      return fetch(AppConfig.vercel.delete_api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId }),
      });
    })
    .then((response) => {
      if (!response.ok) {
        // If response is not ok, try to parse error from the delete API
        return response
          .json()
          .then((errData) => {
            throw new Error(
              errData.message ||
                `Cloudinary deletion API error! status: ${response.status}`
            );
          })
          .catch(() => {
            throw new Error(
              `Cloudinary deletion API error! status: ${response.status}`
            );
          });
      }
      return response.json();
    })
    .then((result) => {
      if (
        result.result === "ok" ||
        (result.message && result.message.includes("Successfully deleted"))
      ) {
        console.log("Image successfully deleted from Cloudinary.");
        alert(
          "✅ Image deleted successfully from both Firebase and Cloudinary."
        );
      } else {
        console.warn(
          "Firebase entry deleted, but Cloudinary deletion might have failed or returned unexpected result:",
          result
        );
        alert(
          "⚠️ Image removed from app list, but Cloudinary deletion may have issues: " +
            (result.error ? result.error.message : JSON.stringify(result))
        );
      }
      loadGallery(); // Refresh the gallery to reflect changes
    })
    .catch((err) => {
      console.error("Error during deletion process:", err);
      alert(
        "❌ Error deleting image: " +
          err.message +
          "\nThe image may still be listed if deletion from Firebase failed, or it might be orphaned in Cloudinary."
      );
      loadGallery(); // Refresh gallery anyway to show current state from Firebase
    });
}

/**
 * Opens the image viewer modal with the selected image.
 * @param {string} imageUrl - The URL of the image to display.
 */
function openImageViewer(imageUrl) {
  const modal = document.getElementById("image-viewer");
  const modalImg = document.getElementById("modal-image");

  modalImg.src = imageUrl;
  modal.style.display = "flex"; // Use 'flex' to help with centering

  // Get the close button and add event listener
  const closeBtn = document.querySelector(".close-btn");
  closeBtn.onclick = closeImageViewer;

  // Also close if user clicks on the background
  modal.onclick = function (event) {
    if (event.target === modal) {
      closeImageViewer();
    }
  };
}

/**
 * Closes the image viewer modal.
 */
function closeImageViewer() {
  const modal = document.getElementById("image-viewer");
  modal.style.display = "none";
}
