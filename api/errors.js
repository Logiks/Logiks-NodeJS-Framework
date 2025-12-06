class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

class NotAcceptableError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotAcceptableError";
    this.statusCode = 406;
  }
}

module.exports = {
  UnauthorizedError,
  NotAcceptableError,
};
