const names = [
    'Gustavson', 'Hendrikson', 'Meyer', 'Marlovic', 'Torres', 'Huber',
    'Wüst', 'Zürcher', 'Berner', 'Rufer', 'Gutmann', 'Hübscher',
    'Schneller', 'Widemar', 'Rohrer', 'Kunz', 'Kinzle', 'Steinle',
    'Allemann', 'Röhrig', 'Meyer', 'Uhlmann', 'Garaio', 'Regazoni',
    'Maudet', 'Zoja'
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
        'Fritz', 'Gianni', 'Gustav', 'Hans', 'Ian', 'Jan', 'Karl', 'Lars',
        'Martin', 'Marco', 'Markus', 'Nico', 'Nino', 'Otto', 'Olav',
        'Patric', 'Pablo', 'Quentin', 'Ralf', 'Rudolf', 'Simon', 'Steve',
        'Thomas', 'Tim', 'Urs', 'Udo'
    ]
};

const cities = [
    'Aarberg', 'Bern', 'Colombier', 'Diemerswil', 'Elm', 'Fribourg',
    'Goldiwil', 'Heimiswil', 'Illiswil', 'Konolfingen', 'Lausanne',
    'Lugano', 'Martigny', 'Neuchatel', 'Orbe', 'Zürich'
];

const clubs = {
    prefixes: [ 'OLG', 'OLV', 'OL', 'CA' ],
    names: ['Bernstein', 'Erdmannlistein', 'Blanc', 'Piz Balü', 'Bartli und Most', 'Aare', 'Reuss' ]
};

function random(arr) {
    if (arr.lenght === 0) {
        return null;
    }
    const idx = Math.floor(Math.random() * (arr.length - 1));
    return arr[idx];
}

function randInt(from, to) {
    return from + Math.round(Math.random() * (to - from));
}

module.exports.anonymize = function(event) {
    event.categories.forEach(category => {
        category.runners.forEach(runner => {
            runner.name = random(names);

            if (runner.sex === 'M' || runner.sex === 'm') {
                runner.firstName = random(firstNames.m);
                runner.sex = 'M';
            } else {
                runner.firstName = random(firstNames.f);
                runner.sex = 'F';
            }

            runner.fullName = runner.firstName + ' ' + runner.name;

            runner.city = random(cities);
            runner.club = random(clubs.prefixes) + ' ' + random(clubs.names);
            runner.yearOfBirth = randInt(1925, 2010);
            runner.nation = 'SUI';
            runner.ecard = Math.round(Math.random() * 1000000);
        });
    });
    return event;
};