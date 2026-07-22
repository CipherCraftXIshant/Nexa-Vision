import cv2
import numpy as np

class LivenessEngine:
    @staticmethod
    def calculate_blurriness(image_np: np.ndarray) -> float:
        """Computes blur level using Laplacian variance. Higher value = sharper."""
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_np
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        # Normalize variance to a 0-1 scale (var 100+ is considered sharp)
        return min(1.0, float(variance / 150.0))

    @staticmethod
    def calculate_illumination(image_np: np.ndarray) -> float:
        """Computes lighting quality (0.0 to 1.0)."""
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_np
        mean_brightness = np.mean(gray)
        # Optimal brightness around 120-140 out of 255
        diff = abs(mean_brightness - 128)
        score = max(0.0, 1.0 - (diff / 128.0))
        return float(score)

    @classmethod
    def evaluate_quality(cls, image_np: np.ndarray) -> float:
        """Returns overall face image quality score (0.0 to 1.0)."""
        blur_score = cls.calculate_blurriness(image_np)
        light_score = cls.calculate_illumination(image_np)
        return float(0.6 * blur_score + 0.4 * light_score)

    @classmethod
    def estimate_liveness(cls, image_np: np.ndarray) -> float:
        """
        Estimates liveness score based on High-Frequency texture analysis and edge gradients.
        Printed photos/screens have distinct moire/reflection patterns or missing micro-textures.
        """
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_np

        # Edge intensity check using Sobel filters
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(sobelx**2 + sobely**2)
        grad_score = np.mean(grad_mag) / 64.0

        # Texture noise variance
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        high_freq = cv2.absdiff(gray, blur)
        hf_score = np.mean(high_freq) / 25.0

        raw_score = 0.5 * grad_score + 0.5 * hf_score
        liveness_score = min(0.99, max(0.45, float(raw_score)))
        return liveness_score
