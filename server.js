const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Instagram Reel Download Endpoint
app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate Instagram URL
        if (!url.includes('instagram.com/reel/') && !url.includes('instagram.com/p/')) {
            return res.status(400).json({ error: 'Invalid Instagram Reel URL' });
        }

        // Fetch the Instagram page
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Extract video URL from meta tags
        let videoUrl = $('meta[property="og:video"]').attr('content') || 
                      $('meta[property="og:video:url"]').attr('content') ||
                      $('meta[name="twitter:player:stream"]').attr('content');

        // Alternative method: look for video tags
        if (!videoUrl) {
            videoUrl = $('video').first().attr('src');
        }

        // Extract thumbnail
        const thumbnail = $('meta[property="og:image"]').attr('content');

        if (!videoUrl) {
            return res.status(404).json({ error: 'Video not found. The reel might be private or the URL is invalid.' });
        }

        res.json({
            success: true,
            videoUrl: videoUrl,
            thumbnail: thumbnail,
            message: 'Reel downloaded successfully'
        });

    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: 'Reel not found. Please check the URL.' });
        }
        
        res.status(500).json({ 
            error: 'Failed to download reel. Please try again later.' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});