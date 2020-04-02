import Exception from './Exception';

export default class InvalidDiffFormat extends Exception {
  protected tag: string = 'invalid-diff-format';
}
