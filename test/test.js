var { parse } = require('../lib/oware');
var { readFileSync } = require('fs');
var should = require('chai').should();

require.extensions['.csv'] = function (module, filename) {
    module.exports = readFileSync(filename, 'cp1252');
};

var words = readFileSync('./test/oware.csv', 'utf-8');

var assert =  require('assert');

describe('oware', function() {
    var event;

    before(function() {
        event = parse(words);
    });

    describe('#parse()', function() {

        it('should return parsed event', function() {
            event.should.be.an('object');
        });
        
        it('should be named Dark Night Run', function() {
            event.name.should.be.an('string');
            event.name.should.equal('Dark Night Run');
        });

        it('should have a map name', function() {
            event.map.should.be.an('string');
            event.map.should.equal('Wicked Forest 1:10\'000');
        });

        it('should have an event date', function() {
            event.date.should.equal('2018-11-16');
        });

        it('should have a start time', function() {
            event.startTime.should.equal('18:00');
        });

        it('should have 2 categories', function() {
            event.categories.length.should.equal(2);
        });

        describe('category K', function() {
            var category;

            before(function() {
                category = event.categories[0];
            });

            it('should have a category K with 64 runners', function() {
                category.should.be.an('object');
                category.name.should.equal('K');
                category.runners.length.should.equal(64);
            });

            it('should have a runner named Gustav Gustavson at rank 1', function() {
                var runner = category.runners[0];
                runner.name.should.equal('Gustavson');
                runner.surname.should.equal('Gustav');
                runner.rank.should.equal(1);
            });
        });
    });
});