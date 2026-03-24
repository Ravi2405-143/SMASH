function calculateSpeedFromVideo(timeDeltaSeconds) {
    if (timeDeltaSeconds <= 0) return null;

    // Hardcode distance
    const DISTANCE_METERS = 6.7;

    const avgSpeedMs = DISTANCE_METERS / timeDeltaSeconds;
    const DECELERATION_FACTOR = 1.45; 
    const initialSpeedMs = avgSpeedMs * DECELERATION_FACTOR;

    const speedKmh = initialSpeedMs * 3.6;

    let category = '';
    let gaugeColor = '';

    if (speedKmh < 100) { category = 'Slow'; gaugeColor = '#ffffff'; }
    else if (speedKmh < 200) { category = 'Moderate'; gaugeColor = '#05d9e8'; }
    else if (speedKmh < 300) { category = 'Fast'; gaugeColor = '#ff2a6d'; }
    else { category = 'Professional'; gaugeColor = '#d1f7ff'; }

    let proBenchmarkMs = 97.22; 
    let proPercentage = (initialSpeedMs / proBenchmarkMs) * 100;
    if (proPercentage > 100) proPercentage = 100;

    return {
        distanceMeters: DISTANCE_METERS,
        timeDeltaSeconds: timeDeltaSeconds.toFixed(3),
        initialSpeedMs: initialSpeedMs.toFixed(2),
        speedKmh: Math.round(speedKmh),
        category: category,
        gaugeColor: gaugeColor,
        proPercentage: proPercentage.toFixed(1)
    };
}

window.calculateSpeedFromVideo = calculateSpeedFromVideo;
