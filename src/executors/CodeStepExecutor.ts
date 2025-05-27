import { IStepExecutor } from './IStepExecutor';
import { ExecutionContext, SkillStep } from '../types';
import { runJs } from './utils/runJs';
import { runPython } from './utils/runPython';

export class CodeStepExecutor implements IStepExecutor {
  supports(type: string): boolean {
    return type === 'code';
  }

  async execute(step: SkillStep, inputs: Record<string, unknown>, context: ExecutionContext) {
    const { language, sourceCode } = step.code!;
    switch (language) {
      case 'javascript':
        return runJs(sourceCode, step, inputs, context);
      case 'python':
        return runPython(sourceCode, step, inputs);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}
