"""
AquaGuardian Analytics Engine —FusionX 2026  · Urban Water Leakage in Bengaluru
Streamlit app covering all 6 operational cases.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import time
import os
import sys

# ── Page Config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AquaGuardian — BWSSB Command Center",
    page_icon="💧",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Custom CSS for embedded dark mode ─────────────────────────────────────────
st.markdown("""
<style>
    /* Hide Streamlit branding when embedded */
    #MainMenu, footer, header { visibility: hidden; }
    .block-container { padding: 1.5rem 2rem !important; max-width: 100% !important; }
    
    /* Dark glassmorphism cards */
    .metric-card {
        background: linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.04));
        border: 1px solid rgba(14,165,233,0.2);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        text-align: center;
        backdrop-filter: blur(10px);
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        color: #22d3ee;
        line-height: 1;
    }
    .metric-label {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.4rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }
    .alert-badge {
        display: inline-block;
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .badge-critical { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-warning  { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .badge-normal   { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    
    /* Tabs styling */
    .stTabs [data-baseweb="tab-list"] {
        background: rgba(15,23,42,0.8);
        border-radius: 12px;
        padding: 4px;
        gap: 4px;
        border: 1px solid rgba(51,65,85,0.5);
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        color: #64748b;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .stTabs [aria-selected="true"] {
        background: rgba(14,165,233,0.15) !important;
        color: #38bdf8 !important;
        border: 1px solid rgba(14,165,233,0.25) !important;
    }
    h1, h2, h3 { color: #f1f5f9 !important; }
    p, .stMarkdown { color: #94a3b8 !important; }
</style>
""", unsafe_allow_html=True)


# ── Utility: Synthetic Data Generators ────────────────────────────────────────
@st.cache_data(ttl=30)
def generate_realtime_pressure(n=200):
    t = pd.date_range(end=datetime.now(), periods=n, freq="5min")
    base = 95 + np.sin(np.linspace(0, 4 * np.pi, n)) * 8
    noise = np.random.normal(0, 1.2, n)
    leak_event = np.zeros(n)
    leak_event[130:155] = -18  # simulated pressure drop = leak
    return pd.DataFrame({"timestamp": t, "pressure_psi": base + noise + leak_event,
                          "zone": np.random.choice(["Ward-71-A", "Ward-71-B", "Ward-71-C"], n)})


@st.cache_data(ttl=60)
def generate_flow_data(n=150):
    t = pd.date_range(end=datetime.now(), periods=n, freq="10min")
    flow = 420 + np.sin(np.linspace(0, 6 * np.pi, n)) * 30 + np.random.normal(0, 5, n)
    return pd.DataFrame({"timestamp": t, "flow_lpm": flow,
                          "pipe_id": np.random.choice(["P-71-001", "P-71-002", "P-71-003"], n)})


@st.cache_data(ttl=120)
def generate_leak_alerts():
    zones = ["Ward-71-A / Ring Rd Junction", "Ward-71-B / ITPL Spur",
             "Ward-71-C / Varthur Main", "Ward-71-D / Kadugodi"]
    severities = ["CRITICAL", "WARNING", "WARNING", "NORMAL"]
    flows = [23.4, 12.1, 8.7, 0.3]
    ages = [2, 6, 14, 42]
    detected = [datetime.now() - timedelta(hours=h) for h in [0.5, 1.2, 3.0, 8.4]]
    return pd.DataFrame({
        "Zone": zones, "Severity": severities,
        "Est. Loss (L/hr)": flows, "Pipe Age (yrs)": ages,
        "Detected": [d.strftime("%H:%M %d %b") for d in detected],
    })


@st.cache_data(ttl=300)
def generate_rul_data():
    pipes = [f"P-71-{i:03d}" for i in range(1, 13)]
    ages = np.random.uniform(5, 45, 12)
    temp_avg = np.random.uniform(25, 38, 12)
    pressure_avg = np.random.uniform(80, 120, 12)
    # Arrhenius-inspired RUL formula
    k = np.exp(-0.05 * ages) * np.exp(-0.02 * (temp_avg - 20)) * np.exp(0.01 * (100 - pressure_avg))
    rul_years = np.clip(k * 60, 0.5, 50)
    condition = np.where(rul_years < 3, "REPLACE NOW", np.where(rul_years < 10, "MONITOR", "HEALTHY"))
    return pd.DataFrame({
        "Pipe ID": pipes, "Age (yrs)": ages.round(1),
        "Avg Temp (°C)": temp_avg.round(1), "Avg Pressure (PSI)": pressure_avg.round(1),
        "RUL (years)": rul_years.round(2), "Condition": condition,
    })


@st.cache_data(ttl=300)
def generate_crack_report():
    inspections = [
        {"location": "Ward-71-A Trunk Main", "confidence": 0.94, "crack_type": "Longitudinal", "severity": "HIGH"},
        {"location": "Ward-71-B Distribution", "confidence": 0.72, "crack_type": "Transverse", "severity": "MEDIUM"},
        {"location": "Ward-71-C Lateral", "confidence": 0.31, "crack_type": "Hairline", "severity": "LOW"},
        {"location": "Ward-71-D Service Line", "confidence": 0.88, "crack_type": "Circumferential", "severity": "HIGH"},
    ]
    return pd.DataFrame(inspections)


# ── KPI Banner ─────────────────────────────────────────────────────────────────
def render_kpi_banner():
    pressure_df = generate_pressure_stats()
    cols = st.columns(5)
    kpis = [
        ("💧", "Ward 71 Sensors", "128", "Online"),
        ("🚨", "Active Leaks", "3", "Detected"),
        ("📉", "Water Loss", "42,300 L/day", "Estimated"),
        ("🔧", "Pipes at Risk", "4", "RUL < 3yrs"),
        ("🤖", "AI Confidence", "91.4%", "Avg. CNN"),
    ]
    for col, (icon, label, value, sub) in zip(cols, kpis):
        with col:
            st.markdown(f"""
            <div class="metric-card">
                <div style="font-size:1.6rem">{icon}</div>
                <div class="metric-value">{value}</div>
                <div class="metric-label">{label}<br/><span style="color:#475569;font-size:0.65rem">{sub}</span></div>
            </div>
            """, unsafe_allow_html=True)


def generate_pressure_stats():
    return generate_realtime_pressure()


# ── Case 1: Real-time Pressure & Leak Detection ────────────────────────────────
def case_pressure_leak():
    st.subheader("📡 Case 1 — Real-Time Pressure Monitoring & Leak Detection")
    st.caption("Continuous fiber-optic pressure sensor data from Ward 71 distribution network")

    df = generate_realtime_pressure()
    alerts = generate_leak_alerts()

    col1, col2 = st.columns([2, 1])

    with col1:
        # Pressure time-series
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df["timestamp"], y=df["pressure_psi"],
            mode="lines", name="Pressure (PSI)",
            line=dict(color="#22d3ee", width=2),
            fill="tozeroy", fillcolor="rgba(34,211,238,0.05)",
        ))
        # Leak threshold
        fig.add_hline(y=80, line_color="#ef4444", line_dash="dash",
                      annotation_text="⚠ Leak Threshold (80 PSI)",
                      annotation_font_color="#f87171")
        fig.update_layout(
            template="plotly_dark", height=320,
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            xaxis=dict(gridcolor="rgba(51,65,85,0.4)", showline=False),
            yaxis=dict(gridcolor="rgba(51,65,85,0.4)", title="Pressure (PSI)"),
            margin=dict(l=40, r=10, t=20, b=30),
            legend=dict(bgcolor="rgba(0,0,0,0)"),
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.markdown("**🔴 Active Leak Alerts**")
        for _, row in alerts.iterrows():
            badge_cls = {"CRITICAL": "badge-critical", "WARNING": "badge-warning", "NORMAL": "badge-normal"}[row["Severity"]]
            st.markdown(f"""
            <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.5);
                border-radius:10px;padding:0.75rem 1rem;margin-bottom:0.5rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem">
                    <span style="color:#e2e8f0;font-size:0.8rem;font-weight:600">{row['Zone']}</span>
                    <span class="alert-badge {badge_cls}">{row['Severity']}</span>
                </div>
                <div style="color:#64748b;font-size:0.72rem">
                    Loss: <b style="color:#f87171">{row['Est. Loss (L/hr)']} L/hr</b> &nbsp;|&nbsp;
                    Pipe Age: <b style="color:#fbbf24">{row['Pipe Age (yrs)']} yrs</b><br/>
                    Detected: {row['Detected']}
                </div>
            </div>
            """, unsafe_allow_html=True)


# ── Case 2: Flow Distribution Analysis ────────────────────────────────────────
def case_flow_distribution():
    st.subheader("🌊 Case 2 — Flow Distribution Analysis")
    st.caption("Multi-zone water flow balancing and loss quantification")

    df = generate_flow_data()

    col1, col2 = st.columns([3, 2])
    with col1:
        fig = px.area(
            df, x="timestamp", y="flow_lpm", color="pipe_id",
            color_discrete_sequence=["#22d3ee", "#818cf8", "#34d399"],
        )
        fig.update_layout(
            template="plotly_dark", height=300,
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            xaxis=dict(gridcolor="rgba(51,65,85,0.3)"),
            yaxis=dict(gridcolor="rgba(51,65,85,0.3)", title="Flow (L/min)"),
            margin=dict(l=40, r=10, t=20, b=30),
            legend=dict(bgcolor="rgba(0,0,0,0)"),
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        # Zone donut chart
        zone_data = pd.DataFrame({
            "Zone": ["Ward-71-A", "Ward-71-B", "Ward-71-C", "Loss"],
            "Volume": [38, 29, 24, 9],
        })
        fig2 = go.Figure(go.Pie(
            labels=zone_data["Zone"], values=zone_data["Volume"],
            hole=0.6,
            marker=dict(colors=["#22d3ee", "#818cf8", "#34d399", "#ef4444"]),
            textfont=dict(color="white"),
        ))
        fig2.update_layout(
            template="plotly_dark", height=260,
            paper_bgcolor="rgba(0,0,0,0)",
            margin=dict(l=0, r=0, t=20, b=0),
            showlegend=True,
            legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color="#94a3b8", size=11)),
            annotations=[dict(text="Flow<br>Split", x=0.5, y=0.5, font_size=13,
                              font_color="#94a3b8", showarrow=False)],
        )
        st.plotly_chart(fig2, use_container_width=True)


# ── Case 3: CNN Crack Detection ───────────────────────────────────────────────
def case_crack_detection():
    st.subheader("🔍 Case 3 — CNN Crack Detection (AI Vision)")
    st.caption("Convolutional Neural Network analysis of pipe inspection imagery")

    report = generate_crack_report()

    col1, col2 = st.columns([1, 1])
    with col1:
        st.markdown("**Inspection Results**")
        for _, row in report.iterrows():
            sev_color = {"HIGH": "#ef4444", "MEDIUM": "#f59e0b", "LOW": "#22d3ee"}[row["severity"]]
            conf_pct = int(row["confidence"] * 100)
            st.markdown(f"""
            <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(51,65,85,0.5);
                border-radius:12px;padding:1rem;margin-bottom:0.6rem;">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="color:#e2e8f0;font-weight:600;font-size:0.85rem">{row['location']}</span>
                    <span style="color:{sev_color};font-size:0.75rem;font-weight:700">{row['severity']}</span>
                </div>
                <div style="color:#64748b;font-size:0.75rem;margin:0.4rem 0">
                    Type: <b style="color:#94a3b8">{row['crack_type']}</b>
                </div>
                <div style="background:rgba(51,65,85,0.4);border-radius:999px;height:6px;overflow:hidden">
                    <div style="width:{conf_pct}%;height:100%;background:linear-gradient(90deg,{sev_color}88,{sev_color});border-radius:999px"></div>
                </div>
                <div style="color:#64748b;font-size:0.7rem;margin-top:0.25rem">CNN Confidence: {conf_pct}%</div>
            </div>
            """, unsafe_allow_html=True)

    with col2:
        # Confidence bar chart
        fig = go.Figure(go.Bar(
            x=report["location"].str.split("/").str[0],
            y=(report["confidence"] * 100).round(1),
            marker=dict(
                color=(report["confidence"] * 100).tolist(),
                colorscale=[[0, "#22d3ee"], [0.5, "#f59e0b"], [1, "#ef4444"]],
                cmin=0, cmax=100,
            ),
            text=(report["confidence"] * 100).round(1).astype(str) + "%",
            textposition="outside",
            textfont=dict(color="#e2e8f0"),
        ))
        fig.update_layout(
            template="plotly_dark", height=280,
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            xaxis=dict(gridcolor="rgba(51,65,85,0.3)", tickfont=dict(size=10)),
            yaxis=dict(gridcolor="rgba(51,65,85,0.3)", title="CNN Confidence (%)", range=[0, 115]),
            margin=dict(l=40, r=10, t=20, b=40),
        )
        st.plotly_chart(fig, use_container_width=True)


# ── Case 4: RUL Prediction ────────────────────────────────────────────────────
def case_rul_prediction():
    st.subheader("⏳ Case 4 — Remaining Useful Life (RUL) Prediction")
    st.caption("Arrhenius degradation model — temperature & pressure corrected lifetime forecast")

    rul_df = generate_rul_data()

    # Scatter plot: age vs RUL
    color_map = {"REPLACE NOW": "#ef4444", "MONITOR": "#f59e0b", "HEALTHY": "#22d3ee"}
    fig = go.Figure()
    for cond, color in color_map.items():
        subset = rul_df[rul_df["Condition"] == cond]
        fig.add_trace(go.Scatter(
            x=subset["Age (yrs)"], y=subset["RUL (years)"],
            mode="markers+text",
            marker=dict(size=14, color=color, line=dict(width=1, color="white")),
            text=subset["Pipe ID"], textposition="top center",
            textfont=dict(size=10, color="#94a3b8"),
            name=cond,
        ))
    fig.update_layout(
        template="plotly_dark", height=300,
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(gridcolor="rgba(51,65,85,0.3)", title="Current Pipe Age (years)"),
        yaxis=dict(gridcolor="rgba(51,65,85,0.3)", title="Predicted RUL (years)"),
        margin=dict(l=50, r=10, t=20, b=50),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color="#94a3b8")),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Table with conditional formatting
    st.markdown("**Pipe-Level RUL Breakdown**")
    for _, row in rul_df.iterrows():
        badge_cls = {"REPLACE NOW": "badge-critical", "MONITOR": "badge-warning", "HEALTHY": "badge-normal"}[row["Condition"]]
        rul_color = "#ef4444" if row["Condition"] == "REPLACE NOW" else ("#f59e0b" if row["Condition"] == "MONITOR" else "#22d3ee")
        st.markdown(f"""
        <div style="display:flex;align-items:center;gap:1rem;background:rgba(15,23,42,0.6);
            border:1px solid rgba(51,65,85,0.4);border-radius:8px;padding:0.6rem 1rem;margin-bottom:0.4rem">
            <span style="color:#e2e8f0;font-weight:600;font-size:0.85rem;width:80px">{row['Pipe ID']}</span>
            <span style="color:#64748b;font-size:0.8rem;flex:1">Age: {row['Age (yrs)']} yrs &nbsp;|&nbsp; Temp: {row['Avg Temp (°C)']}°C &nbsp;|&nbsp; Press: {row['Avg Pressure (PSI)']} PSI</span>
            <span style="color:{rul_color};font-weight:700;font-size:0.9rem">{row['RUL (years)']} yrs</span>
            <span class="alert-badge {badge_cls}">{row['Condition']}</span>
        </div>
        """, unsafe_allow_html=True)


# ── Case 5: Citizen Complaint Heatmap ─────────────────────────────────────────
def case_citizen_heatmap():
    st.subheader("🗺️ Case 5 — Citizen Complaint Geo-Heatmap")
    st.caption("Aggregated BBMP/BWSSB complaint data mapped to Ward 71 sub-zones")

    np.random.seed(42)
    n = 180
    # Ward 71 Bengaluru approximate center: 12.97°N, 77.73°E
    lats = np.random.normal(12.97, 0.015, n)
    lons = np.random.normal(77.73, 0.018, n)
    types = np.random.choice(["Water Leak", "No Supply", "Low Pressure", "Pipe Burst"], n,
                              p=[0.4, 0.3, 0.2, 0.1])
    complaints_df = pd.DataFrame({"lat": lats, "lon": lons, "type": types,
                                   "reported": [f"{np.random.randint(1,72)}h ago" for _ in range(n)]})

    fig = px.density_mapbox(
        complaints_df, lat="lat", lon="lon", radius=18,
        color_continuous_scale="YlOrRd",
        mapbox_style="carto-darkmatter",
        zoom=13, center={"lat": 12.97, "lon": 77.73},
        height=400,
    )
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=0, b=0),
        coloraxis_showscale=False,
    )
    st.plotly_chart(fig, use_container_width=True)

    # Summary bar
    type_counts = complaints_df["type"].value_counts()
    col1, col2, col3, col4 = st.columns(4)
    for col, (t, c) in zip([col1, col2, col3, col4], type_counts.items()):
        with col:
            st.metric(label=t, value=c, delta=f"{np.random.randint(-5,15)}% this week")


# ── Case 6: Predictive Maintenance Dashboard ──────────────────────────────────
def case_predictive_maintenance():
    st.subheader("🔧 Case 6 — Predictive Maintenance Scheduler")
    st.caption("AI-driven maintenance prioritisation using RUL + leak risk composite score")

    pipes = [f"P-71-{i:03d}" for i in range(1, 9)]
    rul = np.array([0.8, 1.5, 2.2, 4.1, 6.3, 9.5, 14.2, 22.0])
    leak_risk = np.array([0.92, 0.85, 0.78, 0.55, 0.42, 0.31, 0.18, 0.09])
    priority = 0.6 * (1 / (rul + 0.1)) + 0.4 * leak_risk
    priority = (priority - priority.min()) / (priority.max() - priority.min()) * 100

    # Gantt-style horizontal bars
    fig = go.Figure()
    colors = ["#ef4444" if p > 70 else "#f59e0b" if p > 40 else "#22d3ee" for p in priority]
    fig.add_trace(go.Bar(
        x=priority, y=pipes, orientation="h",
        marker=dict(color=colors, line=dict(width=0)),
        text=[f"{p:.0f}%" for p in priority], textposition="outside",
        textfont=dict(color="#94a3b8"),
    ))
    fig.add_vline(x=70, line_color="#ef4444", line_dash="dash",
                  annotation_text="Critical Threshold", annotation_font_color="#f87171")
    fig.update_layout(
        template="plotly_dark", height=320,
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(gridcolor="rgba(51,65,85,0.3)", title="Maintenance Priority Score (%)", range=[0, 120]),
        yaxis=dict(gridcolor="rgba(51,65,85,0.3)"),
        margin=dict(l=80, r=60, t=20, b=40),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Schedule table
    schedule_data = {
        "Pipe ID": pipes[:4],
        "Priority Score": [f"{p:.0f}%" for p in priority[:4]],
        "Recommended Action": ["Emergency Replace", "Schedule Repair", "Inspect & Monitor", "Inspect & Monitor"],
        "Est. Cost (₹)": ["2,40,000", "85,000", "15,000", "15,000"],
        "Deadline": ["Within 48h", "Within 2 weeks", "Within 1 month", "Within 1 month"],
    }
    st.dataframe(
        pd.DataFrame(schedule_data),
        use_container_width=True,
        hide_index=True,
    )


# ── MAIN APP ───────────────────────────────────────────────────────────────────
def main():
    # Header
    st.markdown("""
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;
        padding:1rem 1.5rem;background:linear-gradient(135deg,rgba(14,165,233,0.08),rgba(6,182,212,0.04));
        border:1px solid rgba(14,165,233,0.15);border-radius:16px;">
        <div style="font-size:2rem">💧</div>
        <div>
            <h2 style="margin:0;font-size:1.3rem;color:#f1f5f9">AquaGuardian Analytics Engine</h2>
            <p style="margin:0;font-size:0.8rem;color:#64748b">
               · FusionX 2026  — Urban Water Leakage
                &nbsp;|&nbsp; <span style="color:#22d3ee;font-weight:600">● LIVE</span>
                &nbsp;|&nbsp; Updated: {now}
            </p>
        </div>
    </div>
    """.format(now=datetime.now().strftime("%H:%M:%S, %d %b %Y")), unsafe_allow_html=True)

    # KPI Banner
    render_kpi_banner()
    st.markdown("<br/>", unsafe_allow_html=True)

    # Tabs for 6 cases
    tabs = st.tabs([
        "📡 Pressure & Leaks",
        "🌊 Flow Distribution",
        "🔍 Crack Detection",
        "⏳ RUL Prediction",
        "🗺️ Citizen Heatmap",
        "🔧 Maintenance",
    ])

    with tabs[0]: case_pressure_leak()
    with tabs[1]: case_flow_distribution()
    with tabs[2]: case_crack_detection()
    with tabs[3]: case_rul_prediction()
    with tabs[4]: case_citizen_heatmap()
    with tabs[5]: case_predictive_maintenance()

    # Footer
    st.markdown("---")
    st.caption("AquaGuardian v2.1 · Powered by Streamlit · CNN Crack Detection + Arrhenius RUL + Supabase RLS")


if __name__ == "__main__":
    main()
