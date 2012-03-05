

var util = (function() {

    var saver = function(key, storage) {
        var save = function(value) {
            storage.setItem(key, value);
        };
        return save;
    };

    var sync = function(key, viewModel, storage) {
        if(storage[key]) {
            viewModel[key](storage[key]);
        }
        viewModel[key].subscribe(saver(key, storage));
        $(window).on('storage', function(event) {
            if(event.key == key) {
                viewModel[key](event.newValue);
            }
        });
    };
    
    var itemUpdates = function(item) {
        var watchers = {
            'title': function(oldValue, newValue) {
                return "has been retitled to " + newValue;
            },
            'score': function(oldValue, newValue) {
                if(oldValue == '~') {
                    return "assigned a size of " + newValue;
                } else {
                    return "resized from " + oldValue + " to " + newValue;
                }
            },
            'status': function(oldValue, newValue) {
                var sequence = ["backlog", "in-progress", "completed", "accepted"];
                if(oldValue == "backlog") {
                    return "now " + newValue;
                } else if(sequence.indexOf(oldValue) > sequence.indexOf(newValue)) {
                    return "sent back to " + newValue;
                } else {
                    return "moved along to " + newValue + " from " + oldValue;
                }
            },
            'archived': function(oldValue, newValue) {
                if(newValue) {
                    return "archived";
                } else {
                    return "unarchived!";
                }
            },
            'description': function(oldValue, newValue) {
                return "had its description updated";
            },
            'tags': function(oldValue, newValue) {
                var added = _.difference(newValue, oldValue);
                var removed = _.difference(oldValue, newValue);
                if(added.length || removed.length) {
                    return "tagged with '" + added.join(", ")
                        + "' and had '" + removed.join(", ") + "' tags removed";
                } else {
                    return null;
                }
            }, //TODO: figure out what to do with mapping so this is not called for every item every time
            /* 'assigned_to': function(oldValue, newValue) {
                return "now being worked on by " + newValue.first_name + " " + newValue.last_name;
            } */ //TODO: what do I subscribe to, here? how do I make it work?
            //I should probably create new diffmodels for users. Also comments
        };
        _.each(watchers, function(describer, key) {
            if(item[key]) {
                item[key].subscribe(function(value){
                    describer.previousValue = value;
                }, null, "beforeChange");
            }
        });
        return ko.computed(function() {
            var update = "<dl><dt>" + itemDescription(item) + "</dt>";
            var updated = false;
            _.each(watchers, function(describer, key) {
                if(item[key]) {
                    var newValue = item[key]();
                    if(describer.previousValue) {
                        var description = describer(describer.previousValue, newValue);
                        if(description) {
                            update += "<dd>" + description + "</dd>";
                            describer.previousValue = null;
                            updated = true;
                        }
                    }
                }
            });
            update += "</dl>";
            if(updated) {
                return update;
            } else {
                return null;
            }
        }).extend({ throttle: 50 });
    };
    
    var capitalize = function(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    };
    
    var itemDescription = function(item) {
        return capitalize(item.type()) + " #" + item.number() + ", "
                + '<a rel="external" href="https://sprint.ly/#!/product/'
                + item.product.id() + '/item/' + item.number() + '">'
                + item.title() + '</a>';
    };
    
    return {
        sync: sync,
        itemUpdates: itemUpdates,
        capitalize: capitalize,
        itemDescription: itemDescription,
    }
}())
