import Exception from './Exception';

/**
 * An entity reference was found but corresponding declaration could not be
 * located or resolved.
 */
export default class InvalidEntityDeclaration extends Exception {
  protected tag: string = 'invalid-entity-declaration';
}
