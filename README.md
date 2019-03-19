# ts-try — wrapper for try/catch for functional programming in typescript

[![Greenkeeper badge](https://badges.greenkeeper.io/zauberpony/ts-try.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/zauberpony/ts-try.svg?branch=master)](https://travis-ci.org/zauberpony/ts-try)
[![npm version](https://badge.fury.io/js/ts-try.svg)](https://badge.fury.io/js/ts-try)


## What does it do?

`tryF()` is a simple wrapper for code possibly throwing exceptions, based on the idea of [scala.util.Try](https://www.scala-lang.org/api/current/scala/util/Try.html).

Given a function (that could throw), it returns either the result of the function, or the error thrown (see *examples* for details).

Same for async-function, i.e.: basically promises.

## Why?

Given the general idea of pure functions, every function should **return** a value, pure functions should not interrupt the execution by throwing an error.

Functional programming languages implement this by some specific type (different programming languages use 
different names, with sometimes different semantics, i.e. scala also has [Either](https://www.scala-lang.org/api/current/scala/util/Either.html)).

A very tangible advantage is, when using statically typed languages, the function-signature indicates that a function *could* fail. 
There's no way (in typescript) to indicate that a function might *throw* an error. At least not checked by the compiler.

Leveraging typescript's union-type it's easy to bring this concept to JavaScript, since functions may now e.g. return the 
original value *or* an error.

```typescript
function getDataFromApi(id: number): Response | Error { } 
```

the calling code now needs to check if the result is an instance of `Error` or the real result. But typescript forces you
to check this, so there's no way you can miss that.

## API

### `type Try<T, E extends Error = Error> = T | E`

A wrapper for types. If a function might fail, the return type may be `Try<T, E>`. `E` is optional, if you want to further
specify the type of the error.

Instead of 

```typescript
function getDataFromApi(id: number): Response | Error { }
``` 

one can write

```typescript
function getDataFromApi(id: number): Try<Response> { } 
```

or even

```typescript
function getDataFromApi(id: number): Try<Response, MyCustomError> { } 
```

Please be aware that no runtime error-type-checking happens.

### `function isError(o: unknown): o is Error`

trivial typeguard to dry up code a little bit, given a value `const myValue: Try<number> = get();`

```typescript    
if(myValue instanceof Error) { /* error handling */ }
```
     
one can also write

```typescript    
if(isError(myValue)) { /* error handling */ }
```


### `function function tryF<T>(input: PromiseLike<T> | (() => T | Promise<T>)): Try<T> | Promise<Try<T>>`

The actual wrapper. See examples.

## Examples

The test-file also shows all use-cases, but let me add some more context here.

### synchronous functions

This is what you'll want to use to wrap third-party code — for your own code you'll want to avoid `throw` completely 
(and use `return new Error()` with function-return-type `Try<T>`), thus you won't need `tryF` at all.

```typescript    
const myData: Try<any> = tryF(() => JSON.parse(input));

if(isError(myData)) {
    // no way to recover here, let the calling function know there's an error
    return myData;
}
```
    
    
### promises 

Combined with async/await, passing promises to `tryF` is rather neat. This example wraps [request-promise-native](https://www.npmjs.com/package/request-promise-native),
which rejects for non-2xx-status-codes (if `simple: true` is set — which is the default).  

```typescript
const result: Try<Response> = await tryF(rp("http://example.com"));

if(isError(result)) {
    // error-handling here, 
    
    return some-sane-default;
}

// use result here. Typescript "knows" it's a Response here
```
    
Let's break it down:

```typescript
const requestP: Promise<Response> = rp("http://example.com"); // this promise might be rejected
const resultP: Promise<Try<Response>> = tryF(rp("http://example.com")); // the resolved promise is now either a Response, or an Error 
const result: Try<Response> = await resultP; // "unwrap" the promise.
```

    
Compare this to the code without `Try<T>`, but using await, it's so ugly, it makes me sad:

```typescript
let response: Response; // uag, "let"!!
try {
    // awaiting a promise that rejects requires try/catch
    response = await rp("http://example.com");
} catch (err) {
    // error-handling here, 
        
    return some-sane-default;
}

// use result here
```

### async blocks

One can also wrap async blocks. I think you should not wrap giant lambdas in `tryF`, but refactor your code to just
wrap the necessary calls/promises in `tryF`. It's the very same reason you should narrow down try-blocks to the bare minimum. 
However:

```typescript
const result: Try<unkown> = tryF(async () => {
    const a = getA();
    const b = getB();
    
    // this could of course throw
    const data = JSON.parse(a);

    const body = await rp("http://example.com");
    
    return transform(body);
});    
```

## Alternatives

I didn't find a module on npmjs which does exactly what this does, but there are still alternatives.

### DIY

Of course it's also an option to do this manually. For promises it's basically:

```typescript
promise.then(x => x + x).catch(err => err);
```

for try-catch, you probably end up with almost the same wrapper-function. 

### fp-ts

[fp-ts](https://gcanti.github.io/fp-ts) emulates [Either](https://gcanti.github.io/fp-ts/Either.html) from 
[Scala](https://www.scala-lang.org/api/current/scala/util/Either.html). Either wraps values into objects. Thus it has
more convenient access (via `isLeft()` etc.), but involves runtime overhead. `tryF`/`Try<T>` is compile-time overhead only.

Besides that, `Try<T>` is fixed to errors, `Either` allows generic types for "left" (which is the "failure"-case by convention).
When programming scala, there is no `Try` is always better then `Either` or vice versa, it depends on the use case.

I also played around with `type Try<T> = Either<Error, T>`, but didn't like the result that much (for my code).  
