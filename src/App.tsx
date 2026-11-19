import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { LearningMode, SavedLearningState } from './types';
import { chapters, getChapterForLesson, lessons } from './data/curriculum';
import { lessonContents } from './data/lesson-content';
import { simulations } from './data/simulations';
import { DesignRoom } from './components/DesignRoom';
import { Simulation } from './components/Simulation';

const STORAGE_KEY = 'kafka-deep-dive-learning-v1';
const modes: { id: LearningMode; label: string; icon: string }[] = [
  { id: 'learn', label: 'Học', icon: '◈' },
  { id: 'practice', label: 'Luyện tập', icon: '⌁' },
  { id: 'design', label: 'Phòng thiết kế', icon: '⌘' },
  { id: 'summary', label: 'Tóm tắt', icon: '▤' },
];

const defaultState: SavedLearningState = {
  version: 1,
  selectedLessonId: 'c01-l02',
  completedLessonIds: [],
  notes: {},
  lastMode: 'learn',
};

function loadState(): SavedLearningState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return defaultState;
    const candidate = value as Partial<SavedLearningState>;
    if (candidate.version !== 1) return defaultState;
    return {
      version: 1,
      selectedLessonId: lessons.some((lesson) => lesson.id === candidate.selectedLessonId) ? candidate.selectedLessonId! : defaultState.selectedLessonId,
      completedLessonIds: Array.isArray(candidate.completedLessonIds)
        ? [...new Set(candidate.completedLessonIds.filter((id): id is string => typeof id === 'string' && lessons.some((lesson) => lesson.id === id)))]
        : [],
      notes: candidate.notes && typeof candidate.notes === 'object' && !Array.isArray(candidate.notes)
        ? Object.fromEntries(Object.entries(candidate.notes).filter(([id, note]) => lessons.some((lesson) => lesson.id === id) && typeof note === 'string'))
        : {},
      lastMode: modes.some((mode) => mode.id === candidate.lastMode) ? candidate.lastMode! : 'learn',
    };
  } catch {
    return defaultState;
  }
}

export default function App() {
  const [saved, setSaved] = useState<SavedLearningState>(loadState);
  const [mode, setMode] = useState<LearningMode>(() => loadState().lastMode);
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['c01']);
  const [mobilePanel, setMobilePanel] = useState<'course' | 'notes' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const lesson = lessons.find((item) => item.id === saved.selectedLessonId) ?? lessons[0];
  const content = lessonContents[lesson.id];
  const chapter = getChapterForLesson(lesson);
  const simulation = lesson.simulation ? simulations[lesson.simulation] : undefined;
  const completeCount = saved.completedLessonIds.length;
  const progress = Math.round((completeCount / lessons.length) * 100);
  const chapterLessonNumber = chapter.lessons.findIndex((item) => item.id === lesson.id) + 1;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, lastMode: mode })); } catch { /* Storage may be disabled or full. */ }
  }, [mode, saved]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMobilePanel(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => searchInput.current?.focus(), 0);
  }, [searchOpen]);

  useEffect(() => {
    setQuizChoice(null);
    setExpandedChapters((current) => current.includes(chapter.id) ? current : [...current, chapter.id]);
  }, [lesson.id, chapter.id]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    if (!normalized) return lessons.slice(0, 8);
    return lessons.filter((item) => `${item.title} ${item.brief} ${getChapterForLesson(item).name}`.toLocaleLowerCase('vi-VN').includes(normalized)).slice(0, 10);
  }, [query]);

  useEffect(() => setActiveSearchIndex(0), [query]);

  const chooseLesson = (lessonId: string) => {
    setSaved((value) => ({ ...value, selectedLessonId: lessonId }));
    setMode('learn');
    setSearchOpen(false);
    setMobilePanel(null);
    setQuery('');
  };

  const markComplete = () => setSaved((value) => ({
    ...value,
    completedLessonIds: value.completedLessonIds.includes(lesson.id) ? value.completedLessonIds : [...value.completedLessonIds, lesson.id],
  }));

  const selectMode = (next: LearningMode) => {
    setMode(next);
    setMobilePanel(null);
  };

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kafka Deep Dive, đầu trang">
          <span className="brand-mark"><span>k</span><i /></span>
          <span className="brand-name"><b>Kafka</b><small>DEEP DIVE / LOCAL LAB</small></span>
        </a>
        <div className="environment-label"><i className="live-dot" /> LOCAL LEARNING ENVIRONMENT <span>/</span> NO BROKER CONNECTED</div>
        <nav className="mode-tabs" aria-label="Điều hướng chính">
          {modes.map((item) => <button key={item.id} className={`mode-tab ${mode === item.id ? 'mode-tab-active' : ''}`} onClick={() => selectMode(item.id)} aria-current={mode === item.id ? 'page' : undefined}><span>{item.icon}</span>{item.label}</button>)}
        </nav>
        <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Tìm bài học"><span>⌕</span><kbd>Ctrl K</kbd></button>
      </header>

      <div className="mobile-bar">
        <button onClick={() => setMobilePanel(mobilePanel === 'course' ? null : 'course')} aria-expanded={mobilePanel === 'course'}>☷ Chương</button>
        <span>{chapter.number} · {lesson.title}</span>
        <button onClick={() => setMobilePanel(mobilePanel === 'notes' ? null : 'notes')} aria-expanded={mobilePanel === 'notes'}>Ghi chú</button>
      </div>

      <div className="workspace">
        <aside className={`course-sidebar ${mobilePanel === 'course' ? 'sidebar-mobile-open' : ''}`} aria-label="Lộ trình khóa học">
          <div className="sidebar-header"><div><span className="eyebrow">LỘ TRÌNH CỦA BẠN</span><h1>Kafka Deep Dive</h1></div><span className="chapter-total">11<br /><small>CHƯƠNG</small></span></div>
          <div className="course-progress-card">
            <div className="progress-line"><span>TIẾN ĐỘ</span><b>{completeCount} / {lessons.length}</b></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
            <div className="progress-subline"><span>{progress}% hoàn thành</span><span>đã lưu cục bộ</span></div>
          </div>
          <div className="chapter-list">
            {chapters.map((item) => {
              const expanded = expandedChapters.includes(item.id);
              const finished = item.lessons.filter((entry) => saved.completedLessonIds.includes(entry.id)).length;
              return <section className={`chapter-section ${item.id === chapter.id ? 'chapter-section-active' : ''}`} key={item.id}>
                <button className="chapter-toggle" onClick={() => setExpandedChapters((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} aria-expanded={expanded}>
                  <span className="chapter-number">{item.number}</span><span className="chapter-meta"><b>{item.name}</b><small>{item.subtitle}</small></span><span className="chapter-count">{finished}/{item.lessons.length}<i className={expanded ? 'chevron chevron-open' : 'chevron'} /></span>
                </button>
                {expanded && <div className="lesson-nav-list">{item.lessons.map((entry) => {
                  const done = saved.completedLessonIds.includes(entry.id);
                  return <button key={entry.id} className={`lesson-nav-item ${lesson.id === entry.id ? 'lesson-nav-active' : ''}`} onClick={() => chooseLesson(entry.id)} aria-current={lesson.id === entry.id ? 'page' : undefined}>
                    <span className={`lesson-status ${done ? 'lesson-status-done' : ''}`}>{done ? '✓' : String(entry.number).padStart(2, '0')}</span><span className="lesson-nav-title">{entry.title}</span>{entry.simulation && <span className="lab-chip">LAB</span>}
                  </button>;
                })}</div>}
              </section>;
            })}
          </div>
          <div className="sidebar-foot"><span>✳</span> HỌC THEO NHỊP CỦA BẠN <i>·</i> OFFLINE</div>
        </aside>

        <main className="lesson-main" id="main-content">
          <div className="breadcrumb"><span>CURRICULUM</span><i>/</i><span>{chapter.number} · {chapter.name.toLocaleUpperCase('vi-VN')}</span><i>/</i><b>{String(chapterLessonNumber).padStart(2, '0')}</b><span className="breadcrumb-spacer" /><span className="local-state"><i /> LƯU TRÊN THIẾT BỊ</span></div>
          {mode === 'learn' && <>
            <section className="lesson-hero">
              <div className="lesson-overline"><span className="lesson-kicker">BÀI HỌC {chapter.number}.{String(chapterLessonNumber).padStart(2, '0')}</span><i />{lesson.level}<i />{lesson.duration} phút{lesson.simulation && <><i /><span className="interactive-label">MÔ PHỎNG TƯƠNG TÁC</span></>}</div>
              <h2>{lesson.title}</h2><p>{lesson.brief}</p>
            </section>
            {simulation && <Simulation key={simulation.id} simulation={simulation} />}
            <article className="reading-card">
              <div className="reading-lead"><span className="reading-symbol">◈</span><div><span className="eyebrow">Ý CHÍNH</span><p>{content.overview}</p></div></div>
              <div className="reading-grid">
                <section className="reading-block"><span className="section-index">01 / MECHANISM</span><h3>Khái niệm và cơ chế</h3><p>{content.mechanism}</p></section>
                <section className="reading-block"><span className="section-index">02 / APPLICATION</span><h3>Áp dụng</h3><p>{content.application}</p></section>
                <section className="reading-block reading-block-warning"><span className="section-index">03 / BOUNDARY</span><h3>Giới hạn và rủi ro</h3><p>{content.limits}</p></section>
                <section className="reading-block reading-example"><span className="section-index">04 / EXAMPLE</span><h3>Ví dụ</h3><p>{content.example}</p></section>
              </div>
              <div className="takeaway-strip"><span>✳</span><div><b>ĐIỂM CẦN NHỚ</b><p>{content.takeaway}</p></div></div>
              <div className="interview-card"><div><span className="eyebrow">CÂU HỎI THỰC TẾ</span><h3>{content.interviewQuestion}</h3><p>Hãy trả lời bằng cách nêu giả định, luồng xử lý và trade-off.</p></div><button onClick={() => selectMode('practice')}>Tự kiểm tra <span>→</span></button></div>
            </article>
            {!simulation && <div className="model-note"><span>⌁</span><div><b>Mô hình hóa bằng ví dụ</b><p>Bài này dùng sơ đồ khái niệm trong phần giải thích. Không có cluster Kafka hay dữ liệu bên ngoài được kết nối.</p></div></div>}
            <div className="lesson-footer-actions"><button className="complete-button" onClick={markComplete}>{saved.completedLessonIds.includes(lesson.id) ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button><div><button className="text-control" disabled={lessons.indexOf(lesson) === 0} onClick={() => chooseLesson(lessons[Math.max(0, lessons.indexOf(lesson) - 1)].id)}>← Bài trước</button><button className="next-control" disabled={lessons.indexOf(lesson) === lessons.length - 1} onClick={() => chooseLesson(lessons[Math.min(lessons.length - 1, lessons.indexOf(lesson) + 1)].id)}>Bài tiếp theo <span>→</span></button></div></div>
          </>}

          {mode === 'practice' && <section className="mode-page practice-page">
            <div className="mode-page-heading"><span className="eyebrow">PRACTICE · BÀI {chapter.number}.{String(chapterLessonNumber).padStart(2, '0')}</span><h2>Tự kiểm tra</h2><p>Đọc tình huống, chọn phương án rồi đối chiếu lời giải thích. Câu hỏi gắn với bài đang học.</p></div>
            <div className="quiz-card"><div className="quiz-card-top"><span>CÂU HỎI 01</span><span>{lesson.title}</span></div><h3>{content.quiz.prompt}</h3><div className="quiz-options">{content.quiz.choices.map((choice, index) => {
              const answered = quizChoice !== null;
              const correct = index === content.quiz.answer;
              return <button key={choice} className={`quiz-option ${quizChoice === index ? 'quiz-option-chosen' : ''} ${answered && correct ? 'quiz-option-correct' : ''} ${answered && quizChoice === index && !correct ? 'quiz-option-wrong' : ''}`} onClick={() => setQuizChoice(index)}><span className="quiz-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span>{answered && correct && <b>✓</b>}</button>;
            })}</div>
              {quizChoice !== null && <div className={`quiz-feedback ${quizChoice === content.quiz.answer ? 'feedback-correct' : 'feedback-review'}`} role="status"><b>{quizChoice === content.quiz.answer ? 'Chính xác.' : 'Xem lại cơ chế.'}</b><span>{content.quiz.explanation}</span></div>}
              <div className="quiz-actions"><button className="text-control" onClick={() => selectMode('learn')}>← Quay lại bài học</button><button className="complete-button" disabled={quizChoice !== content.quiz.answer} onClick={() => { markComplete(); selectMode('learn'); }}>{saved.completedLessonIds.includes(lesson.id) ? '✓ Đã ghi nhận' : 'Ghi nhận hoàn thành'}</button></div>
            </div>
            <div className="practice-context"><span>↳</span><div><b>{lesson.title}</b><p>{content.takeaway}</p></div></div>
          </section>}

          {mode === 'design' && <section className="mode-page design-page"><div className="mode-page-heading"><span className="eyebrow">DESIGN ROOM · SANDBOX LOCAL</span><h2>Phòng thiết kế</h2><p>Kéo node để thay đổi sơ đồ, nối thành phần rồi xem parallelism và backlog minh họa thay đổi ra sao.</p></div><DesignRoom /></section>}

          {mode === 'summary' && <section className="mode-page summary-page">
            <div className="mode-page-heading"><span className="eyebrow">LEARNING SUMMARY · LOCAL PROGRESS</span><h2>Tóm tắt tiến độ</h2><p>Tiến độ, ghi chú và phòng thiết kế được lưu trong trình duyệt này; dữ liệu không đồng bộ sang thiết bị khác.</p></div>
            <div className="summary-hero"><div className="summary-ring" style={{ '--progress': `${progress}%` } as CSSProperties & { '--progress': string }}><strong>{progress}<small>%</small></strong></div><div><span className="eyebrow">KAFKA DEEP DIVE</span><h3>{completeCount} / {lessons.length} bài đã hoàn thành</h3><p>11 chương · 3 mô phỏng chuyên sâu · lưu cục bộ</p></div><button className="complete-button" onClick={() => selectMode('learn')}>Tiếp tục học →</button></div>
            <div className="summary-chapter-grid">{chapters.map((item) => {
              const done = item.lessons.filter((entry) => saved.completedLessonIds.includes(entry.id)).length;
              const percent = Math.round((done / item.lessons.length) * 100);
              return <button className="summary-chapter-card" key={item.id} onClick={() => chooseLesson(item.lessons[0].id)}><span className="summary-card-number">{item.number}</span><span className="summary-card-title"><b>{item.name}</b><small>{done} / {item.lessons.length} bài</small></span><span className="summary-card-bar"><i style={{ width: `${percent}%` }} /></span><span className="summary-arrow">↗</span></button>;
            })}</div>
            <div className="summary-note"><span>⌁</span><div><b>Ghi chú đã lưu</b><p>{Object.values(saved.notes).filter((note) => note.trim()).length} bài có ghi chú riêng. Mở một bài học để tiếp tục viết.</p></div></div>
          </section>}
        </main>

        <aside className={`notes-panel ${mobilePanel === 'notes' ? 'notes-mobile-open' : ''}`} aria-label="Ghi chú và điểm cần nhớ">
          <div className="notes-head"><div><span className="eyebrow">KNOWLEDGE PANEL</span><h2>Ghi chú bài học</h2></div><button className="close-notes" onClick={() => setMobilePanel(null)} aria-label="Đóng ghi chú">×</button></div>
          <div className="notes-current"><span className="notes-current-icon">◈</span><div><b>{chapter.number} · {chapter.name}</b><small>{lesson.title}</small></div></div>
          <section className="note-section"><span className="note-label">TÓM TẮT</span><p>{content.overview}</p></section>
          <section className="note-section"><span className="note-label">ĐIỂM CẦN NHỚ</span><p className="note-takeaway">{content.takeaway}</p></section>
          {simulation && <section className="note-callout"><span>⌁</span><div><b>Simulation data</b><p>{simulation.subtitle}. Chọn từng bước trong canvas để xem trạng thái.</p></div></section>}
          <label className="notes-editor"><span className="note-label">GHI CHÚ RIÊNG <i>· AUTO-SAVE</i></span><textarea value={saved.notes[lesson.id] ?? ''} onChange={(event) => setSaved((value) => ({ ...value, notes: { ...value.notes, [lesson.id]: event.target.value } }))} placeholder="Ghi lại câu hỏi, ví dụ hoặc điều muốn xem lại…" aria-label={`Ghi chú riêng cho ${lesson.title}`} /></label>
          <div className="notes-footer"><span><i /> LƯU CỤC BỘ</span><button onClick={markComplete}>{saved.completedLessonIds.includes(lesson.id) ? '✓ Đã hoàn thành' : 'Hoàn thành bài'} <span>→</span></button></div>
        </aside>
      </div>

      <footer className="statusbar"><span><i className="live-dot" /> LOCAL ENVIRONMENT <b>·</b> NO KAFKA CONNECTION</span><span>{lessons.length} BÀI <b>·</b> {chapters.length} CHƯƠNG <b>·</b> 3 INTERACTIVE MODELS</span><span>KAFKA DEEP DIVE <b>© 2026</b></span></footer>

      {searchOpen && <div className="search-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Tìm bài học">
          <div className="search-input-row"><span>⌕</span><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && searchResults.length) { event.preventDefault(); setActiveSearchIndex((index) => Math.min(searchResults.length - 1, index + 1)); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActiveSearchIndex((index) => Math.max(0, index - 1)); }
            if (event.key === 'Enter' && searchResults[activeSearchIndex]) { event.preventDefault(); chooseLesson(searchResults[activeSearchIndex].id); }
          }} aria-activedescendant={searchResults[activeSearchIndex] ? `search-result-${activeSearchIndex}` : undefined} placeholder="Tìm bài học, chương hoặc khái niệm…" /><kbd>ESC</kbd></div>
          <div className="search-results">{searchResults.length ? searchResults.map((item, index) => {
            const parent = getChapterForLesson(item);
            return <button id={`search-result-${index}`} key={item.id} className={activeSearchIndex === index ? 'search-result-active' : ''} onMouseEnter={() => setActiveSearchIndex(index)} onClick={() => chooseLesson(item.id)}><span className="search-result-number">{parent.number}.{String(item.number).padStart(2, '0')}</span><span><b>{item.title}</b><small>{parent.name} · {item.brief}</small></span><i>↵</i></button>;
          }) : <p className="search-empty">Không tìm thấy bài phù hợp. Thử một từ khóa khác.</p>}</div>
          <div className="search-footer"><span>↑ ↓ CHỌN BÀI</span><span>ENTER MỞ BÀI</span><span>LOCAL SEARCH · 61 LESSONS</span></div>
        </section>
      </div>}
    </div>
  );
}
