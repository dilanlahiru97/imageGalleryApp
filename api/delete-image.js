const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // READS FROM VERCEL
  api_key: process.env.CLOUDINARY_API_KEY,         // READS FROM VERCEL
  api_secret: process.env.CLOUDINARY_API_SECRET,   // READS FROM VERCEL
});

module.exports = async (req, res) => {
  // CORS header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Handle preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_id } = req.body;

  if (!public_id) {
    return res.status(400).json({ error: 'Missing public_id' });
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
