import { useEffect, useRef, useState } from "react";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";
import {
  Activity, AudioLines, CircleHelp, Crosshair, Gamepad2, Gauge,
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

const VIZDOOM_REFERENCE_FEED = "https://raw.githubusercontent.com/Farama-Foundation/ViZDoom/main/docs/_static/img/vizdoom-demo.gif";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

function ReferenceObservation({ showDepth, showLabels, speed, running }: { showDepth: boolean; showLabels: boolean; speed: number; running: boolean }) {
  const gameplayCanvas = useRef<HTMLCanvasElement>(null);
  const labelsCanvas = useRef<HTMLCanvasElement>(null);
  const depthCanvas = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ showDepth, showLabels, speed, running });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    settings.current = { showDepth, showLabels, speed, running };
  }, [showDepth, showLabels, speed, running]);

  useEffect(() => {
    let disposed = false;
    let frameTimer = 0;
    let frames: ParsedFrame[] = [];
    let frameIndex = 0;
    let priorFrame: ParsedFrame | undefined;
    let priorRestore: ImageData | undefined;
    const controller = new AbortController();
    const composite = document.createElement("canvas");
    const compositeContext = composite.getContext("2d", { willReadFrequently: true });
    const patchCanvas = document.createElement("canvas");
    const patchContext = patchCanvas.getContext("2d");
    let remainingDelay = 0;
    let lastTime = 0;

    const drawPane = (canvas: HTMLCanvasElement | null, paneIndex: number, paneWidth: number, paneHeight: number) => {
      if (!canvas || !compositeContext) return;
      if (canvas.width !== paneWidth || canvas.height !== paneHeight) {
        canvas.width = paneWidth;
        canvas.height = paneHeight;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, paneWidth, paneHeight);
      context.drawImage(composite, paneIndex * paneWidth, 0, paneWidth, paneHeight, 0, 0, paneWidth, paneHeight);
    };

    const renderNextFrame = (now: number) => {
      if (disposed || !compositeContext || !patchContext || frames.length === 0) return;
      const delta = lastTime ? Math.min(now - lastTime, 250) : 0;
      lastTime = now;
      if (settings.current.running) remainingDelay -= delta * settings.current.speed;
      while (!priorFrame || (settings.current.running && remainingDelay <= 0)) {
        const frame = frames[frameIndex];

        if (priorFrame?.disposalType === 2) {
          compositeContext.clearRect(priorFrame.dims.left, priorFrame.dims.top, priorFrame.dims.width, priorFrame.dims.height);
        } else if (priorFrame?.disposalType === 3 && priorRestore) {
          compositeContext.putImageData(priorRestore, 0, 0);
        }

        const restoreForFrame = frame.disposalType === 3
          ? compositeContext.getImageData(0, 0, composite.width, composite.height)
          : undefined;
        const patch = new ImageData(frame.patch, frame.dims.width, frame.dims.height);
        patchCanvas.width = frame.dims.width;
        patchCanvas.height = frame.dims.height;
        patchContext.putImageData(patch, 0, 0);
        compositeContext.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

        priorFrame = frame;
        priorRestore = restoreForFrame;
        frameIndex = (frameIndex + 1) % frames.length;
        remainingDelay += Math.max(20, frame.delay || 100);
      }

      const paneWidth = Math.floor(composite.width / 4);
      drawPane(gameplayCanvas.current, 0, paneWidth, composite.height);
      drawPane(settings.current.showLabels ? labelsCanvas.current : null, 1, paneWidth, composite.height);
      drawPane(settings.current.showDepth ? depthCanvas.current : null, 2, paneWidth, composite.height);

      frameTimer = window.requestAnimationFrame(renderNextFrame);
    };

    const loadFrames = async () => {
      try {
        const response = await fetch(VIZDOOM_REFERENCE_FEED, { signal: controller.signal });
        if (!response.ok) throw new Error(`Reference feed request failed: ${response.status}`);
        const parsed = parseGIF(await response.arrayBuffer());
        if (disposed) return;
        composite.width = parsed.lsd.width;
        composite.height = parsed.lsd.height;
        frames = decompressFrames(parsed, true);
        if (frames.length === 0) throw new Error("Reference feed has no frames");
        setLoadError(false);
        frameTimer = window.requestAnimationFrame(renderNextFrame);
      } catch {
        if (!disposed) setLoadError(true);
      }
    };

    void loadFrames();
    return () => {
      disposed = true;
      controller.abort();
      window.cancelAnimationFrame(frameTimer);
    };
  }, []);

  return (
    <>
      <canvas className="play-buffer rgb-buffer" ref={gameplayCanvas} role="img" aria-label="Gameplay reference frame" />
      {showLabels && <canvas className="play-buffer labels-overlay" ref={labelsCanvas} role="img" aria-label="Synchronized object-label buffer overlay" />}
      {showDepth && <canvas className="play-buffer depth-overlay" ref={depthCanvas} role="img" aria-label="Synchronized grayscale depth buffer overlay" />}
      {loadError && <span className="buffer-error">REFERENCE FEED COULD NOT LOAD</span>}
    </>
  );
}

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
  const [showDepth, setShowDepth] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const decisions = decisionSets[tick % decisionSets.length];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
      setTick((value) => value + 1);
    }, 1000 / speed);
    return () => window.clearInterval(timer);
  }, [running, speed]);

  const restart = () => { setElapsed(0); setTick(0); setRunning(true); };
  const clock = `${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${Math.floor(elapsed % 60).toString().padStart(2, "0")}`;
  const route = [
    { x: 155, y: 326 }, { x: 155, y: 250 }, { x: 325, y: 250 },
    { x: 325, y: 158 }, { x: 585, y: 158 }, { x: 585, y: 286 },
    { x: 825, y: 286 }, { x: 825, y: 145 }, { x: 1115, y: 145 },
    { x: 1115, y: 248 }, { x: 1280, y: 248 },
  ];
  const routeIndex = tick % route.length;
  const trail = route.slice(0, routeIndex + 1);
  const trailPath = trail.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const mapPlayer = route[routeIndex];
  const mapEnemyOne = { x: 680 + (tick % 6) * 16, y: 202 - (tick % 3) * 12 };
  const mapEnemyTwo = { x: 1000 - (tick % 5) * 13, y: 314 + (tick % 4) * 8 };

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
          <div className="section-head gameplay-head"><div className="section-title"><Gamepad2 size={14} /> GAMEPLAY <span className="feed-tag">RGB · REFERENCE</span></div><div className="overlay-controls" aria-label="Gameplay controls">
            <button className={showLabels ? "overlay-toggle active" : "overlay-toggle"} aria-pressed={showLabels} title="Overlay object label buffer on gameplay" onClick={() => setShowLabels((value) => !value)}>LABELS</button>
            <button className={showDepth ? "overlay-toggle active" : "overlay-toggle"} aria-pressed={showDepth} title="Overlay grayscale distance buffer on gameplay" onClick={() => setShowDepth((value) => !value)}>DEPTH</button>
            <div className="playback-controls" role="group" aria-label="Demo playback speed">
              {SPEED_OPTIONS.map((rate) => (
                <button key={rate} className={speed === rate ? "overlay-toggle active" : "overlay-toggle"} aria-pressed={speed === rate} title={`Playback speed ${rate}×`} onClick={() => setSpeed(rate)}>{rate}×</button>
              ))}
            </div>
          </div></div>
          <div className="game-screen play-screen" aria-label="Gameplay frame with optional aligned observation buffers">
            <ReferenceObservation showDepth={showDepth} showLabels={showLabels} speed={speed} running={running} />
            {showLabels && <span className="overlay-status labels-status">LABEL BUFFER OVERLAY · REFERENCE</span>}
            {showDepth && <span className="overlay-status depth-status">DEPTH BUFFER · DISTANCE, NOT FOG</span>}
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

      <section className="map-panel panel">
        <div className="section-head"><div className="section-title"><Crosshair size={14} /> AUTOMAP / SPATIAL TRACE <span className="active-count">FULL LEVEL VIEW</span></div><span className="trace"><i /> DEMO MAP · NOT LIVE</span></div>
        <div className="map-canvas">
          <svg viewBox="0 0 1400 390" role="img" aria-label="Wide dynamic schematic map with player trail, enemy pins, supplies, and exit">
            <path className="map-rooms" d="M54 58H276V154H54ZM276 88H424V154H276ZM424 45H650V154H424ZM54 154H424V272H54ZM424 154H650V272H424ZM650 80H866V190H650ZM650 190H866V314H650ZM866 104H1074V224H866ZM866 224H1074V330H866ZM1074 138H1340V286H1074ZM252 272H650V356H252Z" />
            <path className="map-corridors" d="M276 120H424M650 120H720V135H866M650 235H760V278H866M1074 188H1165" />
            <path className="map-route-base" d="M155 326V250H325V158H585V286H825V145H1115V248H1280" />
            <path className="map-route-active" d={trailPath} />
            <g className="map-player-marker" transform={`translate(${mapPlayer.x} ${mapPlayer.y})`}><circle r="12"/><path d="M0-21L-7-5H7Z"/></g>
            <g className="map-enemy-marker" transform={`translate(${mapEnemyOne.x} ${mapEnemyOne.y})`}><circle r="9"/><path d="M-16 0H16M0-16V16"/><text x="20" y="-8">CACODEMON A</text></g>
            <g className="map-enemy-marker" transform={`translate(${mapEnemyTwo.x} ${mapEnemyTwo.y})`}><circle r="8"/><path d="M-14 0H14M0-14V14"/><text x="19" y="-7">IMP B</text></g>
            <g className="map-pickup-marker" transform="translate(535 195)"><rect x="-7" y="-7" width="14" height="14"/><text x="13" y="5">ARMOR</text></g>
            <g className="map-pickup-marker" transform="translate(937 274)"><rect x="-6" y="-6" width="12" height="12"/><text x="12" y="5">AMMO</text></g>
            <g className="map-exit-marker" transform="translate(1280 248)"><path d="M0-15L15 0L0 15L-15 0Z"/><text x="22" y="5">EXIT</text></g>
            <text className="map-room-name" x="110" y="110">ENTRY</text><text className="map-room-name" x="492" y="104">PROCESSING</text><text className="map-room-name" x="714" y="151">NORTH HALL</text><text className="map-room-name" x="300" y="323">CENTRAL HUB</text><text className="map-room-name" x="1130" y="184">EXIT WING</text>
          </svg>
          <div className="map-legend"><span><i className="map-key-player"/>PLAYER / TRAIL</span><span><i className="map-key-enemy"/>ENEMIES</span><span><i className="map-key-pickup"/>PICKUPS</span><span><i className="map-key-exit"/>EXIT</span><b>SIMULATED POSITIONS · WAD GEOMETRY NOT CONNECTED</b></div>
        </div>
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
