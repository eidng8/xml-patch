import Exception from './Exception';

export default class InvalidAttributeValue extends Exception {
  protected tag: string = 'invalid-attribute-value';
}
