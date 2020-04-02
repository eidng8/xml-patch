import Exception from './Exception';

export default class InvalidCharacterSet extends Exception {
  protected tag: string = 'invalid-character-set';
}
