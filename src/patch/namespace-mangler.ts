/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { AttrImpl, ElementImpl, NodeImpl } from 'xmldom-ts';
import XmlWrapper from '../xml/xml-wrapper';
import { isAttribute, isElement } from '../utils/type-guards';
import Patch from './patch';
import { descend } from '..';

export default class NamespaceMangler {
  /**
   * The XML document.
   */
  protected xml?: XmlWrapper;

  /**
   * The patch document.
   */
  protected patch: Patch;

  /**
   * @param patch the XML document
   * @param xml the patch document
   */
  constructor(patch: Patch, xml?: XmlWrapper) {
    this.patch = patch;
    this.xml = xml;
  }

  /**
   * Sets the target XML document (not the patch).
   * @param xml the XML document
   */
  setTarget(xml: XmlWrapper) {
    this.xml = xml;
  }

  /**
   * Maps namespace of the given node to target document. If the given node is
   * an element, all its attributes will be mapped too. Also, all descendants
   * of the given node will be mapped.
   *
   * An `anchor` is needed because this method descends into all descendants.
   * Namespace lookup happens on the `anchor` and the `target` nodes.
   *
   * @param node a imported node that will be put to target, please note that
   * this node *may* not be in the patch document.
   * @param target a node in the target document.
   * @param anchor a node in the patch document, mostly likely the node being
   * processed currently.
   */
  mangle(node: NodeImpl, target: NodeImpl, anchor: NodeImpl): NodeImpl {
    this.mangleNode(node, target, anchor);
    descend(node, n => this.mangleNode(n, target, anchor));
    return node;
  }

  /**
   * Maps namespace of the given node to target document. If the given node is
   * an element, all its attributes will be mapped too.
   * Namespace lookup happens on the `anchor` and the `target` nodes.
   * @param node a node from patch document
   * @param target a node in the target document
   * @param anchor a node in the patch document, mostly likely the node being
   * processed currently.
   */
  mangleNode(node: NodeImpl | AttrImpl, target: NodeImpl, anchor: NodeImpl) {
    // namespaces can only attached to elements and attributes
    if (!isElement(node) && !isAttribute(node)) {
      // we are in the middle of importing nodes that can be all kinds of nodes,
      // don't throw exception here.
      return;
    }
    const [prefix, , targetPrefix, targetNS] = this.mapNamespace(
      (<ElementImpl>node).tagName || (<AttrImpl>node).name,
      target,
      anchor,
    );
    if (targetPrefix) {
      this.setPrefix(node, targetPrefix);
    } else if (targetNS) {
      this.setPrefix(node, prefix, targetNS);
    }
    this.mangleAttributes(node, target, anchor);
  }

  /**
   * Maps namespace of the given attribute to target document.
   * Namespace lookup happens on the `anchor` and the `target` nodes.
   * @param node a node from patch document
   * @param target a node in the target document
   * @param anchor a node in the patch document, mostly likely the node being
   * processed currently.
   */
  mangleAttributes(
    node: NodeImpl | AttrImpl,
    target: NodeImpl,
    anchor: NodeImpl,
  ) {
    if (isElement(node) && node.hasAttributes()) {
      node.attributes.forEach(a => this.mangleNode(a, target, anchor));
    }
  }

  /**
   * Map the given namespace to target document's namespaces.
   * @param name a qualified name from patch document
   * @param target a node in the target document
   * @param node a node from patch document
   * @param isAttr whether it's an attribute node
   */
  mapNamespace(
    name: string,
    target: NodeImpl,
    node: NodeImpl,
    isAttr?: boolean,
  ): string[] {
    // we may in the middle of add or replacing nodes, which may involve adding
    // new namespaces to target.
    // dont throw any exception here.
    const parts = name.split(':');
    if (parts.length < 2) {
      // RFC 4.2.3, last "For example" paragraph, last sentence:
      // unprefixed attributes don't inherit the default namespace declaration
      if (isElement(node) && node.namespaceURI && !isAttr) {
        const prefix = this.xml!.lookupPrefix(node.namespaceURI, target);
        return ['', name, prefix || '', node.namespaceURI];
      }
      return ['', name, '', ''];
    }
    const [prefix, local] = parts;
    const uri = this.patch.lookupNamespaceURI(prefix, node)!;
    const targetPrefix = this.xml!.lookupPrefix(uri);
    return [prefix, local, targetPrefix || '', uri];
  }

  /**
   * Sets the node prefix, and namespace URI if provided. Please note that the
   * namespace lookup list (`_nsMap`) is not changed.
   * @param node
   * @param prefix
   * @param ns
   */
  setPrefix(node: ElementImpl | AttrImpl, prefix: string, ns?: string): void {
    node.prefix = prefix;
    if (ns) {
      node.namespaceURI = ns;
    }
    const prop = isElement(node) ? 'tagName' : 'name';
    if (prefix) {
      node.nodeName = `${prefix}:${node.localName}`;
      node[prop] = `${prefix}:${node.localName}`;
    } else {
      node.nodeName = node.localName;
      node[prop] = node.localName;
    }
  }
}
