import { Competition } from "../model/competition";
import { Sex } from "../model/runner";

const names = [
    'Gustavson', 'Hendrikson', 'Meyer', 'Marlovic', 'Torres', 'Huber',
    'Wüst', 'Zürcher', 'Berner', 'Rufer', 'Gutmann', 'Hübscher',
    'Schneller', 'Widemar', 'Rohrer', 'Kunz', 'Kinzle', 'Steinle',
    'Allemann', 'Röhrig', 'Meyer', 'Uhlmann', 'Garaio', 'Regazoni',
    'Maudet', 'Zoja', 'Scheller', 'Beckenbauer', 'Würsten'
];

const firstNames = {
    f: [
        'Anna', 'Alia', 'Ava', 'Berta', 'Benita', 'Carla', 'Cloe',
        'Dina', 'Daria', 'Eva', 'Esther', 'Elin', 'Franca', 'Franziska',
        'Gaby', 'Gerta', 'Gudrun', 'Hanna', 'Isabel', 'Ilda', 'Kim', 'Kathrin',
        'Lia', 'Lisa', 'Lena', 'Liselotte', 'Lara', 'Mia', 'Marla', 'Nele', 'Olga',
        'Pia', 'Rahel', 'Sara', 'Simona', 'Sina', 'Siri', 'Xenia', 'Zoé'
    ],
    m: [
        'Albert', 'Bruno', 'Chris', 'Dirk', 'David', 'Erwin', 'Francesco',
        'Fritz', 'Gianni', 'Gustav', 'Hans', 'Henrik', 'Ian', 'Jan', 'Karl', 'Lars',
        'Martin', 'Marco', 'Markus', 'Nico', 'Nino', 'Otto', 'Olav',
        'Patric', 'Pablo', 'Quentin', 'Ralf', 'Rudolf', 'Simon', 'Steve',
        'Thomas', 'Tim', 'Urs', 'Udo', 'Zan'
    ]
};

const cities = [
    'Aarberg', 'Bern', 'Burgdorf', 'Colombier', 'Diemerswil', 'Domdidier', 'Elm', 'Flawil', 'Fribourg',
    'Goldiwil', 'Heimiswil', 'Hergiswil', 'Illiswil', 'Konolfingen', 'Lausanne', 'Locarno',
    'Lugano', 'Martigny', 'Neuchatel', 'Orbe', 'Uzwil', 'Zürich'
];

const clubs = {
    prefixes: [ 'OLG', 'OLV', 'OL', 'CA' ],
    names: ['Bernstein', 'Erdmannlistein', 'Blanc', 'Piz Balü', 'Bartli und Most', 'Aare', 'Reuss' ]
};

function random(arr: string[]):string {
    const idx = Math.floor(Math.random() * (arr.length - 1));
    return arr[idx];
}

function randInt(from: number, to: number) {
    return from + Math.round(Math.random() * (to - from));
}

export function anonymize(competition: Competition) {
    competition.categories.forEach(category => {
        category.runners.forEach(runner => {
            if (!runner.sex || runner.sex === 'f') {
                runner.fullName = random(firstNames.f) + ' ' + random(names);
                runner.sex = Sex.female;
            } else {
                runner.fullName = random(firstNames.m) + ' ' + random(names);
                runner.sex = Sex.male;
            }

            runner.city = random(cities);
            runner.club = random(clubs.prefixes) + ' ' + random(clubs.names);
            runner.yearOfBirth = '' + randInt(1925, 2010);
            runner.nation = 'SUI';
        });
    });
    return competition;
};