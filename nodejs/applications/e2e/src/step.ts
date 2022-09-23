export function step(msg: string, fn: Mocha.Func | Mocha.AsyncFunc) {
  if (fn == null) {
    return it(msg);
  } else if (fn.length === 0) {
    return it(msg, function () {
      return sync(this, fn);
    });
  } else {
    return it(msg, function (done) {
      return async(this, done, fn);
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function xstep(msg: string, fn: Mocha.Func | Mocha.AsyncFunc) {
  return it(msg, null);
}

function async(context: Mocha.Context, done: Mocha.Done, fn: Mocha.Func | Mocha.AsyncFunc) {
  context.test.body = fn.toString();

  const timeout = setTimeout(function () {
    markRemainingTestsAndSubSuitesAsPending(context.test);
  }, context.timeout());

  function onError() {
    markRemainingTestsAndSubSuitesAsPending(context.test);
    process.removeListener('uncaughtException', onError);
  }

  process.addListener('uncaughtException', onError);

  try {
    fn.call(context, function (err) {
      clearTimeout(timeout);

      if (err) {
        onError();
        done(err);
      } else {
        process.removeListener('uncaughtException', onError);
        done(null);
      }
    });
  } catch (ex) {
    clearTimeout(timeout);

    onError();
    throw ex;
  }
}

function markRemainingTestsAndSubSuitesAsPending(currentTest: Mocha.Runnable) {
  const anyCurrentTest = currentTest as any;
  if (anyCurrentTest._retries !== -1 && anyCurrentTest._currentRetry < anyCurrentTest._retries) {
    return;
  }

  const { suites, tests } = currentTest.parent;

  for (let index = tests.indexOf(currentTest as Mocha.Test) + 1; index < tests.length; index++) {
    const test = tests[index];
    test.pending = true;
  }

  for (let index = 0; index < suites.length; index++) {
    const suite = suites[index];
    suite.pending = true;
  }
}

function sync(context: Mocha.Context, fn: Mocha.Func | Mocha.AsyncFunc) {
  context.test.body = fn.toString();

  const timeout = setTimeout(function () {
    markRemainingTestsAndSubSuitesAsPending(context.test);
  }, context.timeout());

  try {
    const promise = fn.call(context);
    if (promise != null && promise.then != null && promise.catch != null) {
      return promise.catch(function (err) {
        clearTimeout(timeout);
        markRemainingTestsAndSubSuitesAsPending(context.test);
        throw err;
      });
    } else {
      clearTimeout(timeout);
      return promise;
    }
  } catch (ex) {
    clearTimeout(timeout);
    markRemainingTestsAndSubSuitesAsPending(context.test);
    throw ex;
  }
}
