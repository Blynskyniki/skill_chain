// executors/SkillExecutor.ts
import {
  ExecutionContext,
  Port,
  PortDataType,
  Skill,
  SkillExecutionResult,
  SkillStep,
  StepExecutionLog,
} from '../types';
import { StepExecutorFactory } from './StepExecutorFactory';
import { CodeStepExecutor } from './CodeStepExecutor';
import { ConditionStepExecutor } from './ConditionStepExecutor';
import { TransformStepExecutor } from './TransformStepExecutor';
import { LoopStepExecutor } from './LoopStepExecutor';
import Ajv from 'ajv';

const ajv = new Ajv();

const coercibleTypes: Record<PortDataType, PortDataType[]> = {
  string: ['string', 'file', 'number', 'boolean'],
  number: ['number', 'string'],
  boolean: ['boolean', 'string'],
  object: ['object'],
  array: ['array', 'string'],
  file: ['file', 'string'],
};

function canCoerce(from: PortDataType, to: PortDataType): boolean {
  return coercibleTypes[from]?.includes(to) ?? false;
}

function coerceValue(value: unknown, from: PortDataType, to: PortDataType): unknown {
  if (from === to) return value;

  switch (to) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'array':
      return Array.isArray(value) ? value : [value];
    case 'file':
      return value;
    case 'object':
      return typeof value === 'object' ? value : { value };
    default:
      return value;
  }
}

export class SkillExecutor {
  private factory: StepExecutorFactory;

  constructor(private skill: Skill) {
    this.factory = new StepExecutorFactory([
      new CodeStepExecutor(),
      new ConditionStepExecutor(),
      new TransformStepExecutor(),
      new LoopStepExecutor(this.skill, this),
    ]);
  }

  async run(context: ExecutionContext = {}): Promise<SkillExecutionResult> {
    const portInputs = new Map<string, Record<string, unknown>>();
    const outputs = new Map<string, Record<string, unknown>>();
    const executed = new Set<string>();
    const queue = new Set<string>([this.skill.startStepId]);
    const steps: StepExecutionLog[] = [];
    let lastStepId = this.skill.startStepId;
    let index = 0;

    const start = this.skill.steps.find(s => s.id === this.skill.startStepId);
    if (start) {
      const inputs = Object.fromEntries(
        start.inputs.map(p => [p.name, context[p.name]]).filter(([, v]) => v !== undefined),
      );
      portInputs.set(start.id, inputs);
    }

    while (queue.size) {
      for (const stepId of Array.from(queue)) {
        const step = this.skill.steps.find(s => s.id === stepId);
        if (!step || executed.has(stepId)) continue;

        const inputs = portInputs.get(stepId) || {};
        if (!this.allInputsReady(step.inputs, inputs)) continue;

        try {
          const executor = this.factory.get(step.type);
          const output = await executor.execute(step, inputs, context);

          executed.add(stepId);
          outputs.set(stepId, output);
          lastStepId = stepId;
          queue.delete(stepId);

          steps.push({ order: index++, stepId, name: step.name, input: inputs, output });

          for (const link of this.skill.links.filter(l => l.fromStepId === stepId)) {
            const val = output[link.fromPort];
            const fromPort = step.outputs.find(p => p.name === link.fromPort);
            const toStep = this.skill.steps.find(s => s.id === link.toStepId);
            const toPort = toStep?.inputs.find(p => p.name === link.toPort);

            if (val !== undefined && fromPort && toPort) {
              if (!canCoerce(fromPort.type, toPort.type)) {
                throw new Error(`Type mismatch on link '${link.id}': ${fromPort.type} → ${toPort.type}`);
              }

              const nextInputs = portInputs.get(link.toStepId) || {};
              nextInputs[link.toPort] = coerceValue(val, fromPort.type, toPort.type);
              portInputs.set(link.toStepId, nextInputs);
              queue.add(link.toStepId);
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          steps.push({ order: index++, stepId, name: step.name, input: inputs, output: {}, error: msg });
          return { ...context, steps, result: {}, lastStepId, error: msg };
        }
      }
    }

    return { ...context, steps, result: outputs.get(lastStepId) || {}, lastStepId };
  }

  async executeSingleStep(
    step: SkillStep,
    inputs: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<Record<string, unknown>> {
    const executor = this.factory.get(step.type);
    this.validate(step.inputs, inputs, 'input');
    return await executor.execute(step, inputs, context);
  }

  private allInputsReady(ports: Port[], data: Record<string, unknown>): boolean {
    return ports.every(p => data[p.name] !== undefined);
  }

  private validate(ports: Port[], data: Record<string, unknown>, label: string): void {
    for (const port of ports) {
      const val = data[port.name];
      if (port.schema) {
        const validate = ajv.compile(port.schema);
        if (!validate(val)) {
          throw new Error(`Validation failed for ${label} '${port.name}': ${JSON.stringify(validate.errors)}`);
        }
      }
    }
  }
}
