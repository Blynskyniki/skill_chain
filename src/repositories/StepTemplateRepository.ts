// repositories/StepTemplateRepository.ts
import { SkillStep } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'step_templates.json');

export class StepTemplateRepository {
  private async read(): Promise<SkillStep[]> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async write(data: SkillStep[]): Promise<void> {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  }

  async getAll(): Promise<SkillStep[]> {
    return this.read();
  }

  async getById(id: string): Promise<SkillStep | undefined> {
    const all = await this.read();
    return all.find(t => t.id === id);
  }

  async mapById(): Promise<Record<string, SkillStep>> {
    const all = await this.read();
    return Object.fromEntries(all.map(t => [t.id, t]));
  }

  async create(tpl: SkillStep): Promise<SkillStep> {
    const all = await this.read();
    all.push(tpl);
    await this.write(all);
    return tpl;
  }

  async update(id: string, update: Partial<SkillStep>): Promise<void> {
    const all = await this.read();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...update };
    await this.write(all);
  }

  async delete(id: string): Promise<void> {
    const all = await this.read();
    await this.write(all.filter(t => t.id !== id));
  }
}
