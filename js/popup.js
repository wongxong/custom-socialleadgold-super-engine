KangoAPI.onReady(function () {
    var started = false;
    var count = [];
    var current_tab_id;
    var scServer = "http://gold.socialleadgold.com/authenticateg.php";
    var header = {
        name: "socialleadg",
        code: "Hfu8Xow2sMv"
    };
    $(".title").click(function(){
        window.open($(this).attr("data-url"), "_blank");
    });
    var user = kango.storage.getItem("user");
    if (user) {
        $.ajax({
            url: scServer,
            type: "POST",
            data: {
                username: user.username,
                password: user.password
            },
            headers: {
                "Authorization": "Basic " + btoa(header.name + ":" + header.code)
            },
            success: function (data) {
                if (data != "VALID|PAID") {
                    kango.storage.setItem("active", false);
                    $("#notActive").show();
                }
            },
            error: function () {
                kango.storage.setItem("active", false);
                $("#notActive").show();
            }
        });
    } else {
        kango.storage.setItem("active", false);
        $("#notActive").show();
    }
    if (!kango.storage.getItem("active")) {
        $("#notActive").show();
    }
    kango.browser.tabs.getCurrent(function (tab) {
        current_tab_id = tab.getId();
    });
    function startScrape(e, text) {
        kango.browser.tabs.getCurrent(function (tab) {
            tab.dispatchMessage('startScrape');
        });
        kango.addMessageListener('startScrape_response', function (event) {
            if (event.data.value == true) {
                document.getElementById('doclick').src = "icons/stop.png";
                document.getElementById('status').innerHTML = "Processing..";
                document.getElementById('doclick').innerHTML = "Stop Running";
                started = true;
            } else {
                document.getElementById('doclick').src = "icons/get-ids.png";
                document.getElementById('status').innerHTML = text || "Stopped";
                document.getElementById('doclick').innerHTML = "Start Running";
            }
        });
    }

    kango.addMessageListener('getAll', function (event) {
        if (event.data.from == "extract_elite_content" && event.source.getId() == current_tab_id) {
            switch (event.data.method) {
                case "updateCount":
                {

                    if (typeof count[current_tab_id] === 'undefined')
                        count[current_tab_id] = [];

                    count[current_tab_id][event.data.guid] = event.data.data;
                    updateCount();

                    if (!count[current_tab_id]["stop"]) {
                        count[current_tab_id]["stop"] = {};
                    }
                    if (event.data.stop) {
                        count[current_tab_id]["stop"][event.data.guid] = true;
                        document.getElementById('doclick').src = "icons/get-ids.png";
                        document.getElementById('status').innerHTML = "Finished";
                        document.getElementById('doclick').innerHTML = "Start Running";
                    }
                    else if (!count[current_tab_id]["stop"][event.data.guid]) {
                        count[current_tab_id]["stop"][event.data.guid] = false;
                    }
                    break;
                }
            }
        }
    });

    function updateCount() {
        var total = 0;
        kango.browser.tabs.getCurrent(function (tab) {
            for (var i in count[tab.getId()]) {
                if (i != "stop")
                    total += count[tab.getId()][i];
            }
            if (total > 0) {
                document.getElementById('uidcount').innerHTML = total;
            } else {
                document.getElementById('uidcount').innerHTML = total;
            }
        });

    }

    document.getElementById('doclick').onclick = startScrape;
    document.getElementById('download').onclick = function () {
        kango.browser.tabs.getCurrent(function (tab) {
            tab.dispatchMessage('downloadUID', {dd:  $("#downloadId").is(":checked"), dm : $("#downloadEmail").is(":checked")});
        });
    };
    document.getElementById('clearall').onclick = function () {
        var conf = confirm("Are you sure you want to delete all your Uids?");
        if (conf) {
            kango.browser.tabs.getCurrent(function (tab) {
//            document.getElementById('doclick').click();
                for (var i in count[tab.getId()]) {
                    if (i != "stop")
                        count[tab.getId()][i] = 0;
                }
                tab.dispatchMessage('clearAll');
                kango.addMessageListener('clearAll_response', function (event) {
                    document.getElementById('doclick').src = "icons/get-ids.png";
                    document.getElementById('status').innerHTML = "Stopped";
                    document.getElementById('doclick').innerHTML = "Start Running";
                });
            });
        }

    };
    updateCount();
    kango.browser.tabs.getCurrent(function (tab) {
        tab.dispatchMessage('getStatus');
    });
    kango.addMessageListener('getStatus_response', function (event) {
        if (event.data.value == true) {
            document.getElementById('doclick').src = "icons/stop.png";
            document.getElementById('status').innerHTML = "Processing..";
            document.getElementById('doclick').innerHTML = "Stop Running";
        } else {
            document.getElementById('doclick').src = "icons/get-ids.png";
            document.getElementById('status').innerHTML = "Stopped";
            document.getElementById('doclick').innerHTML = "Start Running";
        }
    });

    $(document).ready(function () {

        var keys = kango.storage.getKeys();
        // default settings
        if(keys.indexOf("downloadEmail") == -1) kango.storage.setItem("downloadEmail", true);
        if(keys.indexOf("allType") == -1) kango.storage.setItem("allType", true);
        if(keys.indexOf("delay") == -1) kango.storage.setItem("delay", 2);
        if(keys.indexOf("maxResults") == -1) kango.storage.setItem("maxResults", 7000);

        if (kango.storage.getItem("downloadId")) {
            $("#downloadId").attr("checked", "checked");
        }else{
            $("#downloadId").removeAttr("checked");
        }
        if (kango.storage.getItem("downloadEmail")) {
            $("#downloadEmail").attr("checked", "checked");
        }else{
            $("#downloadEmail").removeAttr("checked");
        }
        if (kango.storage.getItem("allType")) {
            $("#normal-mode").attr("checked", "checked");
            $("#batch-mode").removeAttr("checked");
            $("#shares-type").attr("disabled", "disabled");
            $("#likes-type").attr("disabled", "disabled");
            $("#comments-type").attr("disabled", "disabled");
        }else{
            $("#batch-mode").attr("checked", "checked");
            $("#normal-mode").removeAttr("checked");
            $("#shares-type").removeAttr("disabled");
            $("#likes-type").removeAttr("disabled");
            $("#comments-type").removeAttr("disabled");
        }
        if (kango.storage.getItem("sharesType")) {
            $("#shares-type").attr("checked", "checked");
        }else{
            $("#shares-type").removeAttr("checked");
        }
        if (kango.storage.getItem("likesType")) {
            $("#likes-type").attr("checked", "checked");
        }else{
            $("#likes-type").removeAttr("checked");
        }
        if (kango.storage.getItem("commentsType")) {
            $("#comments-type").attr("checked", "checked");
        }else{
            $("#comments-type").removeAttr("checked");
        }

        var delay = kango.storage.getItem("delay");
        if (delay !== null ) $("#delay").val(delay);

        var maxResults = kango.storage.getItem("maxResults");
        if (maxResults !== null) $("#max-result").val(maxResults);

        //if (kango.storage.getItem("randomDelay")) {
        //    $("#randomDelay").attr("checked", "checked");
        //}else{
        //    $("#randomDelay").removeAttr("checked");
        //}

        $("#downloadId").click(function () {
            if($(this).is(":checked")){
                kango.storage.setItem("downloadId",true );
                kango.storage.setItem("downloadEmail",false );
            }
        });

        $("#downloadEmail").click(function () {
            if($(this).is(":checked")){
                kango.storage.setItem("downloadId",false );
                kango.storage.setItem("downloadEmail",true );
            }
        });

        $("#normal-mode").click(function () {
            if($(this).is(":checked")){
                kango.storage.setItem("allType", true);
                $("#shares-type").attr("disabled", "disabled");
                $("#likes-type").attr("disabled", "disabled");
                $("#comments-type").attr("disabled", "disabled");
           }
        });

        $("#batch-mode").click(function () {
            if($(this).is(":checked")){
                kango.storage.setItem("allType", false);
                $("#shares-type").removeAttr("disabled");
                $("#likes-type").removeAttr("disabled");
                $("#comments-type").removeAttr("disabled");
            }
        });

        $("#shares-type").click(function () {
            kango.storage.setItem("sharesType",$(this).prop("checked"));
        });

        $("#likes-type").click(function () {
            kango.storage.setItem("likesType",$(this).prop("checked"));
        });

        $("#comments-type").click(function () {
            kango.storage.setItem("commentsType",$(this).prop("checked"));
        });

        $('#delay').keyup(function(){
            var delay = parseInt($(this).val());
            if(isNaN(delay) || delay < 0 || delay > 999) {
                $(this).val('');
                return;
            }
            $(this).val(delay);
            kango.storage.setItem("delay",delay);
        });

        $('#max-result').keyup(function(){
            var maxResults = parseInt($(this).val());
            if(isNaN(maxResults)){
                $(this).val('');
                return;
            }
            $(this).val(maxResults);
            kango.storage.setItem("maxResults",maxResults);
        });

        //$("#randomDelay").click(function () {
        //    kango.storage.setItem("randomDelay", $(this).is(":checked"));
        //});

        $("#notActive>span").click(function () {
            $(".scodeArea").fadeIn();
            $(".head-container").css('-webkit-filter', 'blur(3px)');
        });

        $("#active").click(function () {
            var that = $(this);
            that.text("Activating...");
            var username = $("#userName").val().trim(),
                password = $("#password").val().trim(),
                remember = $("#remember").is(":checked");

            if (username && password) {
                $.ajax({
                    url: scServer,
                    type: "POST",
                    data: {
                        username: username,
                        password: password
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(header.name + ":" + header.code)
                    },
                    success :function(data){
                        if(data == "VALID|PAID"){
                            kango.storage.setItem("active", true);
                            if(remember){
                                kango.storage.setItem("rememberLogin", true);
                                kango.storage.setItem("user", {username :username, password: password });
                            }
                            var activeSuccess = $("<div/>", {
                                "style": "cursor : pointer;" +
                                "font-weight: bold;"
                            }).html("<p></p><p style='text-align: center'>" +
                            "Thank you, active success, click to close this message</p><p></p>")
                                .click(function () {
                                    $(".scodeArea").fadeOut();
                                    $(".head-container").css('-webkit-filter', '');
                                    $(".settings").css('-webkit-filter', '');
                                    $("#notActive").remove();
                                    $("input").removeAttr("disabled");
                                    $("textarea").removeAttr("disabled");
                                });
                            $(".scodeArea").html(activeSuccess);
                        } else if(data == "VALID|FREE" || data=="INVALID"){
                            var activeSuccess = $("<div/>", {
                                "style": "cursor : pointer;" +
                                "font-weight: bold;"
                            }).html("<p></p><p style='text-align: center'>" +
                            "Thanks for trying, click to close this message</p><p></p>")
                                .click(function () {
                                    $(".scodeArea").fadeOut();
                                    $(".head-container").css('-webkit-filter', '');
                                    $(".settings").css('-webkit-filter', '');
                                    //$("#notActive").remove();
                                    $("input").removeAttr("disabled");
                                    $("textarea").removeAttr("disabled");
                                });
                            $(".scodeArea").html(activeSuccess);
                        }else{
                            alert("Activation error. please contact us");
                            that.text("Active");
                        }

                    }, error :function(){
                        alert("Can not connect to the server, please try again.");
                        that.text("Active");
                    }
                });
            } else {
                alert("Please input your user name and password");
                that.text("Active");
            }
        });
        $("#cancel").click(function () {
            $(".scodeArea").fadeOut();
            $(".head-container").css('-webkit-filter', '');
            $(".settings").css('-webkit-filter', '');

        });
    });
});

function da() {
    kango.storage.setItem("active", false);
}
