const { getJsonFromXMLFile } = require('../helpers/helper');

const TestResult = require('../models/TestResult');
const TestSuite = require('../models/TestSuite');

function getTestSuiteFromTest(rawTest) {
  const suite = new TestSuite();
  suite.name = rawTest['@_name'];
  suite.duration = rawTest['@_duration-ms'];
  const rawTestMethods = [];
  const rawClasses = rawTest.class;
  for (let i = 0; i < rawClasses.length; i++) {
    rawTestMethods.push(...rawClasses[i]['test-method'].filter(raw => !raw['@_is-config']));
  }
  suite.total = rawTestMethods.length;
  suite.passed = rawTestMethods.filter(test => test['@_status'] === 'PASS').length;
  suite.failed = rawTestMethods.filter(test => test['@_status'] === 'FAIL').length;
  return suite;
}

function getTestSuite(rawSuite) {
  const suite = new TestSuite();
  suite.name = rawSuite['@_name'];
  suite.duration = rawSuite['@_duration-ms'];
  const rawTests = rawSuite.test;
  const rawTestMethods = [];
  for (let i = 0; i < rawTests.length; i++) {
    const rawTest = rawTests[i];
    const rawClasses = rawTest.class;
    for (let j = 0; j < rawClasses.length; j++) {
      rawTestMethods.push(...rawClasses[j]['test-method'].filter(raw => !raw['@_is-config']));
    }
  }
  suite.total = rawTestMethods.length;
  suite.passed = rawTestMethods.filter(test => test['@_status'] === 'PASS').length;
  suite.failed = rawTestMethods.filter(test => test['@_status'] === 'FAIL').length;
  return suite;
}

function parse(options) {
  // TODO - loop through files
  const json = getJsonFromXMLFile(options.files[0]);
  const result = new TestResult();
  const results = json['testng-results'][0];
  result.failed = results['@_failed'];
  result.passed = results['@_passed'];
  result.total = results['@_total'];
  const ignored = results['@_ignored'];
  if (ignored) {
    result.total = result.total - ignored;
  }

  const suites = results.suite;
  const suitesWithTests = suites.filter(suite => suite.test);

  if (suitesWithTests.length > 1) {
    for (let i = 0; i < suitesWithTests.length; i++) {
      const _suite = getTestSuite(suitesWithTests[i]);
      result.suites.push(_suite);
      result.duration += _suite.duration;
      if (!result.name) {
        result.name = _suite.name;
      }
    }
    result.status = result.total === result.passed ? 'PASS' : 'FAIL';
  } else if (suitesWithTests.length === 1) {
    const suite = suitesWithTests[0];
    result.name = suite['@_name'];
    result.duration = suite['@_duration-ms'];
    const rawTests = suite.test;
    for (let i = 0; i < rawTests.length; i++) {
      result.suites.push(getTestSuiteFromTest(rawTests[i]));
    }
    result.status = result.total === result.passed ? 'PASS' : 'FAIL';
    
  } else {
    console.log("No suites with tests found");
  }
  return result;
}


module.exports = {
  parse
}