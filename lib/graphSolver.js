var _ = require('underscore');
var State = function(current, available, chosen, failed) {
    this.available = available;
    this.chosen = chosen;
    this.current = current;
    this.failed = failed;
};

exports.Solver = function(people) {
    this.stateStack = [];
    this.people = people;
    this.available = people.slice(0, people.length);

    this.getRandomGraph = function() {
        var start = _.max(people, function(person) { return person.exclusions.length });
        return this._getRandomGraph(start);
    };

    this._getRandomGraph = function(start) {
        var current = start,
            failed = [],
            available,
            chosen,
            state;

        //We need to remove the starting point because it must be the ending point of the graph walk
        this.available.splice(this.available.indexOf(start), 1);

        while(this.available.length > 0) {
            available = getAvailable(current, this.available, failed);
            if(available.length > 0) {
                chosen = available[_.random(0, available.length - 1)];
                state = new State(current, this.available, chosen, failed);
                this.stateStack.push(state);

                //Set the state up for the next pass
                failed = [];
                current = chosen;

                this.available.splice(this.available.indexOf(chosen), 1);
            } else {
                //Back it on up!
                if(this.stateStack.length != 0) {
                    state = this.stateStack.pop();
                    current = state.current;
                    available = state.available;
                    failed = state.failed;
                    failed.push(state.chosen);
                    this.available.push(state.chosen);
                } else {
                    throw 'Impossible walk';
                }

            }

            if(this.available.length == 0) {
                if(current.exclusions.indexOf(start.id) === -1) {
                    //Complete Hamiltonian path by closing the walk.
                    this.stateStack.push(new State(current, this.available, start, []));
                } else {
                    if(this.stateStack.length < 2) {
                        throw 'Impossible walk';
                    }

                    state = this.stateStack.pop();
                    current = state.current;
                    available = state.available;
                    failed = state.failed;
                    failed.push(state.chosen);
                    this.available.push(state.chosen);

                    state = this.stateStack.pop();
                    current = state.current;
                    available = state.available;
                    failed = state.failed;
                    failed.push(state.chosen);
                    this.available.push(state.chosen);
                }

            }
        }

        return _.map(this.stateStack, function(s) {
            return {
                from: s.current,
                to: s.chosen
            }
        });

    };
    var getAvailable = function(person, available, failed) {
        return _.filter(available, function(other) {
            return other.id != person.id
                && person.exclusions.indexOf(other.id) === -1
                && failed.indexOf(other.id) === -1;
        });
    }


};