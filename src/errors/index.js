
class Unauthorized extends Error {
    status = 401;
    name = "Unauthorized";
    constructor(message) {
        super(message);
    }
}

class BadRequest extends Error {
    statusCode = 400;
    name = "BadRequest";
    constructor(message) {
        super(message);
    }
}

class NotFound extends Error {
    status = 404;
    name = "NotFound";
    constructor(message) {
        super(message);
    }
}

export default { Unauthorized, BadRequest, NotFound };