var { parse } = require('../lib/oware');
var { RankingBuilder } = require('../lib/ranking');
var { readFileSync } = require('fs');
var should = require('chai').should();

require.extensions['.csv'] = function (module, filename) {
    module.exports = readFileSync(filename, 'cp1252');
};

var words = readFileSync('./test/butterfly-oware.csv', 'utf-8');
var assert =  require('assert');

describe('builder', function() {
    var event;

    before(function() {
        event = parse(words);
    });

    describe('#parse()', function() {

        it('should return parsed event', function() {
            event.should.be.an('object');
        });

        it('should have two categories', function() {
            console.log(event.categories.length);
            event.categories.length.should.equal(2);
        });

        describe('parsed ranking', function() {
            describe('category L', function() {
                var builder;

                before(function() {
                    let category = event.categories.find(category => category.name === 'L');
                    builder = new RankingBuilder(category.runners);
                });

                it('should have category L with 4 courses', function() {
                    builder.courses.should.be.an('array');
                    builder.courses.length.should.equal(4);
                });

                it('should have course 0', function() {
                    builder.courses[0].code.should.equal('St,31,33,34,35,36,39,34,37,38,39,40,41,44,46,47,48,49,50,52,54,55,49,53,51,54,49,45,43,42,38,36,Zi');
                    builder.courses[0].runners.length.should.equal(8);
                    builder.courses[0].runners.should.eql([79, 81, 84, 92, 94, 95, 98, 101]);
                });

                it('should have course 1', function() {
                    builder.courses[1].code.should.equal('St,31,33,34,37,38,39,34,35,36,39,40,41,44,46,47,48,49,50,52,54,55,49,53,51,54,49,45,43,42,38,36,Zi');
                    builder.courses[1].runners.length.should.equal(11);
                    builder.courses[1].runners.should.eql([80, 83, 85, 87, 90, 102, 104, 105, 108, 109, 110]);
                });

                it('should have course 2', function() {
                    builder.courses[2].code.should.equal('St,31,33,34,37,38,39,34,35,36,39,40,41,44,46,47,48,49,53,51,54,49,50,52,54,55,49,45,43,42,38,36,Zi');
                    builder.courses[2].runners.length.should.equal(11);
                    builder.courses[2].runners.should.eql([82, 91, 96, 99, 100, 103, 106, 107, 114, 115, 116]);
                });

                it('should have course 3', function() {
                    builder.courses[3].code.should.equal('St,31,33,34,35,36,39,34,37,38,39,40,41,44,46,47,48,49,53,51,54,49,50,52,54,55,49,45,43,42,38,36,Zi');
                    builder.courses[3].runners.length.should.equal(8);
                    builder.courses[3].runners.should.eql([86, 88, 89, 93, 97, 111, 112, 113]);
                });

                it('should produce ranking', function() {
                    let ranking = builder.getRanking();                    
                });
            });

            describe('category K', function() {
                var builder;

                before(function() {
                    let category = event.categories.find(category => category.name === 'K');
                    builder = new RankingBuilder(category.runners);
                });

                it('should have category K with 2 courses', function() {
                   builder.courses.length.should.equal(2);
                });
                  
                it('should have course 0', function() {
                    builder.courses[0].code.should.equal('St,32,33,40,41,43,46,47,48,49,50,52,54,49,55,54,49,45,44,42,38,39,35,Zi');
                    builder.courses[0].runners.length.should.equal(40);
                    builder.courses[0].runners.should.eql([1, 6, 7, 9, 11, 13, 14, 16, 18, 19, 20, 21, 22, 23, 26, 29, 31, 32, 33, 36, 38, 41, 45, 46, 48, 49, 51, 55, 56, 62, 63, 66, 68, 69, 70, 72, 73, 74, 77, 78]);
                });

                it('should have course 1', function() {
                    builder.courses[1].code.should.equal('St,32,33,40,41,43,46,47,48,49,55,54,49,50,52,54,49,45,44,42,38,39,35,Zi');
                    builder.courses[1].runners.length.should.equal(38);
                    builder.courses[1].runners.should.eql([2, 3, 4, 5, 8, 10, 12, 15, 17, 24, 25, 27, 28, 30, 34, 35, 37, 39, 40, 42, 43, 44, 47, 50, 52, 53, 54, 57, 58, 59, 60, 61, 64, 65, 67, 71, 75, 76]);
                });       
    
            });
        });

    });
});
