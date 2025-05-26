// stepStore.ts

import { v4 as uuidv4 } from 'uuid';
import { StepTemplate } from './types';

// Шаг: Ввод текста
export const textInputStep = (id = uuidv4()): StepTemplate => ({
  id,
  name: 'Ввод текста',
  type: 'code',
  inputs: [],
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
export const toUpperCaseStep = (id = uuidv4()): StepTemplate => ({
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
export const lengthCheckStep = (id = uuidv4()): StepTemplate => ({
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

// Шаг: API вызов
export const apiCallStep = (id = uuidv4()): StepTemplate => ({
  id,
  name: 'API вызов',
  type: 'api_call',
  inputs: [
    {
      name: 'payload',
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  ],
  outputs: [
    {
      name: 'result',
      type: 'object',
      schema: { type: 'object' },
    },
  ],
  config: {
    method: 'POST',
    url: 'https://api.example.com/search',
    headers: {
      Authorization: '',
    },
  },
  configSchema: {
    type: 'object',
    title: 'Настройка API вызова',
    properties: {
      url: { type: 'string', title: 'URL запроса' },
      method: { type: 'string', enum: ['GET', 'POST'], title: 'Метод' },
      headers: {
        type: 'object',
        title: 'Заголовки',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['url', 'method'],
  },
  code: {
    language: 'javascript',
    sourceCode: `// mock API call
return { result: { data: 'ответ' } };`,
  },
});

// Шаг: Условие (if)
export const conditionStep = (id = uuidv4()): StepTemplate => ({
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
    trueMessage: 'Истина',
    falseMessage: 'Ложь',
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

// Шаг: Цикл по массиву
export const loopStep = (id = uuidv4()): StepTemplate => ({
  id,
  name: 'Цикл по массиву',
  type: 'loop',
  inputs: [
    {
      name: 'items',
      type: 'array',
      schema: { type: 'array', items: { type: 'string' } },
    },
  ],
  outputs: [
    {
      name: 'looped',
      type: 'array',
      schema: { type: 'array', items: { type: 'string' } },
    },
  ],
  config: {
    suffix: '_обработано',
  },
  configSchema: {
    type: 'object',
    properties: {
      suffix: {
        type: 'string',
        title: 'Суффикс',
      },
    },
  },
  code: {
    language: 'javascript',
    sourceCode: `const processed = items.map(i => i + config.suffix); return { looped: processed };`,
  },
});

// Экспорт шаблонов
export const stepTemplates: Record<string, () => StepTemplate> = {
  textInput: textInputStep,
  toUpperCase: toUpperCaseStep,
  lengthCheck: lengthCheckStep,
  apiCall: apiCallStep,
  condition: conditionStep,
  loop: loopStep,
};
export const stepTemplatesArray = [
  textInputStep(),
  toUpperCaseStep(),
  lengthCheckStep(),
  apiCallStep(),
  conditionStep(),
  loopStep(),
];
