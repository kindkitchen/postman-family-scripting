'use strict';

function deep_merge(...objects) {
  const isObject = (obj) => obj && typeof obj === "object";
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];
      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = deep_merge(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });
    return prev;
  }, {});
}

function get_ctx() {
  const detection = detect_global_ctx();
  let ctx;
  if (detection.bruno) {
    detection.api;
    ctx = {
      environment: {
        get: (name) => bru.getEnvVar(name),
        get name() {
          return bru.getEnvName();
        },
        set: (name, value, type) => {
          if (type) {
            console.warn(
              "When ctx is bruno (not postman) the <type> is ignored..."
            );
          }
          bru.setEnvVar(name, value);
        }
      },
      collectionVariables: {
        get: (name) => bru.getCollectionVar(name),
        set: (name, value, type) => {
          console.warn(
            "In bruno (not postman) collection-level variables are readonly - so this will be set only to <vars> level (runtime only scope)"
          );
          if (type) {
            console.warn(
              "When ctx is bruno (not postman) the <type> is ignored..."
            );
          }
          bru.setVar(name, value);
        }
      },
      globals: {
        get: (name) => bru.getGlobalEnvVar(name),
        set: (name, value, type) => {
          if (type) {
            console.warn(
              "When ctx is bruno (not postman) the <type> is ignored..."
            );
          }
          bru.setGlobalEnvVar(name, value);
        }
      },
      get expect() {
        const _expect = Object.assign(() => {
          throw new Error("<expect> in bruno is not implemented yet");
        }, {
          get fail() {
            throw new Error("<expect.fail> in bruno is not implemented yet");
          }
        });
        return _expect;
      },
      get info() {
        throw new Error("In bruno <info> is not implemented yet");
      },
      request: {
        get body() {
          return req.getBody();
        },
        get name() {
          return req.getName();
        }
      },
      response: {
        get code() {
          return res.getStatus();
        },
        get body() {
          return res.getBody();
        }
      },
      test(...args) {
        test(...args);
      }
    };
  } else if (detection.postman) {
    ctx = detection.api;
  } else {
    throw "impossible";
  }
  return ctx;
}
function detect_global_ctx() {
  const variants = {
    pm: typeof pm,
    bru: typeof bru
  };
  const [actual, ...unexpected] = Object.entries(variants).filter(([k, v]) => v !== "undefined").map(([k]) => k);
  if (!actual) {
    throw new Error(
      "Unable to detect global ctx. (like pm for postman or bru for bruno etc.)"
    );
  } else if (unexpected.length) {
    throw new Error(
      "Somehow (impossible) more then one global ctx is detected"
    );
  }
  if (actual === "pm") {
    return {
      postman: true,
      bruno: false,
      api: pm
    };
  } else if (actual === "bru") {
    return {
      postman: false,
      bruno: true,
      api: bru
    };
  } else {
    throw new Error("Somehow impossible code is reached");
  }
}

function mapping(mapping, source, destination, prefix = "") {
  if (!mapping) return;
  Object.entries(mapping).forEach(([k, mayBePath]) => {
    const last = mayBePath.pop();
    const path = mayBePath;
    if (!last) {
      return;
    }
    const options = {
      type: "string",
      strategy: "replace",
      magic: null
    };
    if (typeof last === "string") {
      path.push(last);
    } else {
      last.type && (options.type = last.type);
      last.strategy && (options.strategy = last.strategy);
      last.magic && (options.magic = last.magic);
    }
    let value = path.reduce((acc, p) => acc[p], source);
    if (options.magic) {
      try {
        const transform = eval(options.magic);
        value = transform(value);
      } catch {
        console.info("PROBLEM: unable to make magic transformation for value");
      }
    }
    const key = prefix + k;
    const ctx = get_ctx();
    const prev = ctx[destination].get(key);
    if (prev && options.strategy === "propose") {
      value = prev;
      console.info(
        "The old value will be used. New will be ignored. Becase of <propose> strategy."
      );
    } else if (options.strategy === "replace" || /// this is the exactly strategy that will be used for all another inline or-like conditions
    !prev || /// nothing to do with strategies
    options.type !== typeof prev && /// for types mismatch between prev and new values we use default <replace> strategy
    options.type === "array" && !Array.isArray(prev) || !["object", "array"].includes(options.type)) ; else {
      if (options.strategy === "merge") {
        value = Array.isArray(value) ? [...prev, ...value] : { ...prev, ...value };
      } else if (options.strategy === "deep-merge") {
        value = deep_merge(prev, value);
      } else {
        throw new Error(
          "MAGIC_ERROR: not exhaustive condition pipe was used to check <strategy>"
        );
      }
    }
    console.info(
      `Set ${destination}.${prefix + k} = ${value} (as ${options.type} data-type)`
    );
    pm[destination].set(
      key,
      value,
      options.type
    );
  });
}

function after_response() {
  const {
    name = pm.request.name,
    description
  } = magic;
  name && console.info(name);
  pm.test(name, () => {
    const {
      res_codes = [200, 201, 202, 203, 204],
      res_jbody_to_env,
      res_jbody_to_col,
      res_jbody_to_globals,
      req_jbody_to_env,
      req_jbody_to_col,
      req_jbody_to_globals,
      req_fbody_to_env,
      req_fbody_to_globals,
      req_fbody_to_col,
      raw_json_to_env,
      raw_json_to_col,
      raw_json_to_globals,
      prefix
    } = magic;
    const actual_res_code = pm.response.code || pm.response.transport.http?.statusCode;
    if (!actual_res_code) {
      console.warn("Unable to get res status code... Please open the issue");
    } else if (!res_codes.includes(actual_res_code)) {
      console.warn("Response code is not declared in <magic.res_codes>");
      pm.expect(res_codes).includes(actual_res_code);
      return;
    }
    let jData = {};
    try {
      jData = pm.response.json();
    } catch (err) {
      jData = pm.response;
    }
    const rawReqBody = JSON.parse(pm.request.body?.raw || "{}");
    let fData = {};
    try {
      fData = pm.request.body.formdata.toObject();
    } catch {
    }
    const raw_mapping = (obj, scope) => Object.entries(obj).forEach(([k, v]) => pm[scope].set(k, v));
    raw_json_to_env && raw_mapping(raw_json_to_env, "environment");
    raw_json_to_col && raw_mapping(raw_json_to_col, "collectionVariables");
    raw_json_to_globals && raw_mapping(raw_json_to_globals, "globals");
    mapping(res_jbody_to_env, jData, "environment", prefix);
    mapping(res_jbody_to_col, jData, "collectionVariables", prefix);
    mapping(res_jbody_to_globals, jData, "globals", prefix);
    mapping(req_jbody_to_env, rawReqBody, "environment", prefix);
    mapping(req_jbody_to_col, rawReqBody, "collectionVariables", prefix);
    mapping(req_jbody_to_globals, rawReqBody, "globals", prefix);
    mapping(req_fbody_to_env, fData, "environment", prefix);
    mapping(req_fbody_to_col, fData, "collectionVariables", prefix);
    mapping(req_fbody_to_globals, fData, "globals", prefix);
  });
}

after_response();
