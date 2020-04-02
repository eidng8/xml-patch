import Exception from './Exception';

export default class UnsupportedIdFunction extends Exception {
  protected tag: string = 'unsupported-id-function';
}
