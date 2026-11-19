import { useEffect, useState } from 'react';
import type { SimulationDefinition } from '../types';

interface SimulationProps {
  simulation: SimulationDefinition;
}

const toneClass = (tone?: 'good' | 'warn' | 'bad') => tone ? `metric-${tone}` : '';

export function Simulation({ simulation }: SimulationProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = simulation.steps[stepIndex];

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [simulation.id]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStepIndex((index) => (index + 1) % simulation.steps.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [playing, simulation.steps.length]);

  const nodePositions = simulation.nodes.map((node, index) => ({
    ...node,
    x: 120 + index * (840 / Math.max(simulation.nodes.length - 1, 1)),
    y: index % 2 === 0 ? 145 : 215,
  }));
  const nodeById = new Map(nodePositions.map((node) => [node.id, node] as const));

  return (
    <section className="simulation-card" aria-label={`Mô phỏng ${simulation.title}`}>
      <div className="simulation-heading">
        <div>
          <span className="eyebrow"><i className="live-dot" /> MÔ HÌNH TƯƠNG TÁC · KHÔNG KẾT NỐI KAFKA</span>
          <h2>{simulation.title}</h2>
          <p>{simulation.subtitle}</p>
        </div>
        <span className="model-badge">DEMO · {simulation.steps.length} BƯỚC</span>
      </div>

      <div className="simulation-stage">
        <svg className="simulation-svg" viewBox="0 0 1080 330" role="img" aria-label={`${current.title}: ${current.description}`}>
          <defs>
            <pattern id={`grid-${simulation.id}`} width="54" height="30" patternUnits="userSpaceOnUse">
              <path d="M0 15 27 0l27 15-27 15z" fill="none" stroke="currentColor" strokeOpacity=".09" strokeWidth=".7" />
            </pattern>
            <filter id={`glow-${simulation.id}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="1080" height="330" fill={`url(#grid-${simulation.id})`} />
          {simulation.edges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;
            const direction = to.x >= from.x ? 1 : -1;
            const startX = from.x + 56 * direction;
            const endX = to.x - 56 * direction;
            const middleX = (startX + endX) / 2;
            const path = `M${startX} ${from.y + 18} C${middleX} ${from.y + 18},${middleX} ${to.y + 18},${endX} ${to.y + 18}`;
            const active = current.activeNodes.includes(from.id) && current.activeNodes.includes(to.id);
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <path d={path} className={`flow-edge ${active ? 'flow-edge-active' : ''}`} />
                {active && <circle r="6" className="flow-packet" filter={`url(#glow-${simulation.id})`}>
                  <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                </circle>}
              </g>
            );
          })}
          {nodePositions.map((node) => {
            const active = current.activeNodes.includes(node.id);
            return (
              <g key={node.id} className={`flow-node ${active ? 'flow-node-active' : ''}`} transform={`translate(${node.x},${node.y})`}>
                <rect x="-62" y="-50" width="124" height="100" rx="13" className={`node-card node-${node.kind}`} />
                <circle cx="0" cy="-12" r="18" className="node-orb" />
                <text x="0" y="-7" textAnchor="middle" className="node-glyph">{node.kind === 'client' ? '↗' : node.kind === 'broker' ? '▦' : node.kind === 'topic' ? '≋' : '▣'}</text>
                <text x="0" y="26" textAnchor="middle" className="node-name">{node.label}</text>
              </g>
            );
          })}
          <text x="20" y="310" className="stage-caption">KAFKA DEEP DIVE / LOCAL SIMULATION</text>
          <text x="1060" y="310" textAnchor="end" className="stage-caption">STEP {String(stepIndex + 1).padStart(2, '0')}</text>
        </svg>
      </div>

      <div className="simulation-controls">
        <div className="step-status" aria-live="polite">
          <span className="step-counter">{String(stepIndex + 1).padStart(2, '0')}<i> / {String(simulation.steps.length).padStart(2, '0')}</i></span>
          <div><strong>{current.title}</strong><p>{current.description}</p></div>
        </div>
        <div className="control-row" aria-label="Điều khiển mô phỏng">
          <button className="icon-control" onClick={() => { setStepIndex(0); setPlaying(false); }} aria-label="Đặt lại mô phỏng" title="Đặt lại">↺</button>
          <button className="primary-control" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>{playing ? 'Ⅱ Tạm dừng' : '▶ Phát'}</button>
          <button className="icon-control" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0} aria-label="Bước trước">←</button>
          <button className="icon-control" onClick={() => setStepIndex((index) => Math.min(simulation.steps.length - 1, index + 1))} disabled={stepIndex === simulation.steps.length - 1} aria-label="Bước tiếp">→</button>
        </div>
      </div>

      <div className="timeline" role="group" aria-label="Chọn bước mô phỏng">
        {simulation.steps.map((step, index) => (
          <button key={step.title} className={`timeline-step ${index === stepIndex ? 'timeline-step-current' : ''} ${index < stepIndex ? 'timeline-step-done' : ''}`} onClick={() => { setStepIndex(index); setPlaying(false); }} aria-current={index === stepIndex ? 'step' : undefined}>
            <span>{String(index + 1).padStart(2, '0')}</span><small>{step.title.replace(/^\d+ · /, '')}</small>
          </button>
        ))}
      </div>

      <div className="simulation-readout">
        <div className="metric-grid">
          {current.metrics.map((metric) => <div className={`metric-card ${toneClass(metric.tone)}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
        </div>
        <div className="event-trace"><span className="eyebrow">EVENT TRACE</span><code>{current.event}</code></div>
        <ul className="fact-list">{current.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      </div>
      <p className="simulation-disclaimer">Minh họa luồng khái niệm. Trạng thái và metric là dữ liệu mẫu, không đại diện cho cluster thật.</p>
    </section>
  );
}
