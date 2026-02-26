import { useState, useRef, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as getCamera from '@mediapipe/camera_utils';

interface CropCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const useSmartCrop = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const faceMeshRef = useRef<FaceMesh | null>(null);

    const analyzeVideo = useCallback(async (videoElement: HTMLVideoElement, targetRatio: number = 9 / 16): Promise<CropCoordinates> => {
        setIsAnalyzing(true);

        return new Promise((resolve, reject) => {
            try {
                // Initialize MediaPipe FaceMesh
                if (!faceMeshRef.current) {
                    const faceMesh = new FaceMesh({
                        locateFile: (file) => {
                            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                        }
                    });

                    faceMesh.setOptions({
                        maxNumFaces: 1,
                        refineLandmarks: true,
                        minDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });

                    faceMeshRef.current = faceMesh;
                }

                const faceMesh = faceMeshRef.current;

                // For simplicity in client-side processing, we grab the first prominent frame
                // and base the crop coordinates on the bounding box of the face in that frame.
                // A more advanced engine would track the face across time and animate the crop box.

                faceMesh.onResults((results) => {
                    const videoWidth = videoElement.videoWidth;
                    const videoHeight = videoElement.videoHeight;

                    // Default to center crop if no face found
                    let targetWidth = videoHeight * targetRatio;
                    let targetHeight = videoHeight;
                    let centerX = videoWidth / 2;
                    let centerY = videoHeight / 2;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const landmarks = results.multiFaceLandmarks[0];

                        // Calculate bounding box of the face
                        let minX = 1, maxX = 0, minY = 1, maxY = 0;
                        landmarks.forEach(point => {
                            if (point.x < minX) minX = point.x;
                            if (point.x > maxX) maxX = point.x;
                            if (point.y < minY) minY = point.y;
                            if (point.y > maxY) maxY = point.y;
                        });

                        // Convert normalized coordinates to pixel values
                        const faceCenterX = (minX + maxX) / 2 * videoWidth;
                        const faceCenterY = (minY + maxY) / 2 * videoHeight;

                        centerX = faceCenterX;
                        centerY = faceCenterY;
                    }

                    // Ensure the crop box doesn't go out of bounds
                    let cropX = Math.max(0, centerX - (targetWidth / 2));
                    let cropY = Math.max(0, centerY - (targetHeight / 2));

                    if (cropX + targetWidth > videoWidth) cropX = videoWidth - targetWidth;
                    if (cropY + targetHeight > videoHeight) cropY = videoHeight - targetHeight;

                    setIsAnalyzing(false);
                    resolve({
                        x: Math.round(cropX),
                        y: Math.round(cropY),
                        width: Math.round(targetWidth),
                        height: Math.round(targetHeight)
                    });
                });

                // Send a single frame to MediaPipe
                faceMesh.send({ image: videoElement }).catch(reject);

            } catch (error) {
                console.error("Smart Crop error:", error);
                setIsAnalyzing(false);
                reject(error);
            }
        });
    }, []);

    return { analyzeVideo, isAnalyzing };
};
