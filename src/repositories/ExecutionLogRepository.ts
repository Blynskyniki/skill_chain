// repositories/ExecutionLogRepository.ts
import { ExecutionContext, SkillExecutionLog } from '../types';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'execution_logs.json');

export class ExecutionLogRepository {
  private async read(): Promise<SkillExecutionLog[]> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async write(data: SkillExecutionLog[]): Promise<void> {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  }

  async getAll(): Promise<SkillExecutionLog[]> {
    return this.read();
  }

  async getBySkillId(skillId: string): Promise<SkillExecutionLog[]> {
    const all = await this.read();
    return all.filter(l => l.skillId === skillId);
  }

  async getById(id: string): Promise<SkillExecutionLog | undefined> {
    const all = await this.read();
    return all.find(l => l.id === id);
  }

  async log(skillId: string, context: ExecutionContext): Promise<SkillExecutionLog> {
    const entry: SkillExecutionLog = {
      id: uuidv4(),
      skillId,
      timestamp: new Date().toISOString(),
      context,
    };
    const all = await this.read();
    all.push(entry);
    await this.write(all);
    return entry;
  }
}
