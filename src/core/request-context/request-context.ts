import { AsyncLocalStorage } from 'async_hooks';

export interface IRequestContextData {
  language: string;
}

const storage = new AsyncLocalStorage<IRequestContextData>();

export function setRequestContext(context: IRequestContextData) {
  storage.enterWith(context);
}

export function getRequestContext(): IRequestContextData | undefined {
  return storage.getStore();
}
