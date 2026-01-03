import { expect } from "chai";
import { readFileSync } from "fs";
import * as path from "path";
import { OwareFormat } from "../src/formats/oware";
import { parseRanking } from "../src/utils/ranking";

function loadEvent() {
  const filePath = path.join(__dirname, "oware.csv");
  const raw = readFileSync(filePath, "utf-8");
  return new OwareFormat().parse(raw);
}

describe("parseRanking()", () => {
  let category: any;

  before(() => {
    const event = loadEvent();
    category = event.categories.find((cat: any) => cat.name === "L");

    if (!category) {
      throw new Error("Test data does not contain category L");
    }
  });

  it("should process category L without throwing", () => {
    const build = () => parseRanking(category.runners);
    build();
  });

  it("should find all the legs", () => {
    const ranking = parseRanking(category.runners);
    expect(ranking.legs.map((leg) => leg.code)).to.have.all.members([
      'St-33', '33-34', '34-48', '48-36', '36-35', '35-47',
      '47-34', '34-35', '35-46', '46-37', '37-38', '38-39',
      '39-40', '40-41', '41-45', '45-42', '42-31', '31-32',
      '32-45', '45-44', '44-42', '42-43', '43-Zi'
    ]);
  });

  it("should assign correct leg times to a sample runner", () => {
    const ranking = parseRanking(category.runners);
    const runner = ranking.runners[2];
    expect(runner.fullName).to.equal("Steve Torres");
    expect(runner.rank).to.equal(3);
    expect(runner.time).to.equal("48:00");

    expect(runner.splits[0].code).to.equal("33");
    expect(runner.splits[0].time).to.equal(617);
    expect(runner.splits[0].leg.behind).to.equal(135);
    expect(runner.splits[0].leg.rank).to.equal(16);

    expect(ranking.legs.reduce((acc, leg) => acc + leg.weight!, 0)).to.equal(1.0, "Total leg weights should equal 1.0");
  });
});
