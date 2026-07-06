class ApiResponse {
    constructor(statusCode, message = "Success", data, res) {
        this.res = res;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };