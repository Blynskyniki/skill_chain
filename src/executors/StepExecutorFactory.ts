import { IStepExecutor } from './IStepExecutor';
import { StepType } from '../types';

export class StepExecutorFactory {
  constructor(private executors: IStepExecutor[]) {}

  get(type: StepType): IStepExecutor {
    const executor = this.executors.find(e => e.supports(type));
    if (!executor) throw new Error(`No executor found for step type '${type}'`);
    return executor;
  }
}
