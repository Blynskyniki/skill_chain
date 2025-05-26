// repositories/SkillRepository.ts
import { Skill } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'skills.json');

export class SkillRepository {
  private async read(): Promise<Skill[]> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async write(data: Skill[]): Promise<void> {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  }

  async getAll(): Promise<Skill[]> {
    return this.read();
  }

  async getById(id: string): Promise<Skill | undefined> {
    const all = await this.read();
    return all.find(s => s.id === id);
  }

  async create(skill: Skill): Promise<Skill> {
    const all = await this.read();
    all.push(skill);
    await this.write(all);
    return skill;
  }

  async update(id: string, update: Partial<Skill>): Promise<void> {
    const all = await this.read();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...update };
    await this.write(all);
  }

  async delete(id: string): Promise<void> {
    const all = await this.read();
    await this.write(all.filter(s => s.id !== id));
  }
}
