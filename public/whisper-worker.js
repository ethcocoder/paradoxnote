import { pipeline, env } from '@xenova/transformers';

// Enhanced Mobile Configuration
env.allowLocalModels = true;
env.allowRemoteModels = false; // Stay sovereign
env.localModelPath = '/models/'; // Absolute root for Capacitor

let transcriber = null;

async function getTranscriber() {
    if (transcriber) return transcriber;

    self.postMessage({ status: 'loading', message: 'Engine Booting...' });

    try {
        self.postMessage({ status: 'loading', message: 'Loading Neural Network...' });

        // Explicitly pointing to the model folder
        transcriber = await pipeline('automatic-speech-recognition', 'whisper-tiny-en', {
            quantized: true,
            local_files_only: true, // Crucial for offline
            // Explicitly handle failure to find files
        });

        self.postMessage({ status: 'ready', message: 'Engine Online' });
        return transcriber;
    } catch (err) {
        console.error('TRANSFORMERS_ERROR:', err);
        self.postMessage({
            status: 'error',
            error: `Neural Boot Failed: ${err.message}. Check if /public/models/whisper-tiny-en exists.`
        });
        throw err;
    }
}

self.onmessage = async (e) => {
    const { audio, type } = e.data;

    // Handle initial warmup
    if (type === 'init') {
        try {
            await getTranscriber();
        } catch (e) { }
        return;
    }

    if (audio) {
        try {
            self.postMessage({ status: 'loading', message: 'Initializing Whisper...' });

            const whisper = await getTranscriber();

            self.postMessage({ status: 'loading', message: 'Synthesizing Speech...' });

            const start = Date.now();
            const output = await whisper(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
                return_timestamps: false
            });
            const duration = ((Date.now() - start) / 1000).toFixed(1);

            self.postMessage({
                status: 'complete',
                message: `Transcribed in ${duration}s`,
                output: output.text
            });
        } catch (error) {
            console.error('WORKER_TRANSCRIPTION_ERROR:', error);
            self.postMessage({ status: 'error', error: `Analysis Fault: ${error.message}` });
        }
    }
};
