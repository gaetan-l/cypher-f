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
  /**
   * Locks the Enum, preventing to add more values to it.
   */
  static lock() {
    if (this._lock === undefined) {
      this._lock = true;
      Object.freeze(this);
    }
    else {
      throw `Tried to lock ${this} with items ${this.items.map(function(item) {return item.value;})}, but class has already been locked and frozen.`;
    }
  }

  /**
   * Returns the array containig all the items of the Enum,
   * creates it when first called.
   */
  static get items() {
    if (this._items === undefined) {
      this._items = [];
      var thisEnum = this;
    }
    return this._items;
  }

  /**
   * Pushes a new item in the Enum. Must be called before
   * lock().
   * TODO: currently doesnt prevent from calling
   * this.items().push(newItem).
   *
   * @param  Enum  the new item to add, must be of Enum
   *               class, Enum must not be locked, and
   *               must not contain an item with the same
   *               value
   */
  static push(newItem) {
    while(this._pushLock) {}
    this._pushLock = true;
    if (!(newItem instanceof this)) {
      throw `Tried to push item ${newItem} of type ${newItem.constructor} to ${this}, type not accepted.`;
    }
    else if (this._lock) {
      throw `Tried to push item with value ${newItem.value} to ${this}, but class has already been initialized with items with values ${this.items.map(function(item) {return item.value;})} and locked and cannot accept new items.`;
    }
    else if (this.items.map(function(item) {return item.value;}).includes(newItem.value)) {
      throw `Tried to push item with value ${newItem.value} to ${this} but class already contains an item with this value.`;
    }
    else {
      this.items.push(newItem);
    }
    this._pushLock = false;
  }

  /**
   * Creates the new Enum item if all the conditions re-
   * quired by push() are met.
   * @see    push()
   *
   * @param  string  value  the value of the new item
   */
  constructor(value) {
    this._value = value;
    this.constructor.push(this);
  }

  /**
   * Returns the value of the item.
   *
   * @return  string  the value of the item
   */  
  get value() {
    return this._value;
  }

  /**
   * Returns the position of the item in the enum.
   *
   * @param  int  the position of the item in the enum
   */
  get index() {
    return this.constructor.items.indexOf(this);
  }

  /**
   * Returns the next item in the enum by looping through
   * the array of items.
   *
   * @return  Enum  the next item in the enum
   */
  get next() {
    return this.constructor.items[(this.index + 1) % this.constructor.items.length];
  }

   /**
   * Returns the previous item in the enum by looping
   * through the array of items.
   *
   * @return  Enum  the next item in the enum
   */
  get prev() {
    let unchecked = (this.index - 1) % this.constructor.items.length;
    return this.constructor.items[unchecked < 0 ? unchecked + this.constructor.items.length : unchecked];
  }
}