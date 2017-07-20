module.exports = function (str) {
    if (str && typeof str === "string") {
        return str.split(/\r\r|\n\n|\r\n\r\n/g);
    }
}
