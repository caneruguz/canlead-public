var currentPrint = 'sessions';
$(document).ready(function(){
    var counter = 0;
    $('#saveCSV').click(function(){
        var blob = new Blob([$('.output').text()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, currentPrint +  counter + ".csv");
        counter++;
    });
    $('#buildSessions').click(function(){
        currentPrint = 'sessions';
        buildSessions();
    });
    $('#buildUsers').click(function(){
        currentPrint = 'users';
        buildUsers();
    });
});

var clicks = [];
var userList = [];
var userObject = {};
var users = {};
var userData = {};
var sessions = [];
var flat_sessions = [];
var indexes = {};
var modules = {};
var topics = {};

var staticModules = {33: 6, 57: 1, 103: 37, 111: 4, 119: 111, 126: 3, 132: 3, 144: 3, 150: 3, 164: 250, 186: 3, 192: 3, 198: 13336, 200: 4268, 202: 568, 204: 1707, 208: 18711, 212: 420, 218: 31, 220: 40, 222: 8, 224: 11, 228: 31, 232: 36};
var staticTopics = {55: 1, 1689: 1, 1693: 3, 1697: 1, 1699: 1, 1707: 1, 1729: 5, 1743: 2, 1745: 2, 1747: 2, 1757: 1, 1759: 1, 1761: 3, 1769: 1, 1775: 2, 1777: 1, 1781: 2, 1787: 1, 1794: 12, 1800: 2, 1802: 3, 1808: 1, 1814: 1, 1822: 2, 1826: 1, 1930: 4, 2142: 1, 2144: 1, 2482: 3, 2490: 39, 2492: 20, 2494: 798, 2496: 22, 2500: 31, 2502: 1, 2506: 167, 2510: 1, 2512: 38, 2514: 9, 2516: 1, 2518: 16, 2520: 16, 2522: 2, 2524: 1, 2526: 6, 2528: 5, 2534: 4, 2536: 2, 2538: 3, 2552: 4, 2554: 1, 2558: 19, 2560: 7, 2568: 2, 2592: 86, 2594: 3, 2596: 5, 2598: 46, 2600: 18, 2602: 3, 2604: 3, 2606: 11, 2608: 10, 2612: 9, 2614: 46, 2616: 33, 2620: 67, 2624: 79, 2626: 1, 2636: 2, 2644: 13, 2648: 12, 2652: 4, 2654: 13, 2656: 8, 2660: 24, 2662: 22, 2664: 5, 2666: 7, 2670: 2, 2676: 6, 2704: 4, 2706: 3, 2708: 37, 2712: 9, 2714: 1, 2718: 55, 2720: 1, 2730: 1, 2732: 5, 2736: 8, 2738: 28, 2740: 5, 2754: 1, 2758: 22, 2760: 42, 2764: 1, 2766: 13, 2770: 7, 2772: 4,2774:1,2778:18,2780:1,2782:1,2786:2,2798:1,2800:5,2806:1,2808:2,2810:1,2818:2,2824:1,2830:1};

var page_types = [
    "NULL",
    "Assignment",
    "Course",
    "Message",
    "Resource",
    "Response",
    "Session",
    "Survey",
    "User"
];
var action_types = [
    "create",
    "destroy",
    "discussions",
    "edit",
    "index",
    "insert",
    "messages",
    "monthly_recap",
    "new",
    "people",
    "prioritize",
    "school_level_reports",
    "search",
    "show",
    "stop_impersonating",
    "submit",
    "tasks",
    "thanks",
    "topics",
    "update",
    "update_priorities",
    "update_titles"
];

var active_actions =  [
    "create",
    "destroy",
    "edit",
    "insert",
    "new",
    "update",
    "update_titles"
];

var schools = ["S", "FTB", "PO", "P", "ST", "JW", "LM", "KQ"]

/* LOAD ITEMS */
function loadClicks () {
    $.ajax({
        method : 'GET',
        url : 'clicks.json'
    }).done(function(result){
        console.log(result);
        clicks = result;
    }).fail(function(){
        console.log('Failed to receive full_data.json', 'danger');
    });
}

function loadUsers () {
    $.ajax({
        method : 'GET',
        url : 'users.json'
    }).done(function(result){
        console.log(result);
        userList = result;
        for(var i = 0; i < userList.length; i++){
            var o = userList[i];
            userObject[o.id] = o;
        }

    }).fail(function(){
        console.log('Failed to receive full_data.json', 'danger');
    });
}

function init() {
    loadClicks();
    loadUsers();
}


var Calculators  = {
    returnCalendarWeek : function (d) {
        // Copy date so don't modify original
        d = new Date(+d);
        d.setHours(0,0,0);
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setDate(d.getDate() + 4 - (d.getDay()||7));
        // Get first day of year
        var yearStart = new Date(d.getFullYear(),0,1);
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        // Return array of year and week number
        return weekNo;
    },
    sessionGapAverage : function (gapArray) {
        var total = 0;
        for(var i = 0; i < gapArray.length; i++) {
            total += gapArray[i];
        }
        var avg = total / gapArray.length;
        return avg;
    },
    processPath : function(path, info){
        var pathArr = path.split('/');
        var request = null;
        for(var i = 0; i < pathArr.length; i++){
            if(pathArr[i] === info){
                request = pathArr[i+1];
            }
        }
        return request;
    },
    topicAverageTime : function (data) {
        var total = 0;
        Object.keys(data.topics).forEach(function(key, index, array) {
            var item = data.topics[key];
            total = total + item;
        });
        var avg = data.topicTime / total;
        if(total === 0 || data.topicTime === 0){ return 0; }
        return avg;
    }
};



function buildSessions () {
    function finalUpdate(s,lastrow){
        // last update to previous session
        s.duration = Math.ceil(Math.abs(new Date(lastrow.created_at) - new Date(s.start)) / 60000);
        if(s.duration === 0) { s.duration = 1;}
        s.duration_per_page = s.duration / s.total_hits;
        sessions.push(s);
    }

    var i;
    var row;
    var lastrow;
    var nextrow;
    var s = {}; // current session
    var surveyStart;
    var counter = 0;
    for (i = 0; i < clicks.length; i++){
        row = clicks[i];
        nextrow = clicks[i+1];
        lastrow = clicks[i-1];
        if(!lastrow  || Math.abs(new Date(lastrow.created_at) - new Date(row.created_at)) > 1200000  ){
            if(i !== 0){
                finalUpdate(s,lastrow);
            }
            // start new
            s = {  // Reset session
                user_id : row.user_id,
                start : new Date(row.created_at),
                duration:0,
                total_hits : 0,
                duration_per_page:0,
                calendar_week : 0,
                day_of_month : 0,
                hour : 0
            };
        }
        s.total_hits++;
        if(s[row.page_type]){
            s[row.page_type]++;
        } else {
            s[row.page_type] = 1;
        }

        var date = new Date(row.created_at);
        s.calendar_week = Calculators.returnCalendarWeek(date);
        s.day_of_month = date.getDate();
        s.hour = date.getHours();


        if(s[row.action_name]) {
            s[row.action_name]++;
        } else {
            s[row.action_name] = 1;
        }

        if(i === clicks.length-1){
            finalUpdate(s,clicks[i-1]);
        }

        // Count modules and topics
        if(!userData[row.user_id]){
            userData[row.user_id] = {
                user_id : row.user_id,
                first_session : null,
                last_session : null,
                previous_date: null,
                session_gaps : [],
                topicTime : 0,
                topicVisits : 0,
                resourceCount : 0,
                assignmentsCount : 0,
                prioritizeCount : 0,
                updateTitlesCount : 0,
                searchCount : 0,
                otherUserCount : 0,
                discussionCount : 0,
                archiveCount : 0,
                activeActionCount: 0,
                surveyCount : 0,
                surveyUniqueCount : 0,
                surveyTime : 0,
                topics : {},
                modules : {}
            };
        }
        var module = Calculators.processPath(row.request_path, 'modules');
        if(module){
            // add to global list
            if(!modules[module]){ modules[module] = 0;}
            modules[module]++;
            // add to users list
            if(!userData[row.user_id].modules[module]){
                userData[row.user_id].modules[module] = 0;
            }
            userData[row.user_id].modules[module]++;
        }
        var topic =  Calculators.processPath(row.request_path, 'topics');
        if(topic){
            // add to global list
            if(!topics[topic]){ topics[topic] = 0;}
            topics[topic]++;
            // add to user list
            if(!userData[row.user_id].topics[topic]){
                userData[row.user_id].topics[topic] = 0;
            }
            userData[row.user_id].topics[topic]++;

            var time;
            if(nextrow && nextrow.session_started === row.session_started){
                time = Math.abs(new Date(nextrow.created_at) - new Date(row.created_at)) / 60000;
            } else {
                time = 2;
            }
            userData[row.user_id].topicTime = userData[row.user_id].topicTime + time;
            userData[row.user_id].topicVisits++;
        }

        if(row.controller_name === 'resources'){
            userData[row.user_id].resourceCount++;
        }
        if(row.controller_name === 'assignments'){
            userData[row.user_id].assignmentsCount++;
        }
        if(row.action_name === 'prioritize'){
            userData[row.user_id].prioritizeCount++;
        }
        if(row.action_name === 'update_titles'){
            userData[row.user_id].updateTitlesCount++;
        }
        if(row.controller_name === 'search'){
            userData[row.user_id].searchCount++;
        }
        if(row.page_type === 'User'){
            var userChecked = Calculators.processPath(row.request_path, "users");
            if(userChecked != row.user_id){
                userData[row.user_id].otherUserCount++;
            }
        }
        if(row.action_name === 'discussions'){
            userData[row.user_id].discussionCount++;
        }
        if(row.controller_name === 'archive'){
            userData[row.user_id].archiveCount++;
        }
        if(active_actions.indexOf(row.action_name) !== -1){
            userData[row.user_id].activeActionCount++;
        }
        if(row.page_type === 'Survey'){
            if(lastrow && row.user_id !== lastrow.user_id){
                surveyStart = null;
            }
            if(!surveyStart && row.action_name === "show"){
                surveyStart = row.created_at;
            } else {
                if(row.action_name === "submit"){
                    var diff = (Math.abs(new Date(row.created_at) - new Date(surveyStart)) / 60000) + 1; // in seconds
                    // console.log("diff", diff, new Date(row.created_at), new Date(surveyStart));
                    if (diff > 20) {diff = 20; }
                    if(diff > 500) {console.log(diff);}
                    // console.log(userData[row.user_id].surveyCount);
                    surveyStart = null;
                    userData[row.user_id].surveyUniqueCount++;
                    userData[row.user_id].surveyTime = userData[row.user_id].surveyTime + diff;
                }
            }
        } else {
            surveyStart = null;
        }
        if(row.action_name == 'submit'){
            userData[row.user_id].surveyCount++;
        }
    }
    console.log(sessions);
    var keyOrder = [
        'user_id',
        'start',
        'duration',
        'total_hits',
        'duration_per_page',
        'calendar_week',
        'day_of_month',
        'hour'].concat(action_types).concat(page_types);
        console.log(keyOrder.toString());
    outputCSV(sessions, keyOrder);
}

function buildUsers(){
    var i, o, user, userArray, data, j, k;
    for(i = 0; i < sessions.length; i++){
        o = sessions[i];
        if(!users[o.user_id]){
            users[o.user_id] = {
                user_id : o.user_id,
                totalSessions : 0,
                totalHits : 0,
                totalTime : 0,
                sessionRange : null,
                sessionGapAverage : null,
                sessionGapVariance : null,
                weeklyHours : null,
                topicDiversity : null,
                topicAverageTime : null,  // ?? check
                topicVisitsCount : null,
                topicResourceUse : null,
                topicAssignmentUse : null,
                topicPrioritizeUse : null,
                topicUpdateTitlesUse: null,
                personalStatement: null,
                personalGoals : null,
                personalAvatar : null,
                searchCount : null,
                searchOtherUsers : null,
                searchDiscussionItems : null,
                searchArchiveCount: null,
                searchActiveCount: null,
                surveyClicks : null,
                surveyUntilSubmit : null,
                surveyTotalTime : null,
            };
        }

        // DIRECT CALCULATIONS
        user = users[o.user_id];
        user.totalSessions++;
        user.totalHits = user.totalHits + o.total_hits;
        user.totalTime = user.totalTime + o.duration;

        // META CALCULATIONS
        data = userData[o.user_id];
        var lastGap;
        if(data.first_session === null) {
            // if changed user handle switch
            var prevSession = sessions[i-1];
            if(prevSession){
                var prevUser = prevSession.user_id;
                if(o.user_id !== prevUser){
                    var prevData = userData[prevUser];
                    prevData.last_session = prevSession.start;
                    lastGap = Math.abs(prevSession.start - prevData.previous_date) / (60*60*1000);
                    prevData.session_gaps.push(lastGap);
                }
            }


            data.first_session = o.start;
            data.previous_date = o.start;
            lastGap = 0;
        } else {
            data.previous_date = sessions[i-1].start;
            data.last_session = o.start;
            lastGap = Math.abs(o.start - data.previous_date) / (24*60*60*1000);

        }

        data.session_gaps.push(lastGap);

    }

    // Final Calculations
    Object.keys(users).forEach(function(key, index, array) {
        var user = users[key];
        var data = userData[key];
        user.sessionRange = Math.ceil(data.last_session - data.first_session) / (24*60*60*1000);
        user.sessionGapAverage = Calculators.sessionGapAverage(data.session_gaps);
        user.sessionGapVariance = arr.standardDeviation( data.session_gaps);
        user.weeklyHours = user.totalTime / (user.sessionRange/7);
        user.topicDiversity = Object.keys(data.topics).length;
        user.topicAverageTime = Calculators.topicAverageTime(data);
        user.topicVisitsCount = data.topicVisits;
        user.topicResourceUse = data.resourceCount;
        user.topicAssignmentUse = data.assignmentsCount;
        user.topicPrioritizeUse = data.prioritizeCount;
        user.topicUpdateTitlesUse = data.updateTitlesCount;
        if(userObject[user.user_id]){
            var statement = userObject[user.user_id].personal_statement;
            user.personalStatement = statement === 'NULL' || statement === 0 ? 0 : 1;

            var avatar = userObject[user.user_id].avatar_file_name;
            user.personalAvatar = avatar === 'NULL' ? 0 : 1;

            var goals = userObject[user.user_id].goals;
            user.personalGoals = goals.length > 5 ? 1 : 0;

            console.log(user.user_id, userObject[user.user_id].email, userObject[user.user_id].school);
            user.school = userObject[user.user_id].school;

        } else {
            console.log("There is no user in records for this session.");
        }
        user.searchCount = data.searchCount;
        user.searchOtherUsers = data.otherUserCount;
        user.searchDiscussionItems = data.discussionCount;
        user.searchArchiveCount = data.archiveCount;
        user.searchActiveCount = data.activeActionCount;
        user.surveyClicks = data.surveyCount;
        user.surveyUntilSubmit = data.surveyTime / data.surveyUniqueCount;
        user.surveyTotalTime = data.surveyTime;
    });



    console.log(users);
    userArray = objectToArray(users);
    console.log(userArray);
    var keyOrder = [
        'user_id',
        'totalSessions',
        'totalHits',
        'totalTime',
        'sessionRange',
        'sessionGapAverage',
        'sessionGapVariance',
        'weeklyHours',
        'topicDiversity',
        'topicAverageTime',
        'topicVisitsCount',
        'topicResourceUse',
        'topicAssignmentUse',
        'topicPrioritizeUse',
        'topicUpdateTitlesUse',
        'personalStatement',
        'personalGoals',
        'personalAvatar',
        'searchCount',
        'searchOtherUsers',
        'searchDiscussionItems',
        'searchArchiveCount',
        'searchActiveCount',
        'surveyClicks',
        'surveyUntilSubmit',
        'surveyTotalTime',
        'school'
    ];
    outputCSV(userArray, keyOrder);

}

function objectToArray(obj){
    var arr = [];
    Object.keys(obj).forEach(function(key, index, array) {
        var user = obj[key];
        arr.push(user);
    });
    return arr;
}

function outputCSV (data, keyOrder) {
            var i;
            var row;
            var text = '';
            var header = keyOrder.toString() + '\n';
            var comma = '';
            for (i = 0; i < data.length; i++) {
                row = data[i];
                // get key order from first one
                keyOrder.forEach(function(key, index){
                    var value = row[key] || 0;
                    if(index === 0){
                        comma = '';
                    } else {
                        comma = ',';
                    }
                    text += comma + value;
                });
                text += ('\n');
            }
            $('.output').html(header + '\n' + text);
        }


init();
