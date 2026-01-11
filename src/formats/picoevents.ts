import { Format } from "../format";
import { Category } from "../model/category";
import { Competition } from "../model/competition";
import { Runner } from "../model/runner";
import { formatTime } from "../time";


function clean(value: string | undefined): string | undefined {
  if (value) {
    return value.startsWith('"') && value.endsWith('"')
      ? value.substring(1, value.length - 1)
      : value;
  }
  return value;
}

export class PicoeventsFormat implements Format {
  parse(text: string):Competition {
    // convert CSV to JSON
    const categories: { [key: string]: Category } = {};

    const lines = text.split(/\r?\n/);
    const firstLine = lines.splice(0, 1)[0];
    const eventHeader = firstLine.split(",");

    const result: Competition = {
      id: eventHeader[1],
      name: clean(eventHeader[2]),
      map: clean(eventHeader[7]),
      date: clean(eventHeader[3]),
      startTime: clean(eventHeader[4]),
      categories: [],
    };

    const header = lines.splice(0, 1)[0].split(",");

    const sortKeyIdx = header.indexOf("[SORTKEY]");
    const statusIdx = header.indexOf("[RESPERSIDX]");
    const startTimeIdx = header.indexOf("[STARTFULLPREC]");
    const noOfSplitsIdx = header.indexOf("[NOFSPLITS]");
    const termIdx = header.indexOf("[TERM]");
    const firstNameIdx = header.indexOf("[FIRSTNAME]");
    const familyNameIdx = header.indexOf("[FAMILYNAME]");
    const yobIdx = header.indexOf("[YOB]");
    const townIdx = header.indexOf("[TOWN]");
    const clubIdx = header.indexOf("[CLUB]");
    const runtimeNetIdx = header.indexOf("[RUNTIMENET]");

    lines.forEach((line, idx) => {
      const tokens = line.split(",");
      if (tokens.length < 50) {
        return;
      }

      const name = tokens[9];

      if (name.indexOf("TW") !== -1 || name.indexOf("TM") !== -1) {
        return;
      }

      let category = categories[name];
      if (!category) {
        category = {
          name: name,
          distance: 0,
          ascent: 0,
          controls: parseInt(tokens[noOfSplitsIdx]),
          runners: [],
        } as any;
        categories[name] = category;
        result.categories.push(category);
      }

      const status = tokens[statusIdx];
      console.log(`Parsing runner ${idx + 1}: ${tokens[firstNameIdx]} ${tokens[familyNameIdx]} with status ${status} in category ${name}`);
      if (status !== "5" && status !== "2") {
        return;
      }

      const startTime = parseInt(tokens[startTimeIdx]);
      const runner: Runner = {
        id: tokens[sortKeyIdx] || "0",
        category: name,
        fullName: clean(tokens[firstNameIdx]) + " " + clean(tokens[familyNameIdx]),
        yearOfBirth: tokens[yobIdx] || undefined,
        city: clean(tokens[townIdx]),
        club: clean(tokens[clubIdx]),
        time: formatTime(parseInt(tokens[runtimeNetIdx])),
        startTime: formatTime(startTime),
        splits: [],
      };

      for (let i = termIdx + 3; i < tokens.length - 2; i += 2) {
        const time = tokens[i + 1]
          ? formatTime(parseInt(tokens[i + 1]) - startTime)
          : "";
        const code = tokens[i] === "9999" ? "Zi" : tokens[i];
        runner.splits!.push({ code, time: time });
      }

      category.runners.push(runner);
    });

    return result;
  }

  serialize(event: Competition) {
    var result =
      `BasicData,${event.id},"${event.name}",${event.date},${event.startTime},,,"${event.map}",\n`;
    result += "EXTCLASS=[DATATYPE],[SORTKEY],[ACTITEM],[NOFITEMS],[POINTER],[POSSPLITS],[RUNORLEG],[CLASSSORT],[BASECLASS],[FULLCLASS],[SUBSTCLASS],[COURSE],[MULTIHEATNUM],[REGTIME],[ISCLIQUE],[FAMILYNAME],[FIRSTNAME],[YOB],[SEX],[SEXLOC],[ZIP],[TOWN],[REGION],[COUNTRY],[FEDNR],[CLUB],[CLUBID],[NATION],[NATIONCODE],[IOFID],[RANKING],[GROUPNAME],[GROUPCLUB],[FOREIGNKEY],[REFPERS],[REFHEAT],[REFGRP],[REFEXT],[CARDHASDATA],[CARDNUM],[CARDNUMORIG],[RFID],[STARTNUM],[CLASSSTA],[COMBINATION],[DATEH0],[TIMEPREC],[STARTTIMELIST],[STARTTIMEGATE],[STARTTIMELATE],[STARTFULLPREC],[FINISHFULLPREC],[STARTPRECADJ],[FINISHPRECADJ],[RUNTIMEEFF],[RUNTIMENET],[RANKNET],[BEHINDNET],[PENALTY],[CREDIT],[NEUTRAL],[POINTS],[TIMEUSERMOD],[CARDUSERMOD],[RESPERSIDX],[RESCARDIDX],[IOFRESSTATTEXT],[INFOALL],[INFOMAND],[NOTCLASSTEXT],[RANKTEXT],[RESULTTEXT],[BEHINDTEXT],[PENCRENEUTTEXT],[SCHEDULED],[STARTED],[FINISHED],[SLIADDTEXT],[RESADDTEXT],[RENMERGINFO],[LIVEOFFSET],[LIVEINVALID1],[LIVEINVALID2],[LIVEINVALID3],[LEGMASSSTART],[LEGMAXTIMELIMIT],[LEGMAXTIMENCLA],[RELAYSTARTTIME],[RELCUMRUNTIMEEFF],[RELCUMRUNTIMENET],[RELCUMRANKNET],[RELCUMBEHINDNET],[RELCUMRANKTEXT],[RELCUMRESULTTEXT],[RELCUMBEHINDTEXT],[RELCUMPERSRESIDX],[RELCUMIOFSTATTEXT],[RELCUMINFOALL],[RELCUMINFOMAND],[RELCUMNOTCLATEXT],[RELCUMMASTAFLAG],[RELCUMSTARTED],[RELCUMFINISHED],[RELCUMORDERRES],[RELCUMSPARE2],[RELCUMSPARE3],[EXCLUDED],[NEGRUNTIME],[CLASSOKNOTREADY],[RESULTINVALID],[DOPSTATOK],[SLIORDER],[SORTORDERRES],[SUBSECRUNTIMENET],[STARTTIMEEXT],[FINISHTIMEEXT],[RUNTIMENETFULLPREC],[IMPORTGROUPID],[IMPORTUSER],[HIDETIME],[PAID],[RESERVE8],[RESERVE7],[RESERVE6],[RESERVE5],[RESERVE4],[LASTUPDATE],[MISSLISTCODE],[EXTRALISTCODE],[EXTRALISTTIME],[RADIOLISTCODE],[NOFSPLITS],[NOFSPLITPARAMS],[SPLITTYPE],[SPLITSTATUS],[TERM]\n";

    // FIXME: implement serialization of runners

    return result;
  }

  check(text: string) {
    return text.startsWith("BasicData,");
  }
}
