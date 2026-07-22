import cv2
import numpy as np
import base64
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.services.liveness_engine import LivenessEngine

class FaceEngine:
    def __init__(self):
        # Load OpenCV Haar cascade classifier for fast face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def decode_image(self, base64_str: str) -> Optional[np.ndarray]:
        """Decodes base64 string or data-url into OpenCV BGR numpy array."""
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            image_bytes = base64.b64decode(base64_str)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None

    def detect_faces(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        """Detects faces in image and extracts ROI, quality, and liveness scores."""
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60)
        )

        results = []
        img_h, img_w = image_np.shape[:2]

        # If Haar cascade didn't catch a face, fallback to whole centered ROI if image looks like portrait
        if len(faces) == 0 and img_h >= 100 and img_w >= 100:
            # Fallback face ROI
            w_crop = int(img_w * 0.7)
            h_crop = int(img_h * 0.7)
            x_crop = (img_w - w_crop) // 2
            y_crop = (img_h - h_crop) // 2
            faces = [(x_crop, y_crop, w_crop, h_crop)]

        for (x, y, w, h) in faces:
            # Clamp box boundaries
            x, y = max(0, int(x)), max(0, int(y))
            w, h = min(img_w - x, int(w)), min(img_h - y, int(h))

            face_roi = image_np[y:y+h, x:x+w]
            if face_roi.size == 0:
                continue

            quality = LivenessEngine.evaluate_quality(face_roi)
            liveness = LivenessEngine.estimate_liveness(face_roi)
            embedding = self.generate_embedding(face_roi)

            results.append({
                "boundingBox": {
                    "x": x,
                    "y": y,
                    "width": w,
                    "height": h
                },
                "confidence": round(float(min(0.99, max(0.85, quality + 0.15))), 4),
                "qualityScore": round(quality, 4),
                "livenessScore": round(liveness, 4),
                "embedding": embedding,
                "faceRoi": face_roi
            })

        return results

    def generate_embedding(self, face_roi: np.ndarray) -> List[float]:
        """
        Generates a 128-dimensional normalized facial feature vector from face ROI.
        Uses spatial grid color & edge orientation histograms for reproducible face signatures.
        """
        resized = cv2.resize(face_roi, (64, 64))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        
        # Calculate HOG-like spatial cell features
        cell_size = 16
        features = []
        for r in range(0, 64, cell_size):
            for c in range(0, 64, cell_size):
                cell = gray[r:r+cell_size, c:c+cell_size]
                # Mean, std, and gradient directions
                gx = cv2.Sobel(cell, cv2.CV_32F, 1, 0, ksize=3)
                gy = cv2.Sobel(cell, cv2.CV_32F, 0, 1, ksize=3)
                mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
                
                hist, _ = np.histogram(ang, bins=8, range=(0, 360), weights=mag)
                features.extend(hist.tolist())
        
        # Pad or trim to exactly 128 elements
        features = np.array(features, dtype=np.float32)
        if len(features) < 128:
            features = np.pad(features, (0, 128 - len(features)))
        else:
            features = features[:128]

        # L2 Normalization
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm

        return [round(float(v), 6) for v in features]

    @staticmethod
    def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Calculates cosine similarity between two 128-d vectors (returns 0.0 to 1.0)."""
        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)
        dot = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        similarity = dot / (norm1 * norm2)
        return float(max(0.0, min(1.0, similarity)))

    def match_face(
        self,
        query_embedding: List[float],
        database_embeddings: List[Dict[str, Any]],
        threshold: float = settings.DEFAULT_MATCH_THRESHOLD
    ) -> Tuple[bool, Optional[Dict[str, Any]], float]:
        """Matches a query face embedding against candidate registered embeddings."""
        best_match = None
        best_sim = 0.0

        for candidate in database_embeddings:
            candidate_emb = candidate.get("embedding", [])
            if not candidate_emb:
                continue
            sim = self.calculate_cosine_similarity(query_embedding, candidate_emb)
            if sim > best_sim:
                best_sim = sim
                best_match = candidate

        matched = best_sim >= threshold
        return matched, best_match if matched else None, round(best_sim, 4)

face_engine = FaceEngine()
