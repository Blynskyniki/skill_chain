import { IStepExecutor } from './IStepExecutor';
import { SkillStep } from '../types';

export class TransformStepExecutor implements IStepExecutor {
  supports(type: string): boolean {
    return type === 'transform';
  }

  async execute(step: SkillStep, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    const output: Record<string, unknown> = {};
    for (const port of step.outputs) {
      output[port.name] = inputs[port.name];
    }
    return output;
  }
}
