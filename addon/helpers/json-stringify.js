import { helper } from '@ember/component/helper';

export default helper(function jsonStringify(params/*, hash*/) {
  if (!params || !params[0] || params[0] == undefined) {
    return "";
  }
  return JSON.stringify(params[0]);
});
