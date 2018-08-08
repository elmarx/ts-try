/**
 * helper to test if an object is a Promise.
 *
 * Taken from https://github.com/ssnau/xkit/blob/master/util/is-promise.js,
 * as suggested by https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise
 * as is plausible considering https://promisesaplus.com/#point-53
 */
function isPromise(obj: unknown): obj is Promise<any> {
    return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof (obj as any).then === "function";
}

/**
 * Union type to wrap the original type T and allow Errors additionally
 */
export type Try<T> = T | Error;

/**
 * simple function to turn a promise of type T to type T | Error
 *
 * i.e.: catch the error and return it as the value
 */
function tryify<T>(p: Promise<T>): Try<T> {
    return (p as any).then((x: T) => x, (err: Error) => err);
}

/**
 * tryF wraps code that throws, and returns the result OR the error thrown
 *
 * it imitates the concept (though it's not a monad) of scala.util.Try — but try is a reserved keyword, so it's called tryF
 */
export function tryF<T>(asyncBlock: () => Promise<T>): Promise<Try<T>>;
export function tryF<T>(block: () => T): Try<T>;
// tslint:disable-next-line:unified-signatures I want the name (in completion) to be promise, so I NOT unifying here is desired
export function tryF<T>(promise: PromiseLike<T>): Promise<Try<T>>;
export function tryF<T>(input: PromiseLike<T> | (() => T | Promise<T>)): Try<T> | Promise<Try<T>> {
    // if the input is a simple promise, a simple tryify is enougf
    if (isPromise(input)) {
        return tryify(input);
    }

    // ok, the input is a (sync or async) function, we need to execute it
    const block: () => T | Promise<T> = input as () => T | Promise<T>;

    try {
        const v = block();

        // if block is an async function, tryify the returned promise
        if (isPromise(v)) {
            return tryify(v);
        }

        // if block is sync, the result is in v, so just return
        return v;
    } catch (err) {
        // execution of block throwed (and it's obviously sync), so return the error
        return err;
    }
}

export function isError(e: unknown): e is Error {
    return e instanceof Error;
}
