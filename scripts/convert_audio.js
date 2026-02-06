import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const musicDir = path.join(__dirname, '../public/musics');

// Helper to convert a single file
const convertFile = (file) => {
    return new Promise((resolve, reject) => {
        if (path.extname(file) !== '.wav') {
            resolve();
            return;
        }

        const inputPath = path.join(musicDir, file);
        const outputPath = path.join(musicDir, path.basename(file, '.wav') + '.mp3');

        console.log(`Converting: ${file} -> ${path.basename(outputPath)}`);

        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate('192k') // High quality MP3
            .on('end', () => {
                console.log(`Finished: ${file}`);
                // Optional: Delete original wav? Let's keep it for safety for now, user can delete.
                // fs.unlinkSync(inputPath); 
                resolve();
            })
            .on('error', (err) => {
                console.error(`Error converting ${file}:`, err);
                reject(err);
            })
            .save(outputPath);
    });
};

const main = async () => {
    try {
        const files = fs.readdirSync(musicDir);
        for (const file of files) {
            await convertFile(file);
        }
        console.log('All conversions complete!');
    } catch (err) {
        console.error('Directory read failed:', err);
    }
};

main();
