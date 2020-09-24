/**
 * helper to test if an object is a Promise.
 *
 * Taken from https://github.com/ssnau/xkit/blob/master/util/is-promise.js,
 * as suggested by https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise
 * as is plausible considering https://promisesaplus.com/#point-53
 */
function isPromiseLike(obj: unknown): obj is PromiseLike<unknown> {
    return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof (obj as any).then === "function";
}

/**
 * Union type to wrap the original type T and allow Errors additionally
 */
export type Try<T, E extends Error = Error> = T | E;

/**
 * simple function to turn a promise of type T to type T | Error
 *
 * i.e.: catch the error and return it as the value
 */
function tryify<T, E extends Error = Error>(p: PromiseLike<T>): PromiseLike<Try<T, E>> {
    return p.then((x: T) => x, (err: E) => err);
}

/**
 * tryF wraps code that throws, and returns the result OR the error thrown
 *
 * it imitates the concept (though it's not a monad) of scala.util.Try — but try is a reserved keyword, so it's called tryF
 */
export function tryF<T, E extends Error = Error>(asyncBlock: () => PromiseLike<T>): PromiseLike<Try<T, E>>;
export function tryF<T, E extends Error = Error>(block: () => T): Try<T, E>;
export function tryF<T, E extends Error = Error>(promise: PromiseLike<T>): PromiseLike<Try<T, E>>;
export function tryF<T, E extends Error = Error>(input: PromiseLike<T> | (() => T | PromiseLike<T>)): Try<T, E> | PromiseLike<Try<T, E>> {
    // if the input is a simple promise, a simple try-ify is enough
    if (isPromiseLike(input)) {
        return tryify(input);
    }

    // ok, the input is a (sync or async) function, we need to execute it
    try {
        const v = input();

        // if block is an async function, try-ify the returned promise
        if (isPromiseLike(v)) {
            return tryify<T, E>(v);
        }

        // if block is sync, the result is in v, so just return
        return v;
    } catch (err) {
        // execution of block threw (and it's obviously sync), so return the error
        return err;
    }
}

export function isError(e: unknown): e is Error {
    return e instanceof Error;
}
