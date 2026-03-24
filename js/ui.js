const DOM = {
    step1: document.getElementById('step-1'),
    step2: document.getElementById('step-2'),
    
    // Video
    btnStartCamera: document.getElementById('btn-start-camera'),
    recordingControls: document.getElementById('recording-controls'),
    btnStartRecord: document.getElementById('btn-start-record'),
    btnStopRecord: document.getElementById('btn-stop-record'),
    
    videoContainerWrapper: document.getElementById('video-container-wrapper'),
    emptyState: document.getElementById('empty-video-state'),
    video: document.getElementById('analyzer-video'),
    canvas: document.getElementById('analyzer-canvas'),
    
    // Step 2 controls
    btnPrevFrame: document.getElementById('btn-prev-frame'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    btnNextFrame: document.getElementById('btn-next-frame'),
    btnMarkP1: document.getElementById('btn-mark-p1'),
    btnMarkP2: document.getElementById('btn-mark-p2'),
    statusP1: document.getElementById('status-p1'),
    statusP2: document.getElementById('status-p2'),
    btnCalculate: document.getElementById('btn-calculate'),
    
    // Results
    resultsModal: document.getElementById('results-modal'),
    closeModal: document.getElementById('close-modal'),
    speedDisplay: document.getElementById('speed-display'),
    speedCategory: document.getElementById('speed-category'),
    statDist: document.getElementById('stat-dist'),
    statTime: document.getElementById('stat-time'),
    statBenchmark: document.getElementById('stat-benchmark'),
    gaugeFill: document.getElementById('gauge-fill'),
    btnSaveResult: document.getElementById('btn-save-result')
};

const GAUGE_MAX_DASH = 251.2;
function updateGauge(speedKmh, color) {
    let percentage = speedKmh / 400;
    if (percentage > 1) percentage = 1;
    const offset = GAUGE_MAX_DASH - (percentage * GAUGE_MAX_DASH);
    DOM.gaugeFill.style.strokeDashoffset = offset;
    DOM.gaugeFill.style.stroke = color;
    DOM.gaugeFill.style.filter = `drop-shadow(0 0 10px ${color})`;
}
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function enableStep(stepEl) {
    stepEl.classList.remove('disabled');
    stepEl.classList.add('active');
}

window.UI = {
    DOM,
    updateGauge,
    animateValue,
    enableStep
};
