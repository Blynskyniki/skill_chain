import { ExecutionContext, SkillStep } from '../types';

export interface IStepExecutor {
  supports(type: string): boolean;

  execute(
    step: SkillStep,
    inputs: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<Record<string, unknown>>;
}
