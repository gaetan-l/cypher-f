`use strict`

/**
 * Class representing an enumeration of values.
 *
 * this.constructor is called within an instance of a child
 * class to return the Enum class.
 *
 * @link https://stackoverflow.com/questions/62041969/method-in-enum-type
 */
export class Enum {
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

  toString() {
    return this.value;
  }

  /**
   * Returns the Enum corresponding to the specified string.
   *
   * @param   Object  value  of the enum
   * @return  Enum           the corresponding Enum
   */  
  static from(value) {
    const index = this.items.map(item => item.value.toString()).indexOf(value.toString());
    if (index > -1) {
      return this.items[index];
    }
    else {
      throw `Tried to find ${this.name} with value=${value} but doesn't exist, existing values are ${this.items.map(item => item.value.toString())}.`;
    }
  }
}

/**
 * A specific enum with a pair of members instead of just
 * one.
 */
export class EnumPair extends Enum {
  constructor(member1, member2) {
    super([member1, member2]);
    this._member1 = member1;
    this._member2 = member2;
  }

  get member1() {return this._member1;}
  get member2() {return this._member2;}

  /**
   * Returns the EnumPair corresponding to the specified mem-
   * bers.
   *
   * @param   Object   member1  of the pair
   * @param   Object   member2  of the pair
   * @return  EnumPair          the EnumPair correspon-
   *                            ding to these members
   */  
  static from(member1, member2) {
    const index = this.items.map(item => [item.member1.toString(), item.member2.toString()].toString()).indexOf([member1.toString(), member2.toString()].toString());
    if (index > -1) {
      return this.items[index];
    }
    else {
      throw `Tried to find ${this.name} with member1=${member1} and member2=${member2} but doesn't exist, existing values are ${this.items.map(item => `${item.member1.toString()}.${item.member2.toString()}`)}.`;
    }
  }
}