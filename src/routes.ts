// routes.ts — Fastify роутинг на основе архитектуры Skill/StepTemplate
import {FastifyInstance, FastifyRequest} from 'fastify';
import {v4 as uuidv4} from 'uuid';
import {StepTemplateRepository} from './repositories/StepTemplateRepository';
import {SkillRepository} from './repositories/SkillRepository';
import {ExecutionLogRepository} from './repositories/ExecutionLogRepository';
import {SkillExecutor} from './executors';
import {Skill, SkillExecutionLog, SkillStep} from './types';

/**
 * Типы, импортируемые из './types':
 *
 * StepTemplate — шаблон шага, общий и переиспользуемый.
 * Skill — навык, содержащий список экземпляров шагов, граф и стартовую точку.
 * SkillStepInstance — конкретный шаг, ссылающийся на StepTemplate с конкретной конфигурацией.
 * SkillExecutionLog — лог исполнения навыка с сохранённым ExecutionContext.
 * SkillRunResult — ответ при запуске навыка: финальный context и ID лога исполнения.
 * CreateSkillPayload / UpdateSkillPayload — входные типы для POST/PUT навыков.
 * CreateTemplatePayload / UpdateTemplatePayload — входные типы для POST/PUT шаблонов шагов.
 */

// --- Payloads ---
export interface CreateSkillPayload extends Omit<Skill, 'id'> {}

export interface UpdateSkillPayload extends Partial<CreateSkillPayload> {}

export interface CreateTemplatePayload extends Omit<SkillStep, 'id'> {}

export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {}

export async function registerRoutes(app: FastifyInstance) {
  const stepTemplates = new StepTemplateRepository();
  const skills = new SkillRepository();
  const executions = new ExecutionLogRepository();

  // Step Templates
  app.get('/step-templates', async (_, reply) => {
    const result: SkillStep[] = await stepTemplates.getAll();
    reply.send(result);
  });

  app.post('/step-templates', async (req: FastifyRequest<{ Body: CreateTemplatePayload }>, reply) => {
    const created = await stepTemplates.create({ ...req.body, id: uuidv4() });
    reply.send(created);
  });

  app.get('/step-templates/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const tpl = await stepTemplates.getById(req.params.id);
    tpl ? reply.send(tpl) : reply.status(404).send({ error: 'Not found' });
  });

  app.put(
    '/step-templates/:id',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: UpdateTemplatePayload;
      }>,
      reply,
    ) => {
      await stepTemplates.update(req.params.id, req.body);
      reply.send({ ok: true });
    },
  );

  app.delete('/step-templates/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    await stepTemplates.delete(req.params.id);
    reply.send({ ok: true });
  });

  // Skills
  app.get('/skills', async (_, reply) => {
    const result: Skill[] = await skills.getAll();
    reply.send(result);
  });

  app.post('/skills', async (req: FastifyRequest<{ Body: CreateSkillPayload }>, reply) => {
    const skill = await skills.create({ ...req.body, id: uuidv4() });
    reply.send(skill);
  });

  app.get('/skills/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const skill = await skills.getById(req.params.id);
    skill ? reply.send(skill) : reply.status(404).send({ error: 'Not found' });
  });

  app.put('/skills/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: UpdateSkillPayload }>, reply) => {
    await skills.update(req.params.id, req.body);
    reply.send({ ok: true });
  });

  app.delete('/skills/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    await skills.delete(req.params.id);
    reply.send({ ok: true });
  });

  // Запуск навыка
  app.post(
    '/skills/:id/run',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: Record<string, unknown>;
      }>,
      reply,
    ) => {
      const skill = await skills.getById(req.params.id);
      if (!skill) return reply.status(404).send({ error: 'Skill not found' });

      try {
        const executor = new SkillExecutor(skill);
        const run_data = await executor.run(req.body); // включает context + steps + result
        const log = await executions.log(skill.id, run_data);

        reply.send({ run_data, logId: log.id });
      } catch (err) {
        console.error(err);
        reply.status(500).send({ error: 'Execution failed', details: String(err) });
      }
    },
  );

  // Execution Logs
  app.get('/skills/:id/executions', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const result: SkillExecutionLog[] = await executions.getBySkillId(req.params.id);
    reply.send(result);
  });

  app.get('/executions/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const log = await executions.getById(req.params.id);
    log ? reply.send(log) : reply.status(404).send({ error: 'Not found' });
  });
}
