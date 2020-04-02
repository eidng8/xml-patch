import Exception from './Exception';

export default class InvalidWhitespaceDirective extends Exception {
  protected tag: string = 'invalid-whitespace-directive';
}
