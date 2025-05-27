import { tmpdir } from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { SkillStep } from '../../types';

export async function runPython(
  sourceCode: string,
  step: SkillStep,
  inputs: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const file = path.join(tmpdir(), `step_${step.id}.py`);
  await fs.writeFile(file, sourceCode, 'utf-8');

  return new Promise((resolve, reject) => {
    const output: Buffer[] = [];
    const proc = spawn('python3', [file], { stdio: ['pipe', 'pipe', 'inherit'] });

    proc.stdout.on('data', chunk => output.push(chunk));
    proc.stdin.write(JSON.stringify(inputs));
    proc.stdin.end();

    proc.on('close', () => {
      try {
        resolve(JSON.parse(Buffer.concat(output).toString()));
      } catch (err) {
        reject(err);
      }
    });
  });
}
