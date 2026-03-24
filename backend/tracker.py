import numpy as np
from filterpy.kalman import KalmanFilter

class ShuttlecockTracker:
    def __init__(self, dt=1/60):
        # State: [x, y, vx, vy]
        self.kf = KalmanFilter(dim_x=4, dim_z=2)
        
        # State transition matrix
        self.kf.F = np.array([
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ])
        
        # Measurement matrix (we only measure x and y)
        self.kf.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ])
        
        # Initial state covariance
        self.kf.P *= 1000.0
        
        # Measurement noise
        self.kf.R = np.eye(2) * 5
        
        # Process noise
        self.kf.Q = np.eye(4) * 0.1
        
        self.initialized = False
        self.last_pos = None

    def update(self, x, y):
        if not self.initialized:
            self.kf.x = np.array([x, y, 0, 0])
            self.initialized = True
        else:
            self.kf.predict()
            self.kf.update(np.array([x, y]))
        
        self.last_pos = (self.kf.x[0], self.kf.x[1])
        return self.last_pos

    def predict(self):
        if self.initialized:
            self.kf.predict()
            return (self.kf.x[0], self.kf.x[1])
        return None

    def get_velocity(self):
        if self.initialized:
            # Result is [vx, vy]
            return np.sqrt(self.kf.x[2]**2 + self.kf.x[3]**2)
        return 0
