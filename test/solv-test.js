var { parse } = require('../lib/solv');
var { readFileSync } = require('fs');
var should = require('chai').should();

require.extensions['.csv'] = function (module, filename) {
    module.exports = readFileSync(filename, 'cp1252');
};

var words = readFileSync('./test/solv.csv', 'utf-8');

var assert =  require('assert');

describe('solv', function() {
    var event;

    before(function() {
        event = parse(words);
    });

    describe('#parse()', function() {

        it('should return parsed event', function() {
            event.should.be.an('object');
        });
        
        it('should be named Anonymous Event', function() {
            event.name.should.be.an('string');
            event.name.should.equal('Anonymous Event');
        });

        it('should have a map name', function() {
            event.map.should.be.an('string');
            event.map.should.equal('Unknown Map');
        });

        it('should have an event date', function() {
            event.date.should.equal('');
        });

        it('should have a start time', function() {
            event.startTime.should.equal('');
        });

        it('should have 46 categories', function() {
            event.categories.length.should.equal(46);
        });

        describe('category K', function() {
            var category;

            before(function() {
                category = event.categories[0];
            });

            it('should have a category HE with 58 runners', function() {
                category.should.be.an('object');
                category.name.should.equal('HE');
                category.runners.length.should.equal(58);
            });

            it('should have a runner named Elin Widemar at rank 1', function() {
                var runner = category.runners[0];
                runner.fullName.should.equal('Elin Widemar');
                runner.rank.should.equal(1);
            });
        });
    });
});