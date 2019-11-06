function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("BOAT", "Boat");
define("CARGO", "Cargo");