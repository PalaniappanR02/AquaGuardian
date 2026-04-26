"""
analytics/models/rul_predictor.py
-----------------------------------
Remaining Useful Life (RUL) predictor for city water infrastructure.

Physics-Informed Degradation Model
────────────────────────────────────
Combines two approaches:

1. Arrhenius-Law Degradation Rate (polymer pipes: PVC / PE):
   k(T) = A · exp(−Eₐ / (R · T))
   where:
     A  = pre-exponential frequency factor (material-specific)
     Eₐ = activation energy of the dominant degradation mechanism (J/mol)
     R  = universal gas constant (8.314 J/mol·K)
     T  = absolute temperature (Kelvin)

   RUL (months) = (Design_Life − Age) / k_effective
   k_effective  = base_rate × environmental_stress_factor

2. Linear Regression (all materials) — trained on synthetic operational data
   that encodes material type, age, stress, and climate zone. Used as a
   calibration / sanity-check alongside the physics model.

The final prediction is a weighted ensemble:
   RUL_final = 0.60 × RUL_arrhenius + 0.40 × RUL_regression
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

# ──────────────────────────────────────────────────────────────────────────────
# Physical Constants & Material Parameters
# ──────────────────────────────────────────────────────────────────────────────

R_GAS = 8.314  # Universal gas constant (J / mol·K)

# Material-specific parameters
#   A  : pre-exponential factor (dimensionless rate multiplier)
#   Ea : activation energy (J/mol)  — polymer oxidative degradation
#   design_life_years : nominal service life at standard conditions
MATERIAL_PARAMS: dict[str, dict] = {
    "PVC": {
        "A":                 1.25e3,
        "Ea":                65_000,    # ~65 kJ/mol — PVC oxidative ageing
        "design_life_years": 50,
        "base_stress_coef":  0.042,     # monthly degradation rate at stress=0.5, 25°C
    },
    "PE": {
        "A":                 8.0e2,
        "Ea":                72_000,    # ~72 kJ/mol — PE slow crack growth
        "design_life_years": 60,
        "base_stress_coef":  0.030,
    },
    "Ductile Iron": {
        "A":                 4.5e1,     # DI degrades via corrosion, not Arrhenius-driven
        "Ea":                45_000,
        "design_life_years": 80,
        "base_stress_coef":  0.018,
    },
}

MATERIAL_TYPES = Literal["PVC", "PE", "Ductile Iron"]

# Weights for ensemble combination
W_ARRHENIUS  = 0.60
W_REGRESSION = 0.40


# ──────────────────────────────────────────────────────────────────────────────
# Result dataclass
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class RULResult:
    rul_months: int                  # Final ensembled RUL (months)
    rul_years: float                 # Same in years
    rul_arrhenius_months: float      # Physics model estimate
    rul_regression_months: float     # ML regression estimate
    health_score: float              # 0–100 (100 = new pipe)
    status: str                      # "Good" | "Warning" | "Critical"
    status_color: str                # Streamlit metric delta_color hint
    maintenance_window: str          # Human-readable urgency
    recommendations: list[str]

    @classmethod
    def from_raw(
        cls,
        rul_arr: float,
        rul_reg: float,
        age_years: float,
        material: str,
    ) -> "RULResult":
        rul_final = max(0.0, W_ARRHENIUS * rul_arr + W_REGRESSION * rul_reg)
        design_life = MATERIAL_PARAMS[material]["design_life_years"] * 12
        health = min(100.0, max(0.0, (rul_final / design_life) * 100))

        if rul_final > 60:
            status, color, window = "Good", "green", "Next scheduled inspection cycle"
        elif rul_final > 12:
            status, color, window = "Warning", "orange", f"Plan replacement within {int(rul_final // 12)} year(s)"
        else:
            status, color, window = "Critical", "red", "Immediate action required (≤ 12 months)"

        recommendations = _get_recommendations(status, material, rul_final)

        return cls(
            rul_months=int(rul_final),
            rul_years=round(rul_final / 12, 1),
            rul_arrhenius_months=round(rul_arr, 1),
            rul_regression_months=round(rul_reg, 1),
            health_score=round(health, 1),
            status=status,
            status_color=color,
            maintenance_window=window,
            recommendations=recommendations,
        )


def _get_recommendations(status: str, material: str, rul: float) -> list[str]:
    base = {
        "Good": [
            "✅ Asset within normal operating envelope.",
            "📋 Continue standard inspection schedule.",
            "📊 Log Arrhenius parameters for longitudinal trend analysis.",
        ],
        "Warning": [
            "⚠️  Increase inspection frequency to bi-annual.",
            "🔧 Schedule non-destructive evaluation (NDE) ultrasonic test.",
            f"📦 Procure replacement {material} stock and queue procurement.",
            "📍 Flag segment in GIS asset heat-map as amber.",
        ],
        "Critical": [
            "🚨 Escalate to Operations Manager immediately.",
            "⛔  Consider temporary bypass or flow isolation.",
            "🔧 Dispatch field crew for emergency assessment within 24 hrs.",
            f"📦 Emergency order for {material} pipe sections required.",
            "📍 Mark segment RED in GIS — potential failure risk.",
        ],
    }
    return base.get(status, [])


# ──────────────────────────────────────────────────────────────────────────────
# Arrhenius Model
# ──────────────────────────────────────────────────────────────────────────────

def arrhenius_rul(
    material: str,
    age_years: float,
    stress: float,          # 0.1 – 1.0  (higher = more aggressive environment)
    temp_celsius: float,    # Ambient / operating temperature
) -> float:
    """
    Compute RUL (months) via Arrhenius-law degradation kinetics.

    Formula:
        k  = A · exp(−Ea / (R · T))          [base degradation rate]
        k' = k · stress                       [environmentally adjusted rate]
        RUL (months) = max(0,  design_life_months − age_months) / k'
    """
    params = MATERIAL_PARAMS[material]
    T_kelvin = temp_celsius + 273.15

    # Arrhenius rate constant (normalised to design conditions)
    k_raw = params["A"] * math.exp(-params["Ea"] / (R_GAS * T_kelvin))

    # Normalise k_raw against a reference temperature (25 °C = 298.15 K)
    k_ref = params["A"] * math.exp(-params["Ea"] / (R_GAS * 298.15))
    k_norm = k_raw / k_ref          # ratio: 1.0 at 25 °C

    # Effective monthly degradation rate
    k_eff = params["base_stress_coef"] * stress * k_norm

    design_life_months = params["design_life_years"] * 12
    age_months = age_years * 12
    remaining_design = max(0.0, design_life_months - age_months)

    if k_eff <= 0:
        return remaining_design

    rul = remaining_design / k_eff
    return max(0.0, rul)


# ──────────────────────────────────────────────────────────────────────────────
# Regression Model
# ──────────────────────────────────────────────────────────────────────────────

def _generate_training_data(n: int = 2000, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    """
    Synthesise realistic training data for the Ridge regression.
    Features: [age_years, stress, temp_celsius, material (one-hot)]
    Target:   RUL in months (computed via Arrhenius to maintain physics alignment)
    """
    rng = np.random.default_rng(seed)
    materials = rng.choice(list(MATERIAL_PARAMS.keys()), size=n)
    ages  = rng.uniform(0.5, 45, size=n)
    stress = rng.uniform(0.1, 1.0, size=n)
    temps  = rng.uniform(15, 42, size=n)   # Indian climate range

    y = np.array([
        arrhenius_rul(mat, age, s, t)
        for mat, age, s, t in zip(materials, ages, stress, temps)
    ])
    # Add realistic noise (±8 months)
    y += rng.normal(0, 8, size=n)
    y = np.clip(y, 0, None)

    # Build feature matrix
    X_cat  = materials.reshape(-1, 1)
    X_num  = np.column_stack([ages, stress, temps])
    return X_cat, X_num, y


class RULRegressor:
    """
    Ridge regression with one-hot encoding for material type and
    standard scaling for numeric features.
    """

    def __init__(self, alpha: float = 10.0):
        self._pipeline: Pipeline | None = None
        self._trained = False
        self._train(alpha)

    def _train(self, alpha: float):
        X_cat, X_num, y = _generate_training_data()

        # Combine into a single ndarray with material in col 0
        X = np.hstack([X_cat, X_num])   # shape: (n, 4)

        preprocessor = ColumnTransformer([
            ("cat", OneHotEncoder(sparse_output=False, drop="first"), [0]),
            ("num", StandardScaler(), [1, 2, 3]),
        ])

        self._pipeline = Pipeline([
            ("prep", preprocessor),
            ("reg",  Ridge(alpha=alpha)),
        ])
        self._pipeline.fit(X, y)
        self._trained = True

    def predict(self, material: str, age_years: float, stress: float, temp_celsius: float) -> float:
        X = np.array([[material, age_years, stress, temp_celsius]])
        pred = float(self._pipeline.predict(X)[0])
        return max(0.0, pred)


# ──────────────────────────────────────────────────────────────────────────────
# Unified Predictor (Ensemble)
# ──────────────────────────────────────────────────────────────────────────────

class RULPredictor:
    """
    Ensemble predictor: 60 % Arrhenius + 40 % Ridge Regression.

    Usage:
        predictor = RULPredictor()
        result = predictor.predict("PVC", age_years=12, stress=0.7, temp_celsius=30)
        print(result.rul_months, result.status)
    """

    def __init__(self):
        self._regressor = RULRegressor()

    def predict(
        self,
        material: str,
        age_years: float,
        stress: float,
        temp_celsius: float = 28.0,   # Default: avg Bengaluru temperature
    ) -> RULResult:
        """
        Args:
            material:      One of "PVC", "PE", "Ductile Iron"
            age_years:     Current age of the pipe asset.
            stress:        Environmental stress score 0.1–1.0
                           (soil corrosivity, traffic load, water hammer, etc.)
            temp_celsius:  Operating/ambient temperature.

        Returns:
            RULResult dataclass with full diagnostic breakdown.
        """
        if material not in MATERIAL_PARAMS:
            raise ValueError(f"Unknown material '{material}'. Choose from {list(MATERIAL_PARAMS)}")

        rul_arr = arrhenius_rul(material, age_years, stress, temp_celsius)
        rul_reg = self._regressor.predict(material, age_years, stress, temp_celsius)
        return RULResult.from_raw(rul_arr, rul_reg, age_years, material)

    def batch_predict(self, assets: list[dict]) -> list[RULResult]:
        """
        Run predictions for multiple pipe assets.

        Args:
            assets: list of dicts with keys: material, age_years, stress,
                    temp_celsius (optional), pipe_id (optional)
        """
        results = []
        for asset in assets:
            r = self.predict(
                material=asset["material"],
                age_years=asset["age_years"],
                stress=asset["stress"],
                temp_celsius=asset.get("temp_celsius", 28.0),
            )
            results.append(r)
        return results


# ──────────────────────────────────────────────────────────────────────────────
# Singleton accessor
# ──────────────────────────────────────────────────────────────────────────────

_predictor: RULPredictor | None = None


def get_predictor() -> RULPredictor:
    """Return a cached RULPredictor instance (singleton pattern)."""
    global _predictor
    if _predictor is None:
        _predictor = RULPredictor()
    return _predictor


# ──────────────────────────────────────────────────────────────────────────────
# CLI test
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    predictor = get_predictor()
    test_assets = [
        {"material": "PVC",          "age_years": 25, "stress": 0.8, "temp_celsius": 35},
        {"material": "PE",           "age_years": 10, "stress": 0.4, "temp_celsius": 28},
        {"material": "Ductile Iron", "age_years": 40, "stress": 0.9, "temp_celsius": 30},
    ]
    for asset in test_assets:
        r = predictor.predict(**asset)
        print(
            f"[{r.status:8s}] {asset['material']:15s} | "
            f"Age {asset['age_years']}yr | "
            f"RUL: {r.rul_months} months ({r.rul_years}yr) | "
            f"Health: {r.health_score}%"
        )
