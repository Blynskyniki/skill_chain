import { createContext, Script } from 'vm';
import { ExecutionContext, SkillStep } from '../../types';

export async function runJs(
  sourceCode: string,
  step: SkillStep,
  inputs: Record<string, unknown>,
  context: ExecutionContext,
): Promise<Record<string, unknown>> {
  const sandbox = {
    ...inputs,
    ...context,
    config: step.config ?? {},
    console,
    fetch,
    result: {},
  };

  const script = new Script(`
    async function __runStep__(context) {
      with (context) {
        ${sourceCode}
      }
    }
    __runStep__(this).then(r => result = r).catch(e => { throw e });
  `);

  await script.runInContext(createContext(sandbox), { timeout: 1000 });
  return sandbox.result as Record<string, unknown>;
}
