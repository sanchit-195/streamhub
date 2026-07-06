class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        error= [],
        stack= ""
    ){
        super(message);
        this.data = null;
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.stack = stack;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};