const { parentPort, workerData } = require('worker_threads');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Receive job details from the main thread
const { inputPath, outputDir, resolutions } = workerData;

// Define transcoding settings for ABS
const profiles = {
    '1080p': { size: '1920x1080', bitrate: '5000k' },
    '720p': { size: '1280x720', bitrate: '2800k' },
    '360p': { size: '640x360', bitrate: '800k' },
};

async function processVideo() {
    try {
        // Ensure the base directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';

        // Use a loop to sequentially process each resolution to avoid maxing out memory in one go
        for (const res of resolutions) {
            const profile = profiles[res];
            if (!profile) continue;

            const resDir = path.join(outputDir, res);
            if (!fs.existsSync(resDir)) {
                fs.mkdirSync(resDir);
            }

            const playlistName = 'index.m3u8';
            const outputPath = path.join(resDir, playlistName);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        `-profile:v main`,
                        `-vf scale=${profile.size}:force_original_aspect_ratio=decrease,pad=${profile.size}:(ow-iw)/2:(oh-ih)/2`,
                        `-b:v ${profile.bitrate}`,
                        `-maxrate ${profile.bitrate}`,
                        `-bufsize ${parseInt(profile.bitrate) * 2}k`,
                        `-c:a aac`,
                        `-b:a 128k`,
                        `-f hls`,
                        `-hls_time 10`,
                        `-hls_playlist_type vod`,
                        `-hls_segment_filename ${path.join(resDir, 'segment_%03d.ts')}`
                    ])
                    .output(outputPath)
                    .on('end', () => {
                        console.log(`Worker: Finished ${res} transcode`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`Worker: Error on ${res}:`, err.message);
                        reject(err);
                    })
                    .run();
            });

            // Append to master playlist
            const bandwidth = parseInt(profile.bitrate) * 1000;
            masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${profile.size}\n${res}/${playlistName}\n`;
        }

        // Write the master playlist
        const masterPath = path.join(outputDir, 'master.m3u8');
        fs.writeFileSync(masterPath, masterPlaylist);

        // Notify main thread of success
        parentPort.postMessage({ status: 'done', masterUrl: path.join(path.basename(outputDir), 'master.m3u8') });

    } catch (error) {
        parentPort.postMessage({ status: 'error', error: error.message });
    }
}

// Start processing immediately
processVideo();
