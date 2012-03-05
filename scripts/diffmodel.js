
var diffmodel = function(group, name, mapping, newItemCallback) {
    var storageKey = "diffmodel:" + group + ":" + name;
    var model = {};
    if(localStorage[storageKey]) {
        model = JSON.parse(localStorage[storageKey]);
        _.each(model, function(submodel, key) {
            model[key] = ko.mapping.fromJS(submodel);
            newItemCallback(model[key], false);
        });
    }
    
    var updater = function() {
        var updatedModel = {};
        
        var update = function(item) {
            if(updatedModel[item.id]) {
                console.log("huh? I already have it?!");
            } else if(model[item.id]) {
                ko.mapping.fromJS(item, mapping, model[item.id]);
                updatedModel[item.id] = model[item.id];
            } else {
                updatedModel[item.id] = ko.mapping.fromJS(item, mapping);
                newItemCallback(updatedModel[item.id], true);
            }
            //TODO: do I return this to make this chainable?
        };
        
        var finish = function() {
            //do not record deletions?
            model = $.extend({}, updatedModel);
            //now use updatedmodel as temp storage for the pure js versions
            _.each(updatedModel, function(submodel, key) {
                updatedModel[key] = ko.mapping.toJS(submodel);
            });
            localStorage[storageKey] = JSON.stringify(updatedModel);
            //TODO: invalidate this updater
        };
        
        return {
            update: update,
            finish: finish
        };
    };
    return {
        updater: updater,
        model: function() { return model; }
    }
};
