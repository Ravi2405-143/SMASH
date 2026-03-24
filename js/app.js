document.addEventListener('DOMContentLoaded', () => {
    const DOM = window.UI.DOM;
    let analyzer = null;
    let finalResult = null;

    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];

    // --- 1. Record Video Workflow ---
    DOM.btnStartCamera.addEventListener('click', async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } } 
            });
            DOM.video.srcObject = mediaStream;
            DOM.video.play();
            
            DOM.emptyState.classList.add('hidden');
            DOM.video.classList.remove('hidden');
            
            DOM.btnStartCamera.classList.add('hidden');
            DOM.recordingControls.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            alert("Could not access camera. Please allow camera permissions.");
        }
    });

    DOM.btnStartRecord.addEventListener('click', () => {
        if (!mediaStream) return;
        
        recordedChunks = [];
        try {
            let options = { mimeType: 'video/webm;codecs=vp9' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm' };
            }
            mediaRecorder = new MediaRecorder(mediaStream, options);
        } catch (e) {
            mediaRecorder = new MediaRecorder(mediaStream);
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(blob);
            
            mediaStream.getTracks().forEach(track => track.stop());
            
            DOM.video.srcObject = null;
            DOM.video.src = videoURL;
            DOM.video.controls = false; 
            DOM.canvas.classList.remove('hidden');
            
            analyzer = new window.VideoAnalyzer(DOM.video, DOM.canvas);
            
            analyzer.onPointSet = (pointNum, data) => {
                if (pointNum === 1) {
                    DOM.statusP1.innerHTML = `Point 1 (Impact): <span class="badge" style="background:rgba(5,217,232,0.2)">${data.time.toFixed(3)}s</span>`;
                    DOM.btnMarkP2.classList.remove('disabled');
                    DOM.btnMarkP1.style.boxShadow = 'none';
                } else if (pointNum === 2) {
                    DOM.statusP2.innerHTML = `Point 2 (Landing): <span class="badge" style="background:rgba(255,42,109,0.2)">${data.time.toFixed(3)}s</span>`;
                    DOM.btnCalculate.classList.remove('disabled');
                    DOM.btnMarkP2.style.boxShadow = 'none';
                }
            };

            DOM.step1.classList.remove('active');
            DOM.step1.classList.add('disabled');
            window.UI.enableStep(DOM.step2);
        };

        mediaRecorder.start();
        DOM.btnStartRecord.classList.add('hidden');
        DOM.btnStopRecord.classList.remove('hidden');
    });

    DOM.btnStopRecord.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        DOM.recordingControls.classList.add('hidden');
    });

    // --- 2. Manual Marking ---
    const FRAME_STEP = 1/60; 
    DOM.btnPrevFrame.addEventListener('click', () => { DOM.video.currentTime = Math.max(0, DOM.video.currentTime - FRAME_STEP); });
    DOM.btnNextFrame.addEventListener('click', () => { DOM.video.currentTime += FRAME_STEP; });
    DOM.btnPlayPause.addEventListener('click', () => {
        if (DOM.video.paused) DOM.video.play();
        else DOM.video.pause();
    });

    DOM.btnMarkP1.addEventListener('click', () => {
        if (!analyzer) return;
        analyzer.setMode('mark_p1');
        DOM.video.pause();
        DOM.btnMarkP1.style.boxShadow = '0 0 10px var(--neon-cyan)';
        DOM.btnMarkP2.style.boxShadow = 'none';
    });
    
    DOM.btnMarkP2.addEventListener('click', () => {
        if (!analyzer) return;
        analyzer.setMode('mark_p2');
        DOM.video.pause();
        DOM.btnMarkP2.style.boxShadow = '0 0 10px var(--neon-pink)';
        DOM.btnMarkP1.style.boxShadow = 'none';
    });

    // --- 3. Calculate ---
    DOM.btnCalculate.addEventListener('click', () => {
        if (!analyzer) return;
        
        const timeDelta = analyzer.getTimeDelta();
        if (timeDelta === null || timeDelta === 0) {
            alert("Please make sure you have marked two distinct frames.");
            return;
        }

        const result = window.calculateSpeedFromVideo(timeDelta);
        if (result) {
            finalResult = result;
            
            // Show modal
            DOM.resultsModal.classList.remove('hidden');
            
            window.UI.updateGauge(result.speedKmh, result.gaugeColor);
            window.UI.animateValue(DOM.speedDisplay, 0, result.speedKmh, 1000);
            
            setTimeout(() => {
                DOM.speedCategory.textContent = result.category;
                DOM.speedCategory.style.color = result.gaugeColor;
                DOM.statDist.textContent = `${result.distanceMeters} m`;
                DOM.statTime.textContent = `${result.timeDeltaSeconds} s`;
                DOM.statBenchmark.textContent = `${result.proPercentage}%`;
            }, 500);
        }
    });

    DOM.closeModal.addEventListener('click', () => {
        DOM.resultsModal.classList.add('hidden');
    });

    DOM.btnSaveResult.addEventListener('click', () => {
        if (finalResult) {
            window.StorageAPI.saveResult({...finalResult, distance: finalResult.distanceMeters, time: finalResult.timeDeltaSeconds});
            alert("Saved to History.");
            DOM.btnSaveResult.disabled = true;
        }
    });
});

window.addEventListener('resize', () => {
    if (window.analyzer) { window.analyzer.resizeCanvas(); }
});
