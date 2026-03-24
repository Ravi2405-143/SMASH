class VideoAnalyzer {
    constructor(videoEl, canvasEl) {
        this.video = videoEl;
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        
        this.mode = 'idle'; 
        this.points = {
            p1: null,
            p2: null
        };

        this.onPointSet = null;

        this.video.addEventListener('loadedmetadata', () => this.resizeCanvas());
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    resizeCanvas() {
        this.canvas.width = this.video.clientWidth || this.video.videoWidth;
        this.canvas.height = this.video.clientHeight || this.video.videoHeight;
        this.drawOverlay();
    }

    setMode(mode) {
        this.mode = mode;
        this.canvas.classList.remove('hidden');
        this.canvas.style.cursor = 'crosshair';
        this.drawOverlay();
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Scale in case canvas CSS size differs from width/height attributes
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const t = this.video.currentTime;

        if (this.mode === 'mark_p1') {
            this.points.p1 = { x, y, time: t };
            this.mode = 'idle';
            this.canvas.style.cursor = 'default';
            if (this.onPointSet) this.onPointSet(1, this.points.p1);
        } else if (this.mode === 'mark_p2') {
            this.points.p2 = { x, y, time: t };
            this.mode = 'idle';
            this.canvas.style.cursor = 'default';
            if (this.onPointSet) this.onPointSet(2, this.points.p2);
        }

        this.drawOverlay();
    }

    drawOverlay() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Point 1
        if (this.points.p1) {
            this.drawPoint(this.points.p1.x, this.points.p1.y, '#05d9e8', '1');
        }

        // Draw Point 2
        if (this.points.p2) {
            this.drawPoint(this.points.p2.x, this.points.p2.y, '#ff2a6d', '2');
        }

        // Draw Trajectory Line if both exist
        if (this.points.p1 && this.points.p2) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.points.p1.x, this.points.p1.y);
            this.ctx.lineTo(this.points.p2.x, this.points.p2.y);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.setLineDash([5, 5]);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawPoint(x, y, color, label) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(label, x + 10, y - 10);
    }

    getTimeDelta() {
        if (this.points.p1 && this.points.p2) {
            return Math.abs(this.points.p2.time - this.points.p1.time);
        }
        return null;
    }
}

window.VideoAnalyzer = VideoAnalyzer;
