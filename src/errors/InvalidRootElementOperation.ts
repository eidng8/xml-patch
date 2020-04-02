import Exception from './Exception';

export default class InvalidRootElementOperation extends Exception {
  protected tag: string = 'invalid-root-element-operation';
}
