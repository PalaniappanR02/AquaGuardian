"""
AquaGuardian — CNN Crack Detection Model
FusionX 2026 · Problem #51

Convolutional Neural Network for pipe crack detection from inspection imagery.
Supports both trained model inference and demo fallback (synthetic).
"""

import numpy as np
from typing import Tuple, Dict, Optional
import os

# ── Crack type taxonomy ────────────────────────────────────────────────────────
CRACK_CLASSES = [
    "No Crack",
    "Hairline Crack",
    "Transverse Crack",
    "Longitudinal Crack",
    "Circumferential Crack",
]

SEVERITY_MAP = {
    "No Crack":              ("LOW",      0.0),
    "Hairline Crack":        ("LOW",      0.25),
    "Transverse Crack":      ("MEDIUM",   0.55),
    "Longitudinal Crack":    ("HIGH",     0.80),
    "Circumferential Crack": ("CRITICAL", 0.95),
}


class CrackDetector:
    """
    CNN-based pipe crack detector.

    In production, loads a TensorFlow/Keras model from MODEL_PATH.
    In demo mode, returns plausible synthetic predictions.
    """

    MODEL_PATH = os.path.join(os.path.dirname(__file__), "crack_cnn.h5")
    IMG_SIZE = (224, 224)  # Input resolution (MobileNetV2 compatible)

    def __init__(self, demo_mode: bool = True):
        self.demo_mode = demo_mode
        self.model = None

        if not demo_mode:
            self._load_model()

    # ── Model Loading ──────────────────────────────────────────────────────────
    def _load_model(self):
        try:
            import tensorflow as tf
            self.model = tf.keras.models.load_model(self.MODEL_PATH)
            print(f"[CrackDetector] Model loaded from {self.MODEL_PATH}")
        except Exception as e:
            print(f"[CrackDetector] WARNING: Could not load model — {e}. Falling back to demo mode.")
            self.demo_mode = True

    # ── Preprocessing ──────────────────────────────────────────────────────────
    @staticmethod
    def preprocess(image_array: np.ndarray) -> np.ndarray:
        """Resize, normalize, and batch an image array for CNN inference."""
        from PIL import Image
        img = Image.fromarray(image_array.astype(np.uint8))
        img = img.resize(CrackDetector.IMG_SIZE)
        arr = np.array(img).astype(np.float32) / 255.0
        return np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)

    # ── Inference ──────────────────────────────────────────────────────────────
    def predict(
        self,
        image_array: Optional[np.ndarray] = None,
        location_hint: str = "Unknown"
    ) -> Dict:
        """
        Run crack detection inference.

        Args:
            image_array: Raw image pixels as np.ndarray (H, W, 3) or None for demo.
            location_hint: Pipe location label for reporting.

        Returns:
            dict with keys: class, confidence, severity, risk_score, probabilities
        """
        if self.demo_mode or self.model is None or image_array is None:
            return self._synthetic_prediction(location_hint)

        # Real inference
        preprocessed = self.preprocess(image_array)
        raw_probs = self.model.predict(preprocessed, verbose=0)[0]
        return self._format_result(raw_probs, location_hint)

    def _format_result(self, probs: np.ndarray, location: str) -> Dict:
        idx = int(np.argmax(probs))
        cls = CRACK_CLASSES[idx]
        confidence = float(probs[idx])
        severity, risk = SEVERITY_MAP[cls]
        return {
            "location": location,
            "class": cls,
            "confidence": round(confidence, 4),
            "severity": severity,
            "risk_score": round(risk + np.random.uniform(-0.03, 0.03), 3),
            "probabilities": {c: round(float(p), 4) for c, p in zip(CRACK_CLASSES, probs)},
        }

    def _synthetic_prediction(self, location: str) -> Dict:
        """Deterministic synthetic output for demo / hackathon mode."""
        np.random.seed(abs(hash(location)) % 2**31)
        # Bias towards defects for demo impact
        probs = np.random.dirichlet(alpha=[10, 5, 8, 12, 3])
        return self._format_result(probs, location)

    # ── Batch Inference ────────────────────────────────────────────────────────
    def inspect_ward(self, locations: list) -> list:
        """Run inference on a list of pipe locations (demo mode). Returns list of results."""
        return [self.predict(location_hint=loc) for loc in locations]


# ── Convenience singleton ──────────────────────────────────────────────────────
_detector: Optional[CrackDetector] = None


def get_detector(demo_mode: bool = True) -> CrackDetector:
    """Return (and cache) a shared CrackDetector instance."""
    global _detector
    if _detector is None:
        _detector = CrackDetector(demo_mode=demo_mode)
    return _detector


# ── CLI test ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    detector = get_detector(demo_mode=True)
    locations = [
        "Ward-71-A / Ring Rd Trunk Main",
        "Ward-71-B / ITPL Spur Lateral",
        "Ward-71-C / Varthur Distribution",
    ]
    results = detector.inspect_ward(locations)
    for r in results:
        print(f"[{r['severity']:8s}] {r['location']} — {r['class']} ({r['confidence']*100:.1f}%)")
