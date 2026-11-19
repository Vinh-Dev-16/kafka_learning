export type SimulationId = 'lifecycle' | 'consumer-group' | 'replication';

export type LearningMode = 'learn' | 'practice' | 'design' | 'summary';

export interface Lesson {
  id: string;
  chapterId: string;
  number: number;
  title: string;
  brief: string;
  duration: number;
  level: 'Foundation' | 'Core' | 'Advanced';
  simulation?: SimulationId;
}

export interface Chapter {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  lessons: Lesson[];
}

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface LessonContent {
  overview: string;
  mechanism: string;
  application: string;
  limits: string;
  example: string;
  takeaway: string;
  interviewQuestion: string;
  quiz: QuizQuestion;
}

export interface SimulationStep {
  title: string;
  description: string;
  event: string;
  activeNodes: string[];
  metrics: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }[];
  facts: string[];
}

export interface SimulationDefinition {
  id: SimulationId;
  title: string;
  subtitle: string;
  nodes: { id: string; label: string; kind: 'client' | 'broker' | 'topic' | 'database' }[];
  edges: { from: string; to: string }[];
  steps: SimulationStep[];
}

export interface SavedLearningState {
  version: 1;
  selectedLessonId: string;
  completedLessonIds: string[];
  notes: Record<string, string>;
  lastMode: LearningMode;
}

export interface DesignNode {
  id: string;
  label: string;
  kind: 'producer' | 'broker' | 'topic' | 'consumer' | 'database';
  x: number;
  y: number;
}
