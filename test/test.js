function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe('all tests', function() {
    importTest('oware', './oware-test.js');
    importTest('solv', './solv-test.js');
});