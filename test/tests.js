var assert = require('assert'),
    santa = require('../routes/index'),
    Solver = require('../lib/graphSolver').Solver,
    _ = require('underscore');

exports.testFiltersValid = function (test) {
    var params = {
            name1: 'RAHOOL',
            email1: 'HatesGuardians@TheTower.com',
            name2: 'Sepkis Prime',
            email2: 'machine.god40@TheDarkness.org'
        },
        valid = santa.getValidParams(params);
    test.equal(valid['name1'], 'RAHOOL');
    test.equal(valid['email1'], 'HatesGuardians@TheTower.com');
    test.equal(valid['name2'], 'Sepkis Prime');
    test.equal(valid['email2'], 'machine.god40@TheDarkness.org');

    test.done();
};

exports.testFiltersValidWithPartial = function (test) {
    var params = {
            name1: 'RAHOOL',
            email1: 'HatesGuardians@TheTower.com',
            name2: 'Sepkis Prime',
            email2: 'machine.god40@TheDarkness.org',
            email3: 'machine.god40@TheDarkness.org',
            email4: 'machine.god40@TheDarkness.org'
        },
        valid = santa.getValidParams(params);
    test.equal(valid['name1'], 'RAHOOL');
    test.equal(valid['email1'], 'HatesGuardians@TheTower.com');
    test.equal(valid['name2'], 'Sepkis Prime');
    test.equal(valid['email2'], 'machine.god40@TheDarkness.org');
    test.ok(_.has(valid, 'email3'));
    test.ok(_.has(valid, 'email4'));

    test.done();
};

exports.testFiltersValidWithInvalid = function (test) {
    var params = {
            name1: 'RAHOOL',
            email1: 'HatesGuardians@TheTower.com',
            name2: 'Sepkis Prime',
            email2: 'machine.god40@TheDarkness.org',
            name3: 'should be there',
            someOtherParam3: 'should not be there'
        },
        valid = santa.getValidParams(params);
    test.equal(valid['name1'], 'RAHOOL');
    test.equal(valid['email1'], 'HatesGuardians@TheTower.com');
    test.equal(valid['name2'], 'Sepkis Prime');
    test.equal(valid['email2'], 'machine.god40@TheDarkness.org');
    test.ok(_.has(valid, 'name3'));
    test.ok(!_.has(valid, 'someOtherParam3'));

    test.done();
};

exports.testMakePeopleList = function (test) {
    var params = {
            name1: 'RAHOOL',
            email1: 'HatesGuardians@TheTower.com',
            name2: 'Sepkis Prime',
            email2: 'machine.god40@TheDarkness.org',
            name3: 'The Speaker',
            email3: 'Voice.Of.Light@TheTower.com',
            exclude3: '2'
        },
        people = santa.makePeopleList(params);

    test.equal(3, people.length);
    test.equal(1, people[2].exclusions.length);

    test.done();
};

exports.testSimpleGraph = function (test) {
    var people = [
            {id: 1, exclusions: []},
            {id: 2, exclusions: []},
            {id: 3, exclusions: []},
            {id: 4, exclusions: []},
            {id: 5, exclusions: []},
            {id: 6, exclusions: []}
        ],
        graph = new Solver(people).getRandomGraph(),
        from = _.map(graph, function (edge) {
            return edge.from;
        }),
        to = _.map(graph, function (edge) {
            return edge.to;
        });

    test.equal(true, from.length == 6, "There aren't enough 'from' nodes");
    test.equal(true, to.length == 6, "There aren't enough 'to' nodes");
    test.equal(6, _.uniq(to).length, "There aren't enough unique entries in to");
    test.equal(6, _.uniq(from).length, "There aren't enough unique entries in from");

    test.done();
};

exports.testSimpleGraphWithGaps = function (test) {
    var people = [
            {id: 1, exclusions: []},
            {id: 2, exclusions: []},
            {id: 4, exclusions: []},
            {id: 5, exclusions: []},
            {id: 7, exclusions: []},
            {id: 8, exclusions: []}
        ],
        graph = new Solver(people).getRandomGraph(),
        from = _.map(graph, function (edge) {
            return edge.from;
        }),
        to = _.map(graph, function (edge) {
            return edge.to;
        });

    test.equal(true, from.length == 6, "There aren't enough 'from' nodes");
    test.equal(true, to.length == 6, "There aren't enough 'to' nodes");
    test.equal(6, _.uniq(to).length, "There aren't enough unique entries in to");
    test.equal(6, _.uniq(from).length, "There aren't enough unique entries in from");

    test.done();
};

exports.testComplexGraph = function (test) {
    var people = [
            {id: 1, exclusions: [2, 3, 4, 5]},
            {id: 2, exclusions: [3, 4, 5, 6]},
            {id: 3, exclusions: [1, 2, 5, 6]},
            {id: 4, exclusions: [1, 3, 5, 6]},
            {id: 5, exclusions: [1, 2, 4, 6]},
            {id: 6, exclusions: [1, 2, 3, 4]}
        ],
        graph = new Solver(people).getRandomGraph(),
        from = _.map(graph, function (edge) {
            return edge.from;
        }),
        to = _.map(graph, function (edge) {
            return edge.to;
        });

    test.equal(true, from.length == 6, "There aren't enough 'from' nodes");
    test.equal(true, to.length == 6, "There aren't enough 'to' nodes");
    test.equal(6, _.uniq(to).length, "There aren't enough unique entries in to");
    test.equal(6, _.uniq(from).length, "There aren't enough unique entries in from");

    test.done();
};

exports.testImpossibleGraph = function (test) {
    var people = [
        {id: 1, exclusions: [2]},
        {id: 2, exclusions: [1]},
        {id: 3, exclusions: []}
    ];

    try {
        new Solver(people).getRandomGraph();
    } catch (e) {
        test.equal(e, 'Impossible walk');
    }

    test.done();
};

exports.testReallyHardGraph = function (test) {
    var people = [
            {
                id: 1,
                name: 'Mom',
                email: 'mom@mom.com',
                exclusions: [2, 3, 5]
            },
            {
                id: 2,
                name: 'Dad',
                email: 'Dad@dad.com',
                exclusions: [1, 3, 5]
            },
            {
                id: 3,
                name: 'Jimmy',
                email: 'Jimmy@Jimmy.com',
                exclusions: [1, 2, 4, 5]
            },
            {id: 4, name: 'Eula', email: 'Eula@Eula.com', exclusions: [3]},
            {
                id: 5,
                name: 'Alyssa',
                email: 'Alyssa@Alyssa.com',
                exclusions: [1, 2, 3]
            },
            {
                id: 6,
                name: 'Chris',
                email: 'Chris@Chris.com',
                exclusions: [5]
            },
            {
                id: 7,
                name: 'Lauren',
                email: 'Lauren@Lauren.com',
                exclusions: [8, 9, 10]
            },
            {
                id: 8,
                name: 'Evan',
                email: 'Evan@Evan.com',
                exclusions: [7, 9, 10]
            },
            {
                id: 9,
                name: 'Uncle Lindsey',
                email: 'Lindsey@lindsey.com',
                exclusions: [7, 8, 10]
            },
            {
                id: 10,
                name: 'Aunt Diane',
                email: 'Diane@awerg.com',
                exclusions: [7, 8, 9]
            },
            {
                id: 11,
                name: 'Grandma',
                email: 'Grandma@afddsafsdf.asd',
                exclusions: [12, 13]
            },
            {
                id: 12,
                name: 'Grandpa',
                email: 'asdfasdg@asdfasdf.asw',
                exclusions: [11, 13]
            },
            {
                id: 13,
                name: 'Uncle Kyle',
                email: 'asdfasf@asdfasdf.qwe',
                exclusions: [11, 12]
            }
        ],
        graph = new Solver(people).getRandomGraph(),
        from = _.map(graph, function (edge) {
            return edge.from;
        }),
        to = _.map(graph, function (edge) {
            return edge.to;
        });

    test.equal(true, from.length == 13, "There aren't enough 'from' nodes");
    test.equal(true, to.length == 13, "There aren't enough 'to' nodes");
    test.equal(13, _.uniq(to).length, "There aren't enough unique entries in to");
    test.equal(13, _.uniq(from).length, "There aren't enough unique entries in from");

    test.done();
};