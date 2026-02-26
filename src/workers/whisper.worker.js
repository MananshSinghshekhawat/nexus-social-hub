import { pipeline, env } from '@xenova/transformers';

// Disable sending models to the local cache directory to avoid pathing errors in browsers
env.allowLocalModels = false;
env.useBrowserCache = true;

class WhisperPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    // We expect the main thread to send an initialized audio Float32Array
    const audioData = event.data.audio;

    try {
        // Retrieve the Whisper pipeline. When called for the first time,
        // this will load the pipeline and save it for future use.
        let transcriber = await WhisperPipeline.getInstance(x => {
            // We also save progress callbacks to let the UI know it's downloading
            self.postMessage({ status: 'progress', data: x });
        });

        // Actually run the transcription
        const result = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: true, // We need this for the video editor overlay
            language: 'english',
            task: 'transcribe'
        });

        // Send the output back to the main thread
        self.postMessage({
            status: 'complete',
            result: result
        });
    } catch (err) {
        console.error("Whisper Web Worker Error:", err);
        self.postMessage({ status: 'error', data: err.message });
    }
});
