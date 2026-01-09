const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

/**
 * Download video from YouTube URL and save it to local storage
 * @param {string} url - The YouTube URL of the video to download
 * @param {string} savePath - The path to save the video (optional, defaults to ./downloads/)
 * @returns {Promise<string>} - Returns the path where the video was saved
 */
const downloadVideo = async (url, savePath = null) => {
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
    
    // Set default save path if not provided
    if (!savePath) {
      const downloadsDir = path.join(__dirname, 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      savePath = path.join(downloadsDir, `${videoTitle}.mp4`);
    }

    console.log(`Downloading: ${info.videoDetails.title}`);
    console.log(`Saving to: ${savePath}`);

    // Download the video
    const videoStream = ytdl(url, {
      quality: 'highestvideo', // or 'highest' for best quality
      filter: 'videoandaudio', // or 'audioonly' for audio only
    });

    const writeStream = fs.createWriteStream(savePath);

    return new Promise((resolve, reject) => {
      videoStream.pipe(writeStream);

      videoStream.on('progress', (chunkLength, downloaded, total) => {
        const percent = (downloaded / total * 100).toFixed(2);
        process.stdout.write(`\rDownloaded: ${percent}%`);
      });

      writeStream.on('finish', () => {
        console.log('\n✅ Download completed!');
        resolve(savePath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

      videoStream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error downloading video:', error.message);
    throw error;
  }
};

// Example usage - download the specific video
const videoUrl = 'https://www.youtube.com/watch?v=mNWSnPypOcw';

downloadVideo(videoUrl)
  .then((savePath) => {
    console.log(`Video saved to: ${savePath}`);
  })
  .catch((error) => {
    console.error('Download failed:', error);
  });

module.exports = { downloadVideo };
