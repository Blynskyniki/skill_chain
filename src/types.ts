// --- Типы ---
import { JSONSchema7 } from 'json-schema';

// Типы данных для портов
export type PortDataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

export interface Port {
  name: string;
  type: PortDataType;
  schema?: JSONSchema7;
}

export interface ExecutableCode {
  language: 'javascript' | 'python';
  sourceCode: string;
}

// --- StepTemplate ---
// Шаблон переиспользуемого шага (без конфигурации исполнения)
export interface StepTemplate {
  id: string;
  name: string;
  type: 'code' | 'api_call' | 'transform' | 'condition' | 'loop';
  description?: string;
  inputs: Port[];
  outputs: Port[];
  configSchema?: JSONSchema7;
  config?: Record<string, unknown>; // ← добавлено!
  code?: ExecutableCode;
}

// --- SkillStep ---
// Конкретная реализация шага в навыке с привязкой к шаблону
export interface SkillStep {
  id: string;
  name: string;
  templateId: string;
  config: Record<string, unknown>;
  inputs: Port[];
  outputs: Port[];
}

// --- Связи между шагами ---
export interface Link {
  id: string;
  fromStepId: string;
  fromPort: string;
  toStepId: string;
  toPort: string;
}

// --- Skill ---
// Навык — граф из шагов и связей
export interface Skill {
  id: string;
  name: string;
  description?: string;
  steps: SkillStep[];
  links: Link[];
  startStepId: string;
}

export type ExecutionContext = Record<string, unknown>;

// --- Execution log ---
export interface SkillExecutionLog {
  id: string;
  skillId: string;
  timestamp: string;
  context: ExecutionContext;
}

// --- Ответ при запуске навыка ---
export interface SkillRunResult {
  context: ExecutionContext;
  logId: string;
}
