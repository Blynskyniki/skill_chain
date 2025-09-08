import { v4 as uuidv4 } from 'uuid';
import { SkillStep } from './types';

// Шаг: Ввод текста
export const textInputStep = (id = uuidv4()): SkillStep => ({
  id,
  name: 'Ввод текста',
  type: 'code',
  inputs: [
    {
      name: 'text',
      type: 'string',
      schema: { type: 'string', title: 'Введённый текст' },
    },
  ],
  outputs: [
    {
      name: 'text',
      type: 'string',
      schema: { type: 'string', title: 'Введённый текст' },
    },
  ],
  config: {
    defaultText: 'Пример',
  },
  configSchema: {
    type: 'object',
    properties: {
      defaultText: {
        type: 'string',
        title: 'Текст по умолчанию',
      },
    },
  },
  code: {
    language: 'javascript',
    sourceCode: `return { text: config.defaultText };`,
  },
});

// Шаг: Преобразование в верхний регистр
export const toUpperCaseStep = (id = uuidv4()): SkillStep => ({
  id,
  name: 'К верхнему регистру',
  type: 'code',
  inputs: [
    {
      name: 'text',
      type: 'string',
      schema: { type: 'string' },
    },
  ],
  outputs: [
    {
      name: 'upperText',
      type: 'string',
      schema: { type: 'string' },
    },
  ],
  config: {},
  configSchema: {
    type: 'object',
    properties: {},
  },
  code: {
    language: 'javascript',
    sourceCode: `return { upperText: text.toUpperCase() };`,
  },
});

// Шаг: Проверка длины строки
export const lengthCheckStep = (id = uuidv4()): SkillStep => ({
  id,
  name: 'Проверка длины > N',
  type: 'code',
  inputs: [
    {
      name: 'text',
      type: 'string',
      schema: { type: 'string' },
    },
  ],
  outputs: [
    {
      name: 'isLong',
      type: 'boolean',
      schema: { type: 'boolean' },
    },
  ],
  config: {
    minLength: 5,
  },
  configSchema: {
    type: 'object',
    properties: {
      minLength: {
        type: 'number',
        title: 'Минимальная длина',
      },
    },
  },
  code: {
    language: 'javascript',
    sourceCode: `return { isLong: text.length > config.minLength };`,
  },
});

// Шаг: Условие (if)
export const conditionStep = (id = uuidv4()): SkillStep => ({
  id,
  name: 'Условие (if)',
  type: 'condition',
  inputs: [
    {
      name: 'flag',
      type: 'boolean',
      schema: { type: 'boolean' },
    },
  ],
  outputs: [
    { name: 'onTrue', type: 'string', schema: { type: 'string' } },
    { name: 'onFalse', type: 'string', schema: { type: 'string' } },
  ],
  config: {
    trueMessage: 'true',
    falseMessage: 'false',
  },
  configSchema: {
    type: 'object',
    properties: {
      trueMessage: { type: 'string', title: 'Сообщение при истине' },
      falseMessage: { type: 'string', title: 'Сообщение при лжи' },
    },
  },
  code: {
    language: 'javascript',
    sourceCode: `return flag ? { onTrue: config.trueMessage } : { onFalse: config.falseMessage };`,
  },
});

export const textToArrayStep = (id = uuidv4()): SkillStep => ({
  id,
  name: 'Текст → Массив',
  type: 'code',
  inputs: [
    {
      name: 'text',
      type: 'string',
      schema: { type: 'string' },
    },
  ],
  outputs: [
    {
      name: 'items',
      type: 'array',
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  ],
  config: {},
  code: {
    language: 'javascript',
    sourceCode: `return { items: [text] };`,
  },
});

// Шаг: Цикл по массиву
export const loopStep = (id = uuidv4()): SkillStep => ({
  id,
  name: 'Цикл по массиву (итерации через шаг)',
  type: 'loop',
  inputs: [
    {
      name: 'items',
      type: 'array',
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  ],
  outputs: [
    {
      name: 'item',
      type: 'array', // триггер следующего шага
    },
    {
      name: 'done',
      type: 'array',
      schema: {
        type: 'array',
        items: {},
      },
    },
  ],
  config: {
    itemVar: 'item',
    resultVar: 'result',
    bodyStepId: '', // будет подставляться в SkillEditor
  },
  configSchema: {
    type: 'object',
    properties: {
      itemVar: {
        type: 'string',
        title: 'Имя переменной для итерации',
        default: 'item',
      },
      resultVar: {
        type: 'string',
        title: 'Ключ для сбора результата',
        default: 'result',
      },
      bodyStepId: {
        type: 'string',
        title: 'Шаг, вызываемый на каждой итерации',
      },
    },
    required: ['itemVar', 'resultVar', 'bodyStepId'],
  },
});

// Шаг: llm
export const llmCall = (id = uuidv4()): SkillStep => {
  return {
    id,
    name: 'LLM вызов',
    type: 'code',
    description: 'Отправляет текст в LLM и возвращает ответ',
    inputs: [
      {
        name: 'prompt',
        type: 'string',
        schema: {
          type: 'string',
          title: 'Промпт',
        },
      },
    ],
    outputs: [
      {
        name: 'completion',
        type: 'string',
        schema: {
          type: 'string',
          title: 'Ответ модели',
        },
      },
    ],
    config: {
      apiKey: 'sk-to8ADu5fQYxpAd_BOcshlOCeuXHlWVTVGkCc_OzjdIT3BlbkFJKP-xTU231BP1-2N5fWGnl5xT4EM6XPr6if-VKpUL8A',
      model: 'gpt-3.5-turbo',
    },
    configSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          title: 'API ключ OpenAI',
        },
        model: {
          type: 'string',
          title: 'ID модели',
        },
      },
      required: ['apiKey', 'model'],
    },
    code: {
      language: 'javascript',
      sourceCode:
        "const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST',  headers: { 'Authorization': 'Bearer ' + config.apiKey,  'Content-Type': 'application/json'  }, body: JSON.stringify({    model: config.model,  messages: [{ role: 'user', content: prompt }]})});const data = await response.json();console.log('data',data) ;if (data?.error?.message){throw new Error(data?.error?.message)} return { completion: data.choices?.[0].message.content ||'qq' };".trim(),
    },
  };
};

export const SkillSteps: Record<string, () => SkillStep> = {
  textInput: textInputStep,
  toUpperCase: toUpperCaseStep,
  lengthCheck: lengthCheckStep,
  condition: conditionStep,
  loop: loopStep,
  llmCall: llmCall,
  textToArrayStep: textToArrayStep,
};
export const SkillStepsArray = [
  textInputStep(),
  toUpperCaseStep(),
  lengthCheckStep(),
  conditionStep(),
  loopStep(),
  llmCall(),
  textToArrayStep(),
];
