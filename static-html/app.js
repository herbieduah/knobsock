
var currentGroup = 0;

var current_groups = [];

var group_source = $('#group-template').html();
var group_template = Handlebars.compile(group_source);
var group_context = {};

var member_source = $('#member_template').html();
var member_template = Handlebars.compile(member_source);
var member_context = {};

var active_sock_source = $('#active-sock-template').html();
var active_sock_template = Handlebars.compile(active_sock_source);
var active_sock_context = {};

var inactive_sock_source = $('#inactive-sock-template').html();
var inactive_sock_template = Handlebars.compile(inactive_sock_source);
var inactive_sock_context = {};

var no_knobs_source = $('#no-knobs-template').html();


fetchGroups = function() {
    $.getJSON('/api/groups/s.json', function(data) {
        current_groups = data.groups;
        group_context['groups'] = data.groups;
        var group_html = group_template(group_context);

        $('#group-list').html(group_html);
        if (current_groups.length > 0) {
            member_context['members'] = data.groups[currentGroup].members;
            member_context['curGroup'] = data.groups[currentGroup];

            var member_html = member_template(member_context);
            $('#member_list').html(member_html);
        }
        else {
            console.log("No members");
            member_context['curGroup'] = null;
            var member_html = member_template(member_context);
            $('#member_list').html(member_html);
        }

        console.info('Fetched Groups!');
        updateSocks();
    });
};

invite_init = function(key) {
	document.getElementById('group_key').value = key
}

changeGroup = function(index) {
    currentGroup = index;
    member_context['curGroup'] = group_context['groups'][currentGroup];
    member_context['members'] = group_context['groups'][currentGroup].members;
    var member_html = member_template(member_context);
    $('#member_list').html(member_html);
};

updateKnob = function(group_key, diff_minutes, message) {
    date = new Date();
    new_date = new Date(date.getTime() + diff_minutes * 60000);

    data = {
        'group': group_key,
        'new_time': new_date.toISOString(),
        'message': message
    }
    $.post('/api/knobs/update', data); 
};

createGroup = function(){
    name = $("#thegroup").val();
    data = {
        'group_name': name
    }
    $.post('/api/groups/create', data, function(){
        $('#group-modal').modal('hide');
        $("#thegroup").val('');
        fetchGroups();
    }); 
};

updateSocks = function() {
    console.info("Updating Socks");
    // clear out HTML
    $('#sock-container').html('');
    if (!current_groups.length){
        $('#sock-container').append(no_knobs_source);
    }
    // add active socks 
    for (var i = 0; i < current_groups.length; i++) {
        if (current_groups[i].knob == true) {
            var sock_context = {
                'group_name': current_groups[i].name,
                'time_remaining': Date.parse(current_groups[i].timeout) - Date.parse(current_groups[i].servertime)
            };
            var sock_html = active_sock_template(sock_context);
            $('#sock-container').append(sock_html);
        }

    }
    // add inactive socks
    for (var i = 0; i < current_groups.length; i++) {
        if (current_groups[i].knob != true) {
            var sock_context = {
                'group_name': current_groups[i].name,
                'group_minutes': 'minutes-' + current_groups[i].key,
                'group_slider': current_groups[i].key,
                'time_remaining': 0,
                'percentage_remaining': (current_groups[i].timein / current_groups[i].timeout) * 100
            }
            var sock_html = inactive_sock_template(sock_context);
            $('#sock-container').append(sock_html);
        }
        $('#' + current_groups[i].key).noUiSlider({
            start: 15,
            connect: 'lower',
            range: {
                'min': 5,
                'max': 120
            },
            format: wNumb({
                decimals: 0
            })
        });
        $('#' + current_groups[i].key).Link('lower').to($('#minutes-' + current_groups[i].key));
    }
};

main_loop = function() {
    //$.material.init();


    fetchGroups();
    //updateSocks();
    setInterval(fetchGroups, 1000);
    //setTimeout(updateSocks, 3000);
};

$(document).ready(function() {
    $('#groups-list').html("");
    main_loop();
});

