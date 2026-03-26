export function get_ctx() {
  const detection = detect_global_ctx();
  let ctx: typeof pm;

  if (detection.bruno) {
    const api = detection.api as typeof bru;
    ctx = {
      environment: {
        get: (name) => bru.getEnvVar(name),
        get name() {
          return bru.getEnvName();
        },
        set: (name, value, type) => {
          if (type) {
            console.warn(
              "When ctx is bruno (not postman) the <type> is ignored...",
            );
          }
          bru.setEnvVar(name, value);
        },
      },
      collectionVariables: {
        get: (name) => bru.getCollectionVar(name),
        set: (name, value, type) => {
          console.warn(
            "In bruno (not postman) collection-level variables are readonly - so this will be set only to <vars> level (runtime only scope)",
          );
          if (type) {
            console.warn(
              "When ctx is bruno (not postman) the <type> is ignored...",
            );
          }
          bru.setVar(name, value);
        },
      },
      globals: {
        get: (name) => bru.getGlobalEnvVar(name),
        set: (name, value, type) => {
          if (type) {
            console.warn(
              "When ctx is bruno (not postman) the <type> is ignored...",
            );
          }
          bru.setGlobalEnvVar(name, value);
        },
      },
      get expect() {
        const _expect = Object
          .assign(() => {
            throw new Error("<expect> in bruno is not implemented yet");
          }, {
            get fail() {
              throw new Error("<expect.fail> in bruno is not implemented yet");
            },
          } as any);

        return _expect;
      },
      get info() {
        throw new Error("In bruno <info> is not implemented yet");
        return "impossible" as any;
      },
      request: {
        get body() {
          return req.getBody();
        },
        get name() {
          return req.getName();
        },
      },
      response: {
        get code() {
          return res.getStatus();
        },
        get body() {
          return res.getBody();
        },
      } as any,
      test(...args: any[]) {
        test(...args);
      },
    };
  } else if (detection.postman) {
    ctx = detection.api as typeof pm;
  } else {
    throw "impossible";
  }

  return ctx;
}

function detect_global_ctx() {
  const variants = {
    pm: typeof pm,
    bru: typeof bru,
  };

  const [actual, ...unexpected] = Object
    .entries(variants)
    .filter(([k, v]) => v !== "undefined")
    .map(([k]) => k) as [keyof typeof variants, unknown[]];

  if (!actual) {
    throw new Error(
      "Unable to detect global ctx. (like pm for postman or bru for bruno etc.)",
    );
  } else if (unexpected.length) {
    throw new Error(
      "Somehow (impossible) more then one global ctx is detected",
    );
  }

  if (actual === "pm") {
    return {
      postman: true,
      bruno: false,
      api: pm,
    };
  } else if (actual === "bru") {
    return {
      postman: false,
      bruno: true,
      api: bru,
    };
  } else {
    throw new Error("Somehow impossible code is reached");
  }
}
