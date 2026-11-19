import { useEffect, useRef, useState } from 'react';
import type { DragEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { DesignNode } from '../types';

type NodeKind = DesignNode['kind'];
type Edge = { from: string; to: string };
type DesignState = { version: 1; nodes: DesignNode[]; edges: Edge[]; partitions: number; consumers: number; eventRate: number; dbRate: number };

const STORAGE_KEY = 'kafka-deep-dive-design-v1';
const palette: { kind: NodeKind; label: string; hint: string }[] = [
  { kind: 'producer', label: 'Producer', hint: 'Phát record' },
  { kind: 'broker', label: 'Broker', hint: 'Lưu và replicate' },
  { kind: 'topic', label: 'Topic', hint: 'Partition log' },
  { kind: 'consumer', label: 'Consumer', hint: 'Đọc và xử lý' },
  { kind: 'database', label: 'Database', hint: 'Side effect' },
];

const initialState: DesignState = {
  version: 1,
  nodes: [
    { id: 'producer', label: 'Producer', kind: 'producer', x: 110, y: 180 },
    { id: 'broker', label: 'Broker', kind: 'broker', x: 315, y: 180 },
    { id: 'topic', label: 'Topic · 6 partitions', kind: 'topic', x: 520, y: 180 },
    { id: 'consumer', label: 'Consumer group', kind: 'consumer', x: 725, y: 180 },
    { id: 'database', label: 'Database', kind: 'database', x: 725, y: 365 },
  ],
  edges: [
    { from: 'producer', to: 'broker' },
    { from: 'broker', to: 'topic' },
    { from: 'topic', to: 'consumer' },
    { from: 'consumer', to: 'database' },
  ],
  partitions: 6,
  consumers: 4,
  eventRate: 1800,
  dbRate: 1500,
};

function loadDesign(): DesignState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return initialState;
    const value = parsed as Partial<DesignState>;
    if (value.version !== 1 || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return initialState;
    const nodes = value.nodes.filter((node): node is DesignNode => Boolean(node && typeof node.id === 'string' && typeof node.label === 'string' && typeof node.x === 'number' && typeof node.y === 'number' && palette.some((item) => item.kind === node.kind)));
    const ids = new Set(nodes.map((node) => node.id));
    const edges = value.edges.filter((edge): edge is Edge => Boolean(edge && ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to));
    return {
      version: 1,
      nodes,
      edges,
      partitions: Number.isFinite(value.partitions) ? Math.max(1, Math.min(48, Number(value.partitions))) : initialState.partitions,
      consumers: Number.isFinite(value.consumers) ? Math.max(1, Math.min(24, Number(value.consumers))) : initialState.consumers,
      eventRate: Number.isFinite(value.eventRate) ? Math.max(0, Number(value.eventRate)) : initialState.eventRate,
      dbRate: Number.isFinite(value.dbRate) ? Math.max(0, Number(value.dbRate)) : initialState.dbRate,
    };
  } catch {
    return initialState;
  }
}

const titleFor = (kind: NodeKind) => palette.find((item) => item.kind === kind)!;

export function DesignRoom() {
  const [model, setModel] = useState<DesignState>(loadDesign);
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); } catch { /* Storage may be disabled or full. */ }
  }, [model]);

  const addNode = (kind: NodeKind, x = 130 + (model.nodes.length % 4) * 190, y = model.nodes.length % 2 ? 340 : 180) => {
    const info = titleFor(kind);
    const id = `node-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    setModel((value) => ({ ...value, nodes: [...value.nodes, { id, label: info.label, kind, x, y }] }));
    setSelected([id]);
  };

  const pointInCanvas = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 120, y: 180 };
    return {
      x: Math.round(Math.max(70, Math.min(890, ((clientX - rect.left) / rect.width) * 960))),
      y: Math.round(Math.max(70, Math.min(430, ((clientY - rect.top) / rect.height) * 500))),
    };
  };

  const onDrop = (event: DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData('application/kafka-component') as NodeKind;
    if (!palette.some((item) => item.kind === kind)) return;
    const point = pointInCanvas(event.clientX, event.clientY);
    addNode(kind, point.x, point.y);
  };

  const moveNode = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const point = pointInCanvas(event.clientX, event.clientY);
    setModel((value) => ({ ...value, nodes: value.nodes.map((node) => node.id === dragging ? { ...node, ...point } : node) }));
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  };

  const connectSelected = () => {
    if (selected.length !== 2) return;
    const [from, to] = selected;
    setModel((value) => value.edges.some((edge) => edge.from === from && edge.to === to || edge.from === to && edge.to === from)
      ? value
      : { ...value, edges: [...value.edges, { from, to }] });
    setSelected([]);
  };

  const selectedNodes = model.nodes.filter((node) => selected.includes(node.id));
  const activeConsumers = Math.min(model.consumers, model.partitions);
  const lagGrowth = Math.max(0, model.eventRate - model.dbRate);
  const completePath = ['producer', 'broker', 'topic', 'consumer', 'database'].every((kind, index, path) => {
    if (index === path.length - 1) return true;
    const from = model.nodes.filter((node) => node.kind === kind);
    const to = model.nodes.filter((node) => node.kind === path[index + 1]);
    return from.some((a) => to.some((b) => model.edges.some((edge) => edge.from === a.id && edge.to === b.id || edge.to === a.id && edge.from === b.id)));
  });

  return (
    <section className="design-room" aria-label="Phòng thiết kế luồng Kafka">
      <div className="design-intro">
        <div><span className="eyebrow">DESIGN LAB · LOCAL SANDBOX</span><h2>Lắp ghép một luồng event</h2><p>Kéo node vào canvas, chọn hai node để nối. Mọi con số là mô hình minh họa, không gửi dữ liệu đến Kafka.</p></div>
        <button className="quiet-button" onClick={() => { setModel(initialState); setSelected([]); }}>Khôi phục mẫu</button>
      </div>

      <div className="design-layout">
        <aside className="component-palette" aria-label="Thành phần có thể thêm">
          <span className="eyebrow">THÀNH PHẦN</span>
          {palette.map((item) => <button key={item.kind} className={`palette-item palette-${item.kind}`} draggable onDragStart={(event) => event.dataTransfer.setData('application/kafka-component', item.kind)} onClick={() => addNode(item.kind)}>
            <span className="palette-icon">{item.kind === 'producer' ? '↗' : item.kind === 'broker' ? '▦' : item.kind === 'topic' ? '≋' : item.kind === 'consumer' ? '↘' : '▣'}</span><span><b>{item.label}</b><small>{item.hint}</small></span><i>+</i>
          </button>)}
          <div className="connect-help"><b>Nối node</b><span>Chọn hai node trên canvas, sau đó nhấn “Tạo kết nối”.</span></div>
        </aside>

        <div className="design-canvas-wrap">
          <div className="canvas-topline"><span><i className="live-dot" /> SANDBOX ACTIVE</span><span>{model.nodes.length} NODE · {model.edges.length} CONNECTION</span></div>
          <svg ref={svgRef} className="design-canvas" viewBox="0 0 960 500" role="application" aria-label="Canvas có thể kéo thả các node Kafka" onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onPointerMove={moveNode} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)}>
            <defs><pattern id="design-grid" width="48" height="28" patternUnits="userSpaceOnUse"><path d="M0 14 24 0l24 14-24 14z" fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth=".7" /></pattern></defs>
            <rect width="960" height="500" fill="url(#design-grid)" />
            {model.edges.map((edge, index) => {
              const a = model.nodes.find((node) => node.id === edge.from);
              const b = model.nodes.find((node) => node.id === edge.to);
              if (!a || !b) return null;
              const dx = (b.x - a.x) / 2;
              return <g key={`${edge.from}-${edge.to}-${index}`}><path d={`M${a.x} ${a.y} C${a.x + dx} ${a.y},${b.x - dx} ${b.y},${b.x} ${b.y}`} className="design-edge" /><circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r="4" className="edge-joint" /></g>;
            })}
            {model.nodes.map((node) => (
              <g key={node.id} className={`design-node design-node-${node.kind} ${selected.includes(node.id) ? 'design-node-selected' : ''}`} transform={`translate(${node.x},${node.y})`} tabIndex={0} role="button" aria-label={`${node.label}; kéo để di chuyển, Enter để chọn`} aria-pressed={selected.includes(node.id)} onPointerDown={(event) => { event.preventDefault(); svgRef.current?.setPointerCapture(event.pointerId); setDragging(node.id); toggleSelected(node.id); }} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleSelected(node.id); }
                const delta = event.shiftKey ? 16 : 6;
                const move = event.key === 'ArrowLeft' ? { x: -delta, y: 0 } : event.key === 'ArrowRight' ? { x: delta, y: 0 } : event.key === 'ArrowUp' ? { x: 0, y: -delta } : event.key === 'ArrowDown' ? { x: 0, y: delta } : null;
                if (move) { event.preventDefault(); setModel((value) => ({ ...value, nodes: value.nodes.map((item) => item.id === node.id ? { ...item, x: Math.max(70, Math.min(890, item.x + move.x)), y: Math.max(70, Math.min(430, item.y + move.y)) } : item) })); }
              }}>
                <rect x="-78" y="-44" width="156" height="88" rx="14" className="design-node-card" />
                <circle cx="-49" cy="-14" r="15" className="design-node-orb" />
                <text x="-49" y="-9" textAnchor="middle" className="design-node-symbol">{node.kind === 'producer' ? '↗' : node.kind === 'broker' ? '▦' : node.kind === 'topic' ? '≋' : node.kind === 'consumer' ? '↘' : '▣'}</text>
                <text x="-25" y="-10" className="design-node-type">{node.kind.toUpperCase()}</text>
                <text x="0" y="19" textAnchor="middle" className="design-node-label">{node.label}</text>
                <text x="0" y="34" textAnchor="middle" className="design-node-hint">DRAG · MOVE</text>
              </g>
            ))}
            {model.nodes.length === 0 && <text x="480" y="245" textAnchor="middle" className="canvas-empty">Kéo một thành phần từ bên trái vào đây</text>}
          </svg>
          <div className="canvas-actions"><span>{selectedNodes.length === 2 ? `${selectedNodes[0].label} ↔ ${selectedNodes[1].label}` : 'Chọn hai node để tạo kết nối'}</span><div><button className="quiet-button" disabled={selected.length !== 2} onClick={connectSelected}>Tạo kết nối</button><button className="danger-quiet" disabled={!selected.length} onClick={() => { const remove = new Set(selected); setModel((value) => ({ ...value, nodes: value.nodes.filter((node) => !remove.has(node.id)), edges: value.edges.filter((edge) => !remove.has(edge.from) && !remove.has(edge.to)) })); setSelected([]); }}>Xóa chọn</button></div></div>
        </div>
      </div>

      <div className="design-controls-grid">
        <label className="range-control"><span>Partition <b>{model.partitions}</b></span><input type="range" min="1" max="24" value={model.partitions} onChange={(event) => setModel((value) => ({ ...value, partitions: Number(event.target.value) }))} /></label>
        <label className="range-control"><span>Consumer <b>{model.consumers}</b></span><input type="range" min="1" max="24" value={model.consumers} onChange={(event) => setModel((value) => ({ ...value, consumers: Number(event.target.value) }))} /></label>
        <label className="number-control"><span>Event vào / giây</span><input type="number" min="0" max="100000" value={model.eventRate} onChange={(event) => setModel((value) => ({ ...value, eventRate: Math.max(0, Number(event.target.value)) }))} /></label>
        <label className="number-control"><span>DB xử lý / giây</span><input type="number" min="0" max="100000" value={model.dbRate} onChange={(event) => setModel((value) => ({ ...value, dbRate: Math.max(0, Number(event.target.value)) }))} /></label>
      </div>
      <div className="design-readout-grid">
        <div className="design-readout-card"><span>PARALLELISM TỐI ĐA</span><strong>{activeConsumers} <small>/ {model.partitions} partition</small></strong><p>{model.consumers > model.partitions ? `${model.consumers - model.partitions} consumer chưa có partition.` : 'Consumer có thể nhận partition theo assignment.'}</p></div>
        <div className={`design-readout-card ${lagGrowth ? 'readout-warning' : ''}`}><span>BACKLOG MÔ HÌNH / GIÂY</span><strong>{lagGrowth.toLocaleString('vi-VN')} <small>record</small></strong><p>{lagGrowth ? 'Tốc độ vào đang cao hơn tốc độ DB mẫu.' : 'DB mẫu đang theo kịp tốc độ event.'}</p></div>
        <div className={`design-readout-card ${completePath ? '' : 'readout-warning'}`}><span>LUỒNG CƠ BẢN</span><strong>{completePath ? 'Được nối' : 'Thiếu kết nối'}</strong><p>{completePath ? 'Producer → broker → topic → consumer → database' : 'Nối đủ các thành phần trong luồng mẫu để hoàn tất.'}</p></div>
      </div>
      <p className="simulation-disclaimer">Các phép tính chỉ minh họa quan hệ giữa partition, consumer và tốc độ xử lý; không phải benchmark hay dự báo cluster.</p>
    </section>
  );
}
