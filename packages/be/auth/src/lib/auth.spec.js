"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var auth_js_1 = require("./auth.js");
describe('auth', function () {
    it('should work', function () {
        expect((0, auth_js_1.auth)()).toEqual('auth');
    });
});
