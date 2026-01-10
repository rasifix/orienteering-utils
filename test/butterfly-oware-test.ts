import { readFileSync } from "fs";
import * as path from "path";
import * as chai from "chai";
import { OwareFormat } from "../src/formats/oware";
import { parseRanking, Ranking } from "../src/utils/ranking";
import { parseTime } from "../src/time";

chai.should();

const csvPath = path.join(__dirname, "butterfly-oware.csv");
const words = readFileSync(csvPath, "utf-8");

describe("oware", function () {
  let event: any;
  let ranking: any

  before(function () {
    event = new OwareFormat().parse(words);
    ranking = parseRanking(event.categories[1].runners);
  });

  describe("#parse()", function () {
    it("should return parsed event", function () {
      event.should.be.an("object");
    });

    it("should be named Bern By Night 2018/ 2019 - Contest #3", function () {
      event.name.should.be.an("string");
      event.name.should.equal("Bern By Night 2018/ 2019 - Contest #3");
    });

    it("should have a map name", function () {
      event.map.should.be.an("string");
      event.map.should.equal("Aeschete 1:7'500");
    });

    it("should have an event date", function () {
      event.date.should.equal("2019-01-18");
    });

    it("should have a start time", function () {
      event.startTime.should.equal("18:00");
    });

    it("should have 2 categories", function () {
      event.categories.length.should.equal(2);
    });

    it("should have 4 courses", function () {
      ranking.courses.length.should.equal(4);
      ranking.courses[0].code.should.equal("St,31,33,34,35,36,39,34,37,38,39,40,41,44,46,47,48,49,50,52,54,55,49,53,51,54,49,45,43,42,38,36,Zi");
      ranking.courses[1].code.should.equal("St,31,33,34,37,38,39,34,35,36,39,40,41,44,46,47,48,49,50,52,54,55,49,53,51,54,49,45,43,42,38,36,Zi");
      ranking.courses[2].code.should.equal("St,31,33,34,37,38,39,34,35,36,39,40,41,44,46,47,48,49,53,51,54,49,50,52,54,55,49,45,43,42,38,36,Zi");
      ranking.courses[3].code.should.equal("St,31,33,34,35,36,39,34,37,38,39,40,41,44,46,47,48,49,53,51,54,49,50,52,54,55,49,45,43,42,38,36,Zi");
    });

    it("should assign the correct course to each runner", function () {
      ranking.runners[0].should.have.property("course", "LA");
    });

    it("weight should sum to 1", function () {
      ranking.runners.filter((runner: any) => parseTime(runner.time)).forEach((runner: any) => {
        runner.splits.reduce((sum: number, split: any) => sum + split.weight, 0).should.equal(1);
      });
    });

  });
});
