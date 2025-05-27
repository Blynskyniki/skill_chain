import { IStepExecutor } from './IStepExecutor';
import { ExecutionContext, SkillStep } from '../types';

export class ConditionStepExecutor implements IStepExecutor {
  supports(type: string): boolean {
    return type === 'condition';
  }

  async execute(
    step: SkillStep,
    inputs: Record<string, unknown>,
    _context: ExecutionContext,
  ): Promise<Record<string, unknown>> {
    const flag = inputs['flag'];

    if (typeof flag !== 'boolean') {
      throw new Error(`'flag' input must be boolean`);
    }

    const trueMessage = step.config?.['trueMessage'] ?? '';
    const falseMessage = step.config?.['falseMessage'] ?? '';

    return flag ? { onTrue: trueMessage } : { onFalse: falseMessage };
  }
}
