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

export type StepType = 'code' | 'transform' | 'condition' | 'loop';

export interface SkillStep {
  /** Уникальный ID шага в пределах навыка */
  id: string;

  /** Название для отображения */
  name: string;

  /** Тип шага: влияет на поведение исполнителя */
  type: StepType;

  /** Описание для UI/документации */
  description?: string;

  /** Входные порты (определяют ожидаемые значения) */
  inputs: Port[];

  /** Выходные порты (определяют, что возвращает шаг) */
  outputs: Port[];

  /** JSON Schema для настройки конфигурации (например, itemsVar, bodyStepId и т.д.) */
  configSchema?: JSONSchema7;

  /** Конкретные параметры, определённые пользователем (подходит под configSchema) */
  config?: Record<string, unknown>;

  /** Исполняемый код — JS или Python, только для type === 'code' */
  code?: ExecutableCode;
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

export interface StepExecutionLog {
  order: number;
  stepId: string;
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
}

export interface SkillExecutionResult extends ExecutionContext {
  steps: StepExecutionLog[];
  result: Record<string, unknown>;
  lastStepId: string;
  error?: string;
}
