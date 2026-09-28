import { useEffect, useState } from "react";
import {
  Activity, AudioLines, CircleHelp, Crosshair, Expand, Gamepad2, Gauge,
  GitBranch, HeartPulse, Pause, Play, RotateCcw, Zap,
} from "lucide-react";

type Option = { label: string; score: number };
type Decision = {
  key: string;
  kind: "STRATEGY" | "TACTICAL";
  prompt: string;
  winner: string;
  options: Option[];
  score: number;
  ms: number;
};

const decisionSets: Decision[][] = [
  [
    { key: "goal", kind: "STRATEGY", prompt: "Considering player, enemies, and items: highest-priority goal?", winner: "kill_enemies", options: [{ label: "upgrade", score: 4 }, { label: "survive", score: 3 }, { label: "kill_enemies", score: 86 }, { label: "stock_ammo", score: 14 }], score: .86, ms: 68.3 },
    { key: "dodge", kind: "TACTICAL", prompt: "Attacking cacodemon A. Choose an immediate evasion action.", winner: "dodge_right", options: [{ label: "carry_on", score: 23 }, { label: "dodge_left", score: 36 }, { label: "dodge_right", score: 42 }, { label: "dodge_back", score: 11 }], score: .42, ms: 10.4 },
    { key: "move", kind: "TACTICAL", prompt: "Given the current situation, how should the player move?", winner: "hold_position", options: [{ label: "forward", score: 14 }, { label: "hold_position", score: 82 }, { label: "backward", score: 9 }], score: .82, ms: 9.9 },
    { key: "trigger", kind: "TACTICAL", prompt: "Should the player's trigger be held down right now?", winner: "hold_fire", options: [{ label: "fire", score: 18 }, { label: "hold_fire", score: 88 }], score: .88, ms: 9.7 },
  ],
  [
    { key: "goal", kind: "STRATEGY", prompt: "Considering player, enemies, and items: highest-priority goal?", winner: "kill_enemies", options: [{ label: "upgrade", score: 4 }, { label: "survive", score: 3 }, { label: "kill_enemies", score: 86 }, { label: "stock_ammo", score: 14 }], score: .86, ms: 68.3 },
    { key: "turn", kind: "TACTICAL", prompt: "Which turn input aligns the crosshair with the nearest threat?", winner: "fine_left", options: [{ label: "hard_left", score: 8 }, { label: "fine_left", score: 76 }, { label: "hold", score: 24 }, { label: "fine_right", score: 12 }], score: .76, ms: 8.8 },
    { key: "fire", kind: "TACTICAL", prompt: "Is a living enemy centered, in range, and within equipped ammo?", winner: "fire", options: [{ label: "fire", score: 91 }, { label: "hold_fire", score: 9 }], score: .91, ms: 9.1 },
    { key: "weapon", kind: "TACTICAL", prompt: "Which available weapon should be equipped for this engagement?", winner: "shotgun", options: [{ label: "pistol", score: 22 }, { label: "shotgun", score: 78 }], score: .78, ms: 8.4 },
  ],
];

const stages = [
  ["OBSERVATION", "health · actors · map", "neutral"],
  ["STRATEGY LLM", "Qwen3 · every 8s", "amber"],
  ["GOAL + TARGET", "kill enemies / A", "amber"],
  ["FAST CHOICES × 7", "local logits · target <100ms", "green"],
  ["ACTION REDUCER", "resolve conflicts", "green"],
  ["VIZDOOM", "35 ticks / sec", "neutral"],
];

function DecisionCard({ decision }: { decision: Decision }) {
  const maxScore = Math.max(...decision.options.map((option) => option.score));
  return (
    <article className="decision-card">
      <div className="decision-top">
        <span className={`kind ${decision.kind.toLowerCase()}`}>{decision.kind}</span>
        <span className="decision-key">{decision.key}</span>
        <span className="latency">{decision.ms.toFixed(1)} ms</span>
      </div>
      <p>{decision.prompt}</p>
      <div className="options">
        {decision.options.map((option) => (
          <div className="option" key={option.label}>
            <span className={option.label === decision.winner ? "choice selected" : "choice"}>{option.label}</span>
            <span className="bar"><i className={option.label === decision.winner ? "selected" : ""} style={{ width: `${Math.max(3, option.score / maxScore * 100)}%` }} /></span>
            <span className="percent">{option.score}%</span>
          </div>
        ))}
      </div>
      <div className="score-line"><span>TOP: {decision.winner}</span><span>RAW SCORE {decision.score.toFixed(2)}</span></div>
    </article>
  );
}

function App() {
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(314.8);
  const [tick, setTick] = useState(0);
  const [scenario, setScenario] = useState("MAP01 · CENTRAL PROCESSING");
  const decisions = decisionSets[tick % decisionSets.length];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + .2);
      setTick((value) => value + 1);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [running]);

  const restart = () => { setElapsed(0); setTick(0); setRunning(true); };
  const clock = `${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${Math.floor(elapsed % 60).toString().padStart(2, "0")}`;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#dashboard"><span className="brand-icon"><Crosshair size={15} /></span> DOOM-SLAYER <i>//</i> OPS</a>
        <div className="session"><span className="live-dot" /> {running ? "SESSION LIVE" : "SESSION PAUSED"}<b>/</b> RUN 0007 · SEED 07</div>
        <nav className="actions" aria-label="Session controls">
          <button className="icon-btn help" title="Help" aria-label="Help"><CircleHelp size={15} /></button>
          <button className="action-btn" onClick={restart}><RotateCcw size={12} /> RESTART</button>
          <button className="action-btn" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={12} /> : <Play size={12} />}{running ? "PAUSE" : "RESUME"}</button>
          <span className="local"><i /> LOCAL MODE</span>
        </nav>
      </header>

      <section className="mission">
        <span className="mission-label"><i /> STANDING ORDER</span>
        <p>Reach the exit alive. Clear immediate threats; collect supplies when needed.</p>
        <span className="replan">STRATEGY REFRESH IN <b>{8 - tick % 8}s</b></span>
      </section>

      <section className="dashboard-grid" id="dashboard">
        <section className="viewport panel">
          <div className="section-head"><div className="section-title"><Gamepad2 size={14} /> OBSERVATION FEEDS <span className="feed-tag">FOUR VIZDOOM VIEWS · REFERENCE</span></div><button className="icon-btn" title="Expand viewport" aria-label="Expand viewport"><Expand size={14} /></button></div>
          <div className="game-screen multiview" aria-label="Four ViZDoom reference observation views">
            {(["GAMEPLAY", "LABEL BUFFER", "DEPTH BUFFER", "AUTOMAP"] as const).map((label, index) => (
              <figure className="feed-tile" key={label}>
                <img
                  src="https://raw.githubusercontent.com/Farama-Foundation/ViZDoom/main/docs/_static/img/vizdoom-demo.gif"
                  alt={`ViZDoom ${label.toLowerCase()} reference pane`}
                  style={{ transform: `translateX(-${index * 25}%)` }}
                />
                <figcaption><span>0{index + 1}</span>{label}</figcaption>
              </figure>
            ))}
          </div>
          <div className="feed-footer">
            <div className="goal"><small>ACTIVE GOAL</small><b><Crosshair size={11} /> ATTACKING ENEMIES</b><i>FOCUS: CACODEMON A</i></div>
            <div className="clock"><small>EPISODE 01</small><b>{clock}</b><i>00:00:11 / 00:01:40</i></div>
            <label className="scenario"><small>SCENARIO</small><select value={scenario} onChange={(event) => setScenario(event.target.value)}><option>MAP01 · CENTRAL PROCESSING</option><option>MAP02 · THE HANGAR</option><option>MAP03 · T-MINUS ONE</option></select></label>
          </div>
        </section>

        <aside className="decisions panel">
          <div className="section-head"><div className="section-title"><Activity size={14} /> DECISIONS <span className="active-count">{decisions.length} ACTIVE</span></div><span className="trace"><i /> LIVE TRACE</span></div>
          <div className="model-stack">
            <div className="model strategy"><span><GitBranch size={13} /></span><div><small>STRATEGIC / SLOW LOOP</small><b>Qwen3 · Ollama</b></div><i>8 SEC</i></div>
            <div className="model fast"><span><Zap size={13} /></span><div><small>TACTICAL / FAST LOOP</small><b>Qwen3-8B · System-One adapter</b></div><i>LOCAL</i></div>
          </div>
          <div className="decision-list">{decisions.map((decision) => <DecisionCard decision={decision} key={decision.key} />)}</div>
          <div className="calibration"><i /> LOCAL QWEN SCORES ARE RAW, NOT CALIBRATED CONFIDENCE</div>
          <div className="situation"><div><span>+/-</span> SITUATION REPORT <small>UPDATED {tick % 3 + 1}s AGO</small></div><p>Player holding position while aligning on cacodemon A. Threat at close range; shotgun loaded. Armor stable.</p></div>
        </aside>
      </section>

      <section className="trace-panel panel">
        <nav className="rail" aria-label="Telemetry views"><button className="active" title="Workflow graph" aria-label="Workflow graph"><GitBranch size={14} /></button><button title="Metrics" aria-label="Metrics"><Gauge size={14} /></button><button title="Game health" aria-label="Game health"><HeartPulse size={14} /></button><span /><button title="Audio telemetry" aria-label="Audio telemetry"><AudioLines size={14} /></button></nav>
        <div className="trace-body">
          <div className="trace-heading"><div><small>EXECUTION TRACE / 0007</small><h1>Decision graph</h1></div><div className="metrics"><div><small>TACTICAL LATENCY</small><b>9.4 <i>ms*</i></b></div><div><small>CONTROL GAP</small><b>184 <i>ms</i></b></div><div><small>VRAM</small><b>— <i>/ 12 GB</i></b></div></div></div>
          <div className="graph" role="img" aria-label="Observation to strategy to fast choices to action reducer to ViZDoom">
            <div className="flow">{stages.map(([title, sub, tone], index) => <div className="stage" key={title}><div className={`node ${tone} ${index === 3 ? "working" : ""}`}><small>0{index + 1}</small><b>{title}</b><i>{sub}</i>{index === 3 && <em />}</div>{index < stages.length - 1 && <span className={`edge ${index < 4 ? "active" : ""}`}><i /></span>}</div>)}</div>
            <div className="legend"><span><i className="green-line" /> FAST INFERENCE PATH</span><span><i className="amber-line" /> STRATEGIC REPLAN</span><span className="async">MODEL CALLS RUN ASYNCHRONOUSLY</span></div>
          </div>
          <div className="status"><span><i /> SIMULATION STREAM</span><span>STRATEGY CADENCE <b>8 s</b></span><span>TACTICAL CADENCE <b>ON OBSERVATION</b></span><span className="benchmark">* TARGET ONLY · HARDWARE BENCHMARK PENDING</span></div>
        </div>
      </section>
      <footer><span>DOOM-SLAYER <i>0.1.0</i></span><span>BUILT AROUND VIZDOOM + FREEDOOM <i>·</i> PREVIEW: FARAMA / VIZDOOM</span><span>LOCAL FIRST <b>●</b></span></footer>
    </main>
  );
}

export default App;