import numpy as np

class ShuttlecockTracker:
    def __init__(self, dt=1/60):
        # State: [x, y, vx, vy]
        self.x = np.zeros((4, 1))
        
        # State transition matrix
        self.F = np.array([
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ])
        
        # Measurement matrix (we only measure x and y)
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ])
        
        # Covariance matrix
        self.P = np.eye(4) * 1000.0
        
        # Measurement noise
        self.R = np.eye(2) * 5
        
        # Process noise
        self.Q = np.eye(4) * 0.1
        
        self.initialized = False

    def update(self, x_meas, y_meas):
        z = np.array([[x_meas], [y_meas]])
        
        if not self.initialized:
            self.x = np.array([[x_meas], [y_meas], [0], [0]])
            self.initialized = True
            return (float(self.x[0]), float(self.x[1]))

        # Prediction step
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        
        # Update step
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T @ np.linalg.inv(S)
        
        y = z - self.H @ self.x
        self.x = self.x + K @ y
        self.P = (np.eye(4) - K @ self.H) @ self.P
        
        return (float(self.x[0]), float(self.x[1]))

    def predict(self):
        if self.initialized:
            self.x = self.F @ self.x
            self.P = self.F @ self.P @ self.F.T + self.Q
            return (float(self.x[0]), float(self.x[1]))
        return None

    def get_velocity(self):
        if self.initialized:
            return np.sqrt(float(self.x[2])**2 + float(self.x[3])**2)
        return 0
