import Exception from './Exception';

export default class InvalidNamespaceURI extends Exception {
  protected tag: string = 'invalid-namespace-uri';
}
