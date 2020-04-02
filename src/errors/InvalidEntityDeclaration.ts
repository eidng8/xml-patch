import Exception from './Exception';

export default class InvalidEntityDeclaration extends Exception {
  protected tag: string = 'invalid-entity-declaration';
}
