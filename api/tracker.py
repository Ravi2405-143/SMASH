import numpy as np
from filterpy.kalman import KalmanFilter

class ShuttlecockTracker:
    def __init__(self, dt=1/60):
        self.kf = KalmanFilter(dim_x=4, dim_z=2)
        self.kf.F = np.array([[1, 0, dt, 0], [0, 1, 0, dt], [0, 0, 1, 0], [0, 0, 0, 1]])
        self.kf.H = np.array([[1, 0, 0, 0], [0, 1, 0, 0]])
        self.kf.P *= 1000.0
        self.kf.R = np.eye(2) * 5
        self.kf.Q = np.eye(4) * 0.1
        self.initialized = False

    def update(self, x, y):
        if not self.initialized:
            self.kf.x = np.array([x, y, 0, 0])
            self.initialized = True
        else:
            self.kf.predict()
            self.kf.update(np.array([x, y]))
        return (self.kf.x[0], self.kf.x[1])

    def predict(self):
        if self.initialized:
            self.kf.predict()
        return None

    def get_velocity(self):
        if self.initialized:
            return np.sqrt(self.kf.x[2]**2 + self.kf.x[3]**2)
        return 0
