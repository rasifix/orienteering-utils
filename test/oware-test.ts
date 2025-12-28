import { readFileSync } from "fs";
import * as path from "path";
import * as chai from "chai";
import { OwareFormat } from "../src/formats/oware";

chai.should();

const csvPath = path.join(__dirname, "oware.csv");
const words = readFileSync(csvPath, "utf-8");

describe("oware", function () {
  let event: any;

  before(function () {
    event = new OwareFormat().parse(words);
  });

  describe("#parse()", function () {
    it("should return parsed event", function () {
      event.should.be.an("object");
    });

    it("should be named Dark Night Run", function () {
      event.name.should.be.an("string");
      event.name.should.equal("Dark Night Run");
    });

    it("should have a map name", function () {
      event.map.should.be.an("string");
      event.map.should.equal("Wicked Forest 1:10'000");
    });

    it("should have an event date", function () {
      event.date.should.equal("2018-11-16");
    });

    it("should have a start time", function () {
      event.startTime.should.equal("18:00");
    });

    it("should have 2 categories", function () {
      event.categories.length.should.equal(2);
    });

    describe("category K", function () {
      let category: any;

      before(function () {
        category = event.categories[0];
      });

      it("should have a category K with 64 runners", function () {
        category.should.be.an("object");
        category.name.should.equal("K");
        category.runners.length.should.equal(64);
      });

      it("should have a runner named Gustav Gustavson at rank 1", function () {
        const runner = category.runners[0];
        runner.fullName.should.equal("Gustav Gustavson");
        runner.rank.should.equal(1);
      });
    });

    describe("category L", function () {
      let category: any;

      before(function () {
        category = event.categories[1];
      });

      it("should have a category L with 33 runners", function () {
        category.should.be.an("object");
        category.name.should.equal("L");
        category.runners.length.should.equal(33);
      });
    });
  });
});
