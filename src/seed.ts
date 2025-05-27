import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Skill } from './types';
import { llmCall, loopStep, textInputStep, textToArrayStep, toUpperCaseStep } from './stepTemplates';

async function seed() {
  const skillId = 'd5d8611a-4892-49b1-891d-41bda012f57f';

  const textInput = textInputStep();
  const textToArray = textToArrayStep();
  const upperCase = toUpperCaseStep();
  const loop = loopStep();
  const llm = llmCall();

  // loop.config настройки
  loop.config = loop.config ?? {};
  loop.config.bodyStepId = upperCase.id;
  loop.config.resultVar = 'upperText';
  loop.config.itemVar = 'text';

  const steps = [textInput, textToArray, loop, upperCase, llm];

  const links = [
    // textInput → textToArray
    {
      id: uuidv4(),
      fromStepId: textInput.id,
      fromPort: 'text',
      toStepId: textToArray.id,
      toPort: 'text',
    },
    // textToArray → loop
    {
      id: uuidv4(),
      fromStepId: textToArray.id,
      fromPort: 'items',
      toStepId: loop.id,
      toPort: 'items',
    },
    // loop → upperCase
    {
      id: uuidv4(),
      fromStepId: loop.id,
      fromPort: 'item',
      toStepId: upperCase.id,
      toPort: 'text',
    },
    // loop.done → llm
    {
      id: uuidv4(),
      fromStepId: loop.id,
      fromPort: 'done',
      toStepId: llm.id,
      toPort: 'prompt',
    },
  ];

  const skill: Skill = {
    id: skillId,
    name: 'Навык с циклом и преобразованием',
    description: 'Текст → массив → итерации → регистр → LLM',
    startStepId: textInput.id,
    steps,
    links,
  };

  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(path.join('data', 'skills.json'), JSON.stringify([skill], null, 2));

  console.log('✅ Навык с циклом и преобразованием успешно записан');
}

seed().catch(err => {
  console.error('💥 Ошибка при инициализации данных:', err);
});
