import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
  ReferenceDot, CartesianGrid, LineChart, Line, Tooltip
} from "recharts";

// --- CONSTANTS ---
const ANCHORS = [
  { age: 18, lower: 19, upper: 24 }, { age: 24, lower: 19, upper: 24 },
  { age: 34, lower: 20, upper: 25 }, { age: 44, lower: 21, upper: 26 },
  { age: 54, lower: 22, upper: 27 }, { age: 64, lower: 23, upper: 28 },
  { age: 90, lower: 24, upper: 29 },
];
const GENDER_OFFSET = { male: 0, female: -2 };
const COLORS = {
  bg: "#F5F3EE", ink: "#1E2A28", inkSoft: "#5B6B67",
  line: "#D8D3C8", accent: "#2F6F62",
  underweight: "#E3B05B", normal: "#5C8C6E",
  overweight: "#D98B3F", obesity: "#B5432D",
};
const Y_MIN = 14;
const Y_MAX = 50;

// --- UTILS ---
function boundsForAge(age, gender = "male") {
  const a = Math.max(18, Math.min(90, age));
  const offset = GENDER_OFFSET[gender] ?? 0;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const cur = ANCHORS[i]; const next = ANCHORS[i + 1];
    if (a >= cur.age && a <= next.age) {
      const t = (a - cur.age) / (next.age - cur.age);
      return { lower: cur.lower + t * (next.lower - cur.lower) + offset, upper: cur.upper + t * (next.upper - cur.upper) + offset };
    }
  }
  return { lower: ANCHORS[ANCHORS.length - 1].lower + offset, upper: ANCHORS[ANCHORS.length - 1].upper + offset };
}

function classify(bmi, bounds) {
  if (bmi < bounds.lower) return { label: "Underweight", color: COLORS.underweight };
  if (bmi <= bounds.upper) return { label: "Normal Weight", color: COLORS.normal };
  if (bmi <= bounds.upper + 5) return { label: "Overweight", color: COLORS.overweight };
  return { label: "Obesity", color: COLORS.obesity };
}

// --- DYNAMIC CLD COMPONENT ---
const StageCld = ({ stage }) => {
  return (
    <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: `1px solid ${COLORS.line}`, marginBottom: '20px' }}>
      <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', marginBottom: '10px', color: COLORS.inkSoft }}>Causal Loop Diagram</p>
      <svg viewBox="0 0 400 300" width="100%" height="250" style={{ maxWidth: 400, margin: '0 auto' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#5B6B67" />
          </marker>
          <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.accent} />
          </marker>
        </defs>
        {/* Core Nodes */}
        <rect x="150" y="30" width="100" height="40" rx="10" fill="#fff" stroke={COLORS.ink} strokeWidth="2" />
        <text x="200" y="55" textAnchor="middle" fontSize="12" fontWeight="600">Weight</text>
        <rect x="40" y="120" width="100" height="40" rx="10" fill="#fff" stroke={COLORS.ink} strokeWidth="2" />
        <text x="90" y="145" textAnchor="middle" fontSize="12" fontWeight="600">Hunger</text>
        <rect x="260" y="120" width="100" height="40" rx="10" fill="#fff" stroke={COLORS.ink} strokeWidth="2" />
        <text x="310" y="145" textAnchor="middle" fontSize="12" fontWeight="600">Food Intake</text>
        
        {/* Reinforcing Loop */}
        <path d="M 150 50 Q 90 50 90 120" fill="none" stroke={COLORS.inkSoft} strokeWidth="2" markerEnd="url(#arrowhead)" />
        <text x="70" y="80" fontSize="12" fill={COLORS.inkSoft} fontWeight="bold">+</text>
        <path d="M 140 140 L 260 140" fill="none" stroke={COLORS.inkSoft} strokeWidth="2" markerEnd="url(#arrowhead)" />
        <text x="200" y="135" textAnchor="middle" fontSize="12" fill={COLORS.inkSoft} fontWeight="bold">+</text>
        <path d="M 310 120 Q 310 50 250 50" fill="none" stroke={COLORS.inkSoft} strokeWidth="2" markerEnd="url(#arrowhead)" />
        <text x="320" y="80" fontSize="12" fill={COLORS.inkSoft} fontWeight="bold">+</text>

        {/* Stage 2: Sport Loop */}
        {stage >= 2 && (
          <>
            <rect x="150" y="200" width="100" height="40" rx="10" fill="#fff" stroke={COLORS.accent} strokeWidth="2" />
            <text x="200" y="225" textAnchor="middle" fontSize="12" fontWeight="600">Sport</text>
            <path d="M 200 70 L 200 200" fill="none" stroke={COLORS.accent} strokeWidth="2" markerEnd="url(#arrowhead-green)" />
            <text x="210" y="140" fontSize="12" fill={COLORS.accent} fontWeight="bold">-</text>
          </>
        )}

        {/* Stage 3: Diet Loop */}
        {stage >= 3 && (
          <>
            <rect x="150" y="260" width="100" height="40" rx="10" fill="#fff" stroke={COLORS.accent} strokeWidth="2" />
            <text x="200" y="285" textAnchor="middle" fontSize="12" fontWeight="600">Healthy Food</text>
            <path d="M 200 70 L 200 260" fill="none" stroke={COLORS.accent} strokeWidth="2" markerEnd="url(#arrowhead-green)" />
            <text x="210" y="180" fontSize="12" fill={COLORS.accent} fontWeight="bold">-</text>
          </>
        )}
      </svg>
    </div>
  );
};

export default function BmiSeriousGame() {
  const [stage, setStage] = useState(0);
  const [user, setUser] = useState({
    gender: "female", age: 58, height: 180, weight: 90,
    calories: 2000, sportDays: 0, healthyEating: 0, weeks: 12
  });

  const simulationData = useMemo(() => {
    const history = [];
    let currentW = user.weight;
    const genderThreshold = user.gender === "male" ? 2300 : 1800;
    
    for (let w = 0; w <= user.weeks; w++) {
      const bmi = currentW / Math.pow(user.height / 100, 2);
      history.push({ week: w, bmi });

      let drift = 0;
      if (stage >= 1) drift += (user.calories - genderThreshold) * 0.0001;
      if (stage >= 2) {
        if (user.sportDays < 2) drift += 0.1;
        else if (user.sportDays === 2) drift += 0;
        else if (user.sportDays === 3) drift -= 0.1;
        else if (user.sportDays === 4) drift -= 0.2;
        else drift -= 0.3;
      }
      if (stage >= 3) {
        if (user.healthyEating < 20) drift += 0.1;
        else if (user.healthyEating <= 20) drift += 0;
        else if (user.healthyEating < 30) drift -= 0.1;
        else if (user.healthyEating < 40) drift -= 0.2;
        else drift -= 0.3;
      }
      currentW += drift;
    }
    return history;
  }, [user, stage]);

  const finalBmi = simulationData[simulationData.length - 1].bmi;
  const bounds = boundsForAge(user.age, user.gender);
  const status = classify(finalBmi, bounds);

  const referenceChartData = useMemo(() => {
    const rows = [];
    for (let a = 18; a <= 90; a += 2) {
      const b = boundsForAge(a, user.gender);
      rows.push({ age: a, underweight: Math.max(0, b.lower), normal: Math.max(0, b.upper - b.lower), overweight: 5, obesity: Math.max(0, Y_MAX - (b.upper + 5)) });
    }
    return rows;
  }, [user.gender]);

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh", padding: "40px 24px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>BMI System Dynamics Simulation</h1>
          <p style={{ color: COLORS.inkSoft }}>Analyze the interaction between reinforcing and balancing loops.</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 40 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: `1px solid ${COLORS.line}`, height: "fit-content" }}>
            <StageCld stage={stage} />
            
            {stage === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <h3 style={{ marginTop: 0 }}>Stage 0: Baseline</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  {["female", "male"].map(g => (
                    <button key={g} onClick={() => setUser({...user, gender: g})} 
                      style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${user.gender === g ? COLORS.accent : COLORS.line}`, 
                      background: user.gender === g ? "rgba(47,111,98,0.1)" : "transparent", cursor: "pointer", textTransform: "capitalize" }}>{g}</button>
                  ))}
                </div>
                <div><label style={{ fontSize: 13 }}>Age: {user.age}</label>
                  <input type="range" min={18} max={90} value={user.age} onChange={e => setUser({...user, age: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
                </div>
                <div><label style={{ fontSize: 13 }}>Height (cm): {user.height}</label>
                  <input type="range" min={120} max={220} value={user.height} onChange={e => setUser({...user, height: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
                </div>
                <div><label style={{ fontSize: 13 }}>Weight (kg): {user.weight}</label>
                  <input type="range" min={30} max={200} value={user.weight} onChange={e => setUser({...user, weight: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
                </div>
                <button onClick={() => setStage(1)} style={{ width: "100%", padding: 12, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Continue to Stage 1</button>
              </div>
            )}

            {stage === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <h3 style={{ marginTop: 0 }}>Stage 1: Caloric Intake</h3>
                <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Threshold: {user.gender === 'male' ? '2300' : '1800'} kcal</p>
                <div><label style={{ fontSize: 13 }}>Daily Calories: {user.calories}</label>
                  <input type="range" min={1000} max={4000} step="50" value={user.calories} onChange={e => setUser({...user, calories: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
                </div>
                <button onClick={() => setStage(2)} style={{ width: "100%", padding: 12, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Continue to Stage 2</button>
              </div>
            )}

            {stage === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <h3 style={{ marginTop: 0 }}>Stage 2: Physical Activity</h3>
                <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Equilibrium: 2 days/week</p>
                <div><label style={{ fontSize: 13 }}>Sport: {user.sportDays} days/week</label>
                  <input type="range" min={0} max={7} value={user.sportDays} onChange={e => setUser({...user, sportDays: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
                </div>
                <button onClick={() => setStage(3)} style={{ width: "100%", padding: 12, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Continue to Stage 3</button>
              </div>
            )}

            {stage === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <h3 style={{ marginTop: 0 }}>Stage 3: Nutritional Quality</h3>
                <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Equilibrium: 20% Healthy Food</p>
                <div><label style={{ fontSize: 13 }}>Healthy Food: {user.healthyEating}%</label>
                  <input type="range" min={0} max={100} value={user.healthyEating} onChange={e => setUser({...user, healthyEating: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
                </div>
                <button onClick={() => setStage(0)} style={{ width: "100%", padding: 12, background: "#666", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Restart Simulation</button>
              </div>
            )}
            
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13 }}>Simulation Duration: {user.weeks} weeks</label>
              <input type="range" min={1} max={52} value={user.weeks} onChange={e => setUser({...user, weeks: parseInt(e.target.value)})} style={{ width: "100%", accentColor: COLORS.accent }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 10 }}>
                <span style={{ fontSize: 56, fontWeight: 600 }}>{finalBmi.toFixed(1).replace(".", ",")}</span>
                <span style={{ fontSize: 20, fontWeight: 500, color: status.color }}>{status.label}</span>
              </div>
              <p style={{ color: COLORS.inkSoft, marginBottom: 30 }}>Reference Range for {user.age} years: {bounds.lower.toFixed(0)}–{bounds.upper.toFixed(0)}</p>
              <div style={{ height: 250, width: "100%", marginBottom: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={referenceChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.line} vertical={false} />
                    <XAxis dataKey="age" type="number" domain={[18, 90]} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />
                    <YAxis domain={[Y_MIN, Y_MAX]} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />
                    <Area dataKey="underweight" stackId="z" stroke="none" fill={COLORS.underweight} fillOpacity={0.8} />
                    <Area dataKey="normal" stackId="z" stroke="none" fill={COLORS.normal} fillOpacity={0.8} />
                    <Area dataKey="overweight" stackId="z" stroke="none" fill={COLORS.overweight} fillOpacity={0.8} />
                    <Area dataKey="obesity" stackId="z" stroke="none" fill={COLORS.obesity} fillOpacity={0.8} />
                    <ReferenceDot x={user.age} y={finalBmi} r={6} fill="#fff" stroke={COLORS.ink} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ position: "relative", height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${COLORS.underweight}, ${COLORS.normal} 30%, ${COLORS.normal} 60%, ${COLORS.overweight} 80%, ${COLORS.obesity})` }}>
                <div style={{ position: "absolute", left: `${Math.max(0, Math.min(100, ((finalBmi - Y_MIN) / (Y_MAX - Y_MIN)) * 100))}%`, top: -4, width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `2px solid ${COLORS.ink}`, transform: "translateX(-50%)" }} />
              </div>
            </div>
            <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: `1px solid ${COLORS.line}` }}>
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>BMI Development Trend</h3>
              <div style={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.line} vertical={false} />
                    <XAxis dataKey="week" label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5 }} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />
                    <YAxis domain={[Y_MIN, Y_MAX]} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bmi" stroke={COLORS.accent} strokeWidth={3} dot={false} animationDuration={300} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}