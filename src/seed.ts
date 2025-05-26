// seed.ts — инициализация демо-данных
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Skill } from './types';
import { apiCallStep, conditionStep, lengthCheckStep, loopStep, textInputStep, toUpperCaseStep } from './stepTemplates';

async function seed() {
  const skillId = uuidv4();
  const stepIds = {
    text: textInputStep(),
    upper: toUpperCaseStep(),
    length: lengthCheckStep(),
    cond: conditionStep(),
    loop: loopStep(),
    api: apiCallStep(),
  };

  const skill: Skill = {
    id: skillId,
    name: 'Полный демо навык',
    description: 'Ввод → Регистр → Проверка → Условие → Цикл → API',
    startStepId: stepIds.text.id,
    steps: [
      {
        id: stepIds.text.id,
        name: 'Ввод текста',
        templateId: stepIds.text.id,
        config: { defaultText: 'Пример строки' },
        inputs: [],
        outputs: [{ name: 'text', type: 'string' }],
      },
      {
        id: stepIds.upper.id,
        name: 'ToUpperCase',
        templateId: stepIds.upper.id,
        config: {},
        inputs: [{ name: 'text', type: 'string' }],
        outputs: [{ name: 'upperText', type: 'string' }],
      },
      {
        id: stepIds.length.id,
        name: 'Проверка длины',
        templateId: stepIds.length.id,
        config: { minLength: 5 },
        inputs: [{ name: 'text', type: 'string' }],
        outputs: [{ name: 'isLong', type: 'boolean' }],
      },
      {
        id: stepIds.cond.id,
        name: 'Условие',
        templateId: stepIds.cond.id,
        config: {
          trueMessage: 'Текст длинный',
          falseMessage: 'Текст короткий',
        },
        inputs: [{ name: 'flag', type: 'boolean' }],
        outputs: [
          { name: 'onTrue', type: 'string' },
          { name: 'onFalse', type: 'string' },
        ],
      },
      {
        id: stepIds.loop.id,
        name: 'Цикл',
        templateId: stepIds.loop.id,
        config: { suffix: '_обработано' },
        inputs: [{ name: 'items', type: 'array' }],
        outputs: [{ name: 'looped', type: 'array' }],
      },
      {
        id: stepIds.api.id,
        name: 'API вызов',
        templateId: stepIds.api.id,
        config: {
          method: 'POST',
          url: 'https://api.example.com/search',
          headers: {},
        },
        inputs: [{ name: 'payload', type: 'object' }],
        outputs: [{ name: 'result', type: 'object' }],
      },
    ],
    links: [
      { id: uuidv4(), fromStepId: stepIds.text.id, fromPort: 'text', toStepId: stepIds.upper.id, toPort: 'text' },
      {
        id: uuidv4(),
        fromStepId: stepIds.upper.id,
        fromPort: 'upperText',
        toStepId: stepIds.length.id,
        toPort: 'text',
      },
      {
        id: uuidv4(),
        fromStepId: stepIds.length.id,
        fromPort: 'isLong',
        toStepId: stepIds.cond.id,
        toPort: 'flag',
      },
      { id: uuidv4(), fromStepId: stepIds.cond.id, fromPort: 'onTrue', toStepId: stepIds.loop.id, toPort: 'items' },
      {
        id: uuidv4(),
        fromStepId: stepIds.cond.id,
        fromPort: 'onFalse',
        toStepId: stepIds.loop.id,
        toPort: 'items',
      },
      {
        id: uuidv4(),
        fromStepId: stepIds.loop.id,
        fromPort: 'looped',
        toStepId: stepIds.api.id,
        toPort: 'payload',
      },
    ],
  };

  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(path.join('data', 'step_templates.json'), JSON.stringify(Object.values(stepIds), null, 2));
  await fs.writeFile(path.join('data', 'skills.json'), JSON.stringify([skill], null, 2));

  console.log('✅ Навык и шаги успешно записаны');
}

seed().catch(err => {
  console.error('💥 Ошибка при инициализации данных:', err);
});
