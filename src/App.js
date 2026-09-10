import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
  ReferenceDot, CartesianGrid, LineChart, Line, Tooltip
} from "recharts";

// --- IMAGE IMPORTS ---
import stage0Img from "./images/stage0.png";
import stage1Img from "./images/stage1.png";
import stage2Img from "./images/stage2.png";
import stage3Img from "./images/stage3.png";

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

// --- IMAGE-BASED CLD COMPONENT ---
const StageCld = ({ stage }) => {
  const imageMap = {
    0: stage0Img,
    1: stage1Img,
    2: stage2Img,
    3: stage3Img,
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: `1px solid ${COLORS.line}`, marginBottom: '20px' }}>
      <p style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', marginBottom: '15px', color: COLORS.inkSoft }}>Causal Loop Diagram</p>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <img 
          src={imageMap[stage] || imageMap[0]} 
          alt={`Causal Loop Diagram Stage ${stage}`} 
          style={{ width: '100%', height: 'auto', borderRadius: '8px', objectFit: 'contain' }} 
        />
      </div>
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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>BMI System Dynamics Simulation</h1>
          <p style={{ color: COLORS.inkSoft }}>Analyze the interaction between reinforcing and balancing loops.</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: `1px solid ${COLORS.line}`, height: "fit-content" }}>
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
                  <input type=\"range\" min={0} max={7} value={user.sportDays} onChange={e => setUser({...user, sportDays: parseInt(e.target.value)})} style={{ width: \"100%\", accentColor: COLORS.accent }} />
                </div>
                <button onClick={() => setStage(3)} style={{ width: \"100%\", padding: 12, background: COLORS.accent, color: \"#fff\", border: \"none\", borderRadius: 8, cursor: \"pointer\" }}>Continue to Stage 3</button>
              </div>
            )}

            {stage === 3 && (
              <div style={{ display: \"flex\", flexDirection: \"column\", gap: 15 }}>
                <h3 style={{ marginTop: 0 }}>Stage 3: Nutritional Quality</h3>
                <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Equilibrium: 20% Healthy Food</p>
                <div><label style={{ fontSize: 13 }}>Healthy Food: {user.healthyEating}%</label>
                  <input type=\"range\" min={0} max={100} value={user.healthyEating} onChange={e => setUser({...user, healthyEating: parseInt(e.target.value)})} style={{ width: \"100%\", accentColor: COLORS.accent }} />
                </div>
                <button onClick={() => setStage(0)} style={{ width: \"100%\", padding: 12, background: \"#666\", color: \"#fff\", border: \"none\", borderRadius: 8, cursor: \"pointer\" }}>Restart Simulation</button>
              </div>
            )}
            
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13 }}>Simulation Duration: {user.weeks} weeks</label>
              <input type=\"range\" min={1} max={52} value={user.weeks} onChange={e => setUser({...user, weeks: parseInt(e.target.value)})} style={{ width: \"100%\", accentColor: COLORS.accent }} />
            </div>
          </div>

          <div style={{ display: \"flex\", flexDirection: \"column\", gap: 20 }}>
            <div style={{ background: \"#fff\", padding: 32, borderRadius: 16, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: \"flex\", alignItems: \"baseline\", gap: 16, marginBottom: 10 }}>
                <span style={{ fontSize: 56, fontWeight: 600 }}>{finalBmi.toFixed(1).replace(\".\", \",\")}</span>
                <span style={{ fontSize: 20, fontWeight: 500, color: status.color }}>{status.label}</span>
              </div>
              <p style={{ color: COLORS.inkSoft, marginBottom: 30 }}>Reference Range for {user.age} years: {bounds.lower.toFixed(0)}–{bounds.upper.toFixed(0)}</p>
              <div style={{ height: 250, width: \"100%\", marginBottom: 20 }}>
                <ResponsiveContainer width=\"100%\" height=\"100%\">\n                  <AreaChart data={referenceChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>\n                    <CartesianGrid stroke={COLORS.line} vertical={false} />\n                    <XAxis dataKey=\"age\" type=\"number\" domain={[18, 90]} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />\n                    <YAxis domain={[Y_MIN, Y_MAX]} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />\n                    <Area dataKey=\"underweight\" stackId=\"z\" stroke=\"none\" fill={COLORS.underweight} fillOpacity={0.8} />\n                    <Area dataKey=\"normal\" stackId=\"z\" stroke=\"none\" fill={COLORS.normal} fillOpacity={0.8} />\n                    <Area dataKey=\"overweight\" stackId=\"z\" stroke=\"none\" fill={COLORS.overweight} fillOpacity={0.8} />\n                    <Area dataKey=\"obesity\" stackId=\"z\" stroke=\"none\" fill={COLORS.obesity} fillOpacity={0.8} />\n                    <ReferenceDot x={user.age} y={finalBmi} r={6} fill=\"#fff\" stroke={COLORS.ink} strokeWidth={2} />\n                  </AreaChart>\n                </ResponsiveContainer>\n              </div>
              <div style={{ position: \"relative\", height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${COLORS.underweight}, ${COLORS.normal} 30%, ${COLORS.normal} 60%, ${COLORS.overweight} 80%, ${COLORS.obesity})` }}>
                <div style={{ position: \"absolute\", left: `${Math.max(0, Math.min(100, ((finalBmi - Y_MIN) / (Y_MAX - Y_MIN)) * 100))}%`, top: -4, width: 18, height: 18, borderRadius: \"50%\", background: \"#fff\", border: `2px solid ${COLORS.ink}`, transform: \"translateX(-50%)\" }} />
              </div>
            </div>
            <div style={{ background: \"#fff\", padding: 32, borderRadius: 16, border: `1px solid ${COLORS.line}` }}>
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>BMI Development Trend</h3>
              <div style={{ height: 300, width: \"100%\" }}>
                <ResponsiveContainer width=\"100%\" height=\"100%\">\n                  <LineChart data={simulationData} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>\n                    <CartesianGrid stroke={COLORS.line} vertical={false} />\n                    <XAxis dataKey=\"week\" tick={{ fontSize: 12, fill: COLORS.inkSoft }} />\n                    <YAxis domain={[Y_MIN, Y_MAX]} tick={{ fontSize: 12, fill: COLORS.inkSoft }} />\n                    <Tooltip />\n                    <Line type=\"monotone\" dataKey=\"bmi\" stroke={COLORS.accent} strokeWidth={3} dot={false} animationDuration={300} />\n                    <text x=\"95%\" y=\"290\" textAnchor=\"middle\" fontSize=\"12\" fill={COLORS.inkSoft} fontWeight=\"600\">Weeks</text>\n                  </LineChart>\n                </ResponsiveContainer>\n              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}