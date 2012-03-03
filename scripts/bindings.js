

$(function() {
    $('html').css('display', 'block');
    //prevent form submissions -- knockout would normally do this,
    //but I think jqm is interfering
    $('form').on('submit', function() { return false; });
    $('#login').on('pagecreate', function() {
        var viewModel = {
            email: ko.observable(),
            password: ko.observable(),
            login: function(form) {
                console.log("moving along");
                $.mobile.changePage("#home");
            }
        };
        util.sync("email", viewModel, localStorage);
        util.sync("password", viewModel, localStorage);
        ko.applyBindings(viewModel, this);
    });
    $('#login').on('pagebeforeshow', function() {
        if(localStorage.email) {
            $.mobile.changePage('#home');
        }
    });
    $('#home').on('pagebeforeshow', function() {
        console.log('calling ajax');
        $.ajax({
            url: 'https://sprint.ly/api/products.json',
            username: localStorage.email,
            password: localStorage.password,
            success: function(data) {
                console.log("got data", data);
            },
            error: function(xhr, textStatus, error) {
                console.log('error', textStatus, error);
            }
        });
    });
});

