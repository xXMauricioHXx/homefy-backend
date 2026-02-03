const { CodedError } = require("../../shared/coded-error");

class NoCreditsAvailableException extends CodedError {
  constructor(message) {
    super("NO_CREDITS_AVAILABLE", message);
  }
}

module.exports = {
  NoCreditsAvailableException,
};
