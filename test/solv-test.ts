import { readFileSync } from "fs";
import * as path from "path";
import * as chai from "chai";
import { SolvFormat } from "../src/formats/solv";

chai.should();

const csvPath = path.join(__dirname, "solv.csv");
const words = readFileSync(csvPath, "utf-8");

describe("solv", function () {
  let event: any;

  before(function () {
    event = new SolvFormat().parse(words);
  });

  describe("#parse()", function () {
    it("should return parsed event", function () {
      event.should.be.an("object");
    });

    it("should be named Anonymous Event", function () {
      event.name.should.be.an("string");
      event.name.should.equal("Anonymous Event");
    });

    it("should have a map name", function () {
      event.map.should.be.an("string");
      event.map.should.equal("Unknown Map");
    });

    it("should have an event date", function () {
      event.date.should.equal("");
    });

    it("should have a start time", function () {
      event.startTime.should.equal("");
    });

    it("should have 46 categories", function () {
      event.categories.length.should.equal(46);
    });

    describe("category K", function () {
      let category: any;

      before(function () {
        category = event.categories[0];
      });

      it("should have a category HE with 58 runners", function () {
        category.should.be.an("object");
        category.name.should.equal("HE");
        category.runners.length.should.equal(58);
      });

      it("should have a runner named Elin Widemar at rank 1", function () {
        const runner = category.runners[0];
        runner.fullName.should.equal("Elin Widemar");
        runner.rank.should.equal(1);
      });
    });
  });
});
