
$(function() {
    ko.bindingHandlers.buttonize = {
        update: function(element) {
            $(element).button();
        }
    };
    $('html').css('display', 'block');
    //prevent form submissions -- knockout would normally do this,
    //but I think jqm is interfering
    $('form').on('submit', function() { return false; });
    $('.loggedin').on('pagebeforeshow', function() {
        if(!localStorage.email) {
            $.mobile.changePage("#login");
        }
    });
    $('#channels').on('pagecreate', function() {
        var viewModel = {
            products: ko.observableArray([]),
        };
        viewModel.navigate = function(product) {
            localStorage.product = product.id();
            localStorage.productName = product.name();
            $.mobile.changePage('#feed');
        }
        ko.applyBindings(viewModel, this);
        if(localStorage.product) {
            $.mobile.changePage('#feed');
        }
        $('#channels').on('pagebeforeshow', function() {
            var page = $.mobile.activePage;
            var updater = function() {
                if($.mobile.activePage != page) {
                    return;
                }
                $.ajax({
                    url: 'http://localhost/api/products.json',
                    success: function(data) {
                        var mapped = ko.mapping.fromJS(data);
                        viewModel.products(mapped);
                        setTimeout(updater, 60000);
                    }
                });
            };
            updater();
        });
    });
    $('#login').on('pagecreate', function() {
        var viewModel = {
            email: ko.observable(),
            password: ko.observable(),
            login: function(form) {
                $.mobile.changePage("#channels");
            }
        };
        util.sync("email", viewModel, localStorage);
        util.sync("password", viewModel, localStorage);
        ko.applyBindings(viewModel, this);
    });
    $('#feed').on('pagecreate', function() {
        var viewModel = {
            feeds: {},
            feed: ko.observableArray([]),
            productName: ko.observable(),
            afterAdd: function(element, index, item) {
                $(element).fadeIn();
            },
            backToChannels: function() {
                delete localStorage.product;
                $.mobile.changePage('#channels');
            }
        };
        ko.applyBindings(viewModel, this);
        $('#feed').on('pagebeforeshow', function() {
            if(!localStorage.product) {
                $.mobile.changePage('#channels');
                return;
            }
            var page = $.mobile.activePage;
            var product = localStorage.product;
            viewModel.productName(localStorage.productName);
            var feedKey = "feed:" + product;
            viewModel.feed(viewModel.feeds[product]
                || JSON.parse(localStorage[feedKey] || '[]')
            );
            viewModel.feed.subscribe(function(feed) {
                viewModel.feeds[product] = feed;
                localStorage[feedKey] = JSON.stringify(feed.slice(0, Math.min(20, feed.length)));
            });
            var diff = diffmodel(product, 'items', {
                'assigned_to': {
                    key: function(data) {
                        return ko.utils.unwrapObservable(data.id);
                    }
                },
                'created_by': {
                    key: function(data) {
                        return ko.utils.unwrapObservable(data.id);
                    }
                },
                'product': {
                    key: function(data) {
                        return ko.utils.unwrapObservable(data.id);
                    }
                },
            }, function(item, firstAdd) {
                //first, display item in activity stream
                if(firstAdd) {
                    viewModel.feed.unshift(
                        util.itemDescription(item) + " just added."
                    );
                }
                var updates = util.itemUpdates(item);
                updates.subscribe(function(value) {
                    if(value) {
                        viewModel.feed.unshift(value);
                    }
                });
            });
            var runupdates = function() {
                if($.mobile.activePage != page) {
                    return;
                }
                $.ajax({
                    url: 'http://localhost/api/products/' + product + '/items.json',
                    /*username: localStorage.email,
                    password: localStorage.password, */
                    success: function(data) {
                        //TODO: switch to the updater being used for a series
                        //of ajax calls to get all the items
                        var updater = diff.updater();
                        _.each(data, function(item) {
                            item.id = item.number;
                            updater.update(item);
                        });
                        updater.finish();
                        setTimeout(runupdates, 10000);
                    },
                    error: function(xhr, textStatus, error) {
                        //TODO: on permissions error, send back to login page
                        console.log('error', textStatus, error);
                    },
                });
            };
            runupdates();
        });
    });
});

