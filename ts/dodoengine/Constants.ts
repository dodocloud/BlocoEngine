const MSG_OBJECT_ADDED = "MSG_OBJECT_ADDED";
const MSG_OBJECT_REMOVED = "MSG_OBJECT_REMOVED";
const MSG_ALL = "MSG_ALL";  // special message for global subscribers, usually for debugging

const STATE_INACTIVE = 0;
const STATE_UPDATABLE = 2 ^ 0;
const STATE_DRAWABLE = 2 ^ 1;
const STATE_LISTENING = 2 ^ 2;

// unit size in px - all attributes are calculated against this size
var UNIT_SIZE = 1;
