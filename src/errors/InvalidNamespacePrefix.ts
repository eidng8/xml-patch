import Exception from './Exception';

export default class InvalidNamespacePrefix extends Exception {
  protected tag: string = 'invalid-namespace-prefix';
}
