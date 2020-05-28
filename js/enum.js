`use strict`

/**
 * Class representing an enumeration of values.
 *
 * this.constructor is called within an instance of a child
 * class to return the Enum class.
 *
 * @link https://stackoverflow.com/questions/62041969/method-in-enum-type
 */
export default class Enum {
  constructor(value) {
    this._value = value;
  }

  get index() {
    return this.constructor.values.indexOf(this);
  }

  get next() {
    return this.constructor.values[(this.index + 1) % this.constructor.values.length];
  }

  get prev() {
    let unchecked = (this.index - 1) % this.constructor.values.length;
    return this.constructor.values[unchecked < 0 ? unchecked + this.constructor.values.length : unchecked];
  }
}