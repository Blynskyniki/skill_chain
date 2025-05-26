import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import Ajv from 'ajv';
import { ExecutionContext, Port, Skill, SkillStep, StepTemplate } from './types';
import { createContext, Script } from 'node:vm';

const ajv = new Ajv();

interface StepExecutionLog {
  order: number;
  stepId: string;
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
}

export class SkillExecutor {
  constructor(
    private skill: Skill,
    private templates: Record<string, StepTemplate>,
  ) {}

  async run(context: ExecutionContext = {}): Promise<
    ExecutionContext & {
      steps: StepExecutionLog[];
      result: Record<string, unknown>;
      lastStepId: string;
      error?: string;
    }
  > {
    const portInputs = new Map<string, Record<string, unknown>>();
    const outputs = new Map<string, Record<string, unknown>>();
    const executed = new Set<string>();
    const queue = new Set<string>([this.skill.startStepId]);
    const steps: StepExecutionLog[] = [];
    let lastStepId = this.skill.startStepId,
      index = 0;

    const start = this.skill.steps.find(s => s.id === this.skill.startStepId);
    if (start) {
      portInputs.set(
        start.id,
        Object.fromEntries(start.inputs.map(p => [p.name, context[p.name]]).filter(([, v]) => v !== undefined)),
      );
    }

    while (queue.size) {
      for (const stepId of Array.from(queue)) {
        const step = this.skill.steps.find(s => s.id === stepId);
        if (!step || executed.has(stepId)) continue;

        const inputs = portInputs.get(stepId) || {};
        if (!this.allInputsReady(step.inputs, inputs)) continue;

        const tpl = this.templates[step.templateId];
        if (!tpl) throw new Error(`Missing template: ${step.templateId}`);

        try {
          const output = await this.execute(tpl, step, inputs, context);
          executed.add(stepId);
          outputs.set(stepId, output);
          lastStepId = stepId;
          queue.delete(stepId);

          steps.push({ order: index++, stepId, name: step.name, input: inputs, output });

          for (const link of this.skill.links.filter(l => l.fromStepId === stepId)) {
            const val = output[link.fromPort];
            const fromPort = tpl.outputs.find(p => p.name === link.fromPort);
            const toStep = this.skill.steps.find(s => s.id === link.toStepId);
            const toPort = toStep?.inputs.find(p => p.name === link.toPort);

            if (val !== undefined && fromPort && toPort) {
              if (fromPort.type !== toPort.type) {
                throw new Error(`Type mismatch on port link '${link.id}': ${fromPort.type} → ${toPort.type}`);
              }
              const next = portInputs.get(link.toStepId) || {};
              next[link.toPort] = val;
              portInputs.set(link.toStepId, next);
              queue.add(link.toStepId);
            }
          }
        } catch (err) {
          console.error(err);
          const msg = err instanceof Error ? err.message : String(err);
          steps.push({ order: index++, stepId, name: step.name, input: inputs, output: {}, error: msg });
          return { ...context, steps, result: {}, lastStepId, error: msg };
        }
      }
    }

    return { ...context, steps, result: outputs.get(lastStepId) || {}, lastStepId };
  }

  private allInputsReady(ports: Port[], data: Record<string, unknown>): boolean {
    return ports.every(p => data[p.name] !== undefined);
  }

  private async execute(
    template: StepTemplate,
    step: SkillStep,
    inputs: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<Record<string, unknown>> {
    console.log(`🔄 ${step.name} (${step.id})`);
    this.validate(template.inputs, inputs, 'input');

    const { language, sourceCode } = template.code!;
    let result: Record<string, unknown> = {};

    if (language === 'javascript') {
      const sandbox = {
        ...inputs,
        ...context,
        config: { ...(template.config ?? {}), ...(step.config ?? {}) },
        console,
        result: {},
      };
      const vm = new Script(`result = (function() { function run(...data){  ${sourceCode} } return  run(this) })()`);
      vm.runInContext(createContext(sandbox), { timeout: 1000 });
      result = sandbox.result;
    } else if (language === 'python') {
      const file = path.join(tmpdir(), `step_${step.id}.py`);
      await fs.writeFile(file, sourceCode, 'utf-8');
      result = await new Promise((res, rej) => {
        const out: Buffer[] = [];
        const proc = spawn('python3', [file], { stdio: ['pipe', 'pipe', 'inherit'] });
        proc.stdout.on('data', c => out.push(c));
        proc.stdin.write(JSON.stringify(inputs));
        proc.stdin.end();
        proc.on('close', () => {
          try {
            res(JSON.parse(Buffer.concat(out).toString()));
          } catch (e) {
            rej(e);
          }
        });
      });
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }

    const output: Record<string, unknown> = {};
    for (const port of template.outputs) {
      const val = result[port.name];
      if (val !== undefined) {
        if (port.schema) {
          const validate = ajv.compile(port.schema);
          if (!validate(val)) throw new Error(`Output '${port.name}' failed: ${JSON.stringify(validate.errors)}`);
        }
        output[port.name] = val;
      }
    }

    console.log(`✅ ${step.name}`);
    return output;
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
