import { IStepExecutor } from './IStepExecutor';
import { ExecutionContext, Skill, SkillStep } from '../types';
import { SkillExecutor } from './index';

export class LoopStepExecutor implements IStepExecutor {
  constructor(
    private skill: Skill,
    private executor: SkillExecutor,
  ) {}

  supports(type: string): boolean {
    return type === 'loop';
  }

  async execute(
    step: SkillStep,
    inputs: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<Record<string, unknown>> {
    const items = inputs['items'];
    if (!Array.isArray(items)) throw new Error(`'items' input must be an array`);

    const config = step.config ?? {};
    const itemVar = config['itemVar'] as string;
    const resultVar = config['resultVar'] as string;
    const bodyStepId = config['bodyStepId'] as string;

    if (!itemVar || !resultVar || !bodyStepId) {
      throw new Error(`Missing config: itemVar, resultVar, or bodyStepId`);
    }

    const results: unknown[] = [];

    for (const item of items) {
      const bodyStep = this.skill.steps.find(s => s.id === bodyStepId);
      if (!bodyStep) throw new Error(`Body step '${bodyStepId}' not found`);

      const inputMap: Record<string, unknown> = { [itemVar]: item };
      const output = await this.executor.executeSingleStep(bodyStep, inputMap, context);

      if (!(resultVar in output)) {
        throw new Error(`Expected result key '${resultVar}' not found in output`);
      }

      results.push(output[resultVar]);
    }

    return { done: results };
  }
}
