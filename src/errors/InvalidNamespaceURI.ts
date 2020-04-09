import Exception from './Exception';

/**
 * The namespace URI value is not valid or the target document did not have this
 * declaration.
 */
export default class InvalidNamespaceURI extends Exception {
  protected tag: string = 'invalid-namespace-uri';
}
