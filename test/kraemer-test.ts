import { readFileSync } from "fs";
import * as path from "path";
import * as chai from "chai";
import { KraemerFormater } from "../src/formats/kraemer";
import { Split } from "../src/model/split";

chai.should();

const csvPath = path.join(__dirname, "kraemer.csv");
const words = readFileSync(csvPath, "utf-8");

describe("kraemer", function () {
  let event: any;

  before(function () {
    event = new KraemerFormater().parse(words);
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

    it("should have 3 categories", function () {
      event.categories.length.should.equal(3);
    });

    describe("category K", function () {
      let category: any;

      before(function () {
        category = event.categories.find((cat: any) => cat.name === "K");
      });

      it("should have a category K with 58 runners", function () {
        category.should.be.an("object");
        category.name.should.equal("K");
        category.runners.length.should.equal(38);
      });

      it("should have a runner named Lena Torres at rank 1", function () {
        const runner = category.runners[0];
        runner.fullName.should.equal("Lena Torres");
        runner.yearOfBirth.should.equal("1933");
        runner.city.should.equal("Flawil");
        runner.club.should.equal("OL Piz Balü");
      });

      it("Lena Torres should have a 14 splits", function () {
        const runner = category.runners[0];
        runner.splits.length.should.equal(14);
      });

      it("Lena Torres should have a 14 splits with the given split times", function () {
        const runner = category.runners[0];
        runner.splits.map((s: any) => s.time).join(",").should.equal("3:30,5:55,7:05,8:07,9:15,11:30,13:39,15:08,17:21,19:17,20:58,25:43,27:31,29:26");
      });
    });
  });
});
