import Exception from './Exception';

export default class InvalidPrologOperation extends Exception {
  protected tag: string = 'invalid-xml-prolog-operation';
}
