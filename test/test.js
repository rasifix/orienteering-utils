require('ts-node/register/transpile-only');

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe('all tests', function() {
    importTest('oware', './oware-test.ts');
    importTest('solv', './solv-test.ts');
    importTest('kraemer', './kraemer-test.ts');
    importTest('ranking', './ranking-test.ts');
    importTest('butterfly', './butterfly-oware-test.ts');
});