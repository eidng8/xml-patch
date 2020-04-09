import Exception from './Exception';

/**
 * Patch failure related to XML prolog nodes.
 */
export default class InvalidPrologOperation extends Exception {
  protected tag: string = 'invalid-xml-prolog-operation';
}
