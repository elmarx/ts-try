import assert from "assert";
import {isError, tryF} from "../src";

describe("tryF", () => {

    describe("synchronous function", () => {
        it("returns the error thrown in a block", () => {
            const result = tryF(() => { throw new Error("dummy"); });

            assert(result instanceof Error);
        });

        it("returns the value if nothing is thrown in a block", () => {
            const result = tryF(() => 42);

            assert.strictEqual(result, 42);
        });
    });

    describe("async functions", () => {
        it("returns the error thrown in a block", async () => {
            const result = await tryF(() => Promise.reject<number>(new Error("dummy")));

            assert(result instanceof Error);
        });

        it("returns the value if nothing is thrown in a block", async () => {
            const result = await tryF(() => Promise.resolve(42));

            assert.strictEqual(result, 42);
        });
    });

    describe("promises", () => {
        it("returns the value resolved by a promise", async () => {
            const result = await tryF(Promise.resolve(42));

            assert.strictEqual(result, 42);
        });

        it("returns the reason why a promise has been rejected", async () => {
            const result = await tryF(Promise.reject<number>(new Error("dummy")));

            assert(result instanceof Error);
        });

    });
});

describe("isError()", () => {
    it("returns true for errors", () => assert(isError(new Error("dummy"))));

    it("returns false for something that's not an error", () => assert(!isError({})));
});
