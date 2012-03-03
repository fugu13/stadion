
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
    
    return {
        sync: sync,
    }
}())
