// ==UserScript==
// @all-frames true
// @require js/libs/jquery-2.0.3.min.js
// ==/UserScript==
var uleadPro = {
    guid: guid(),
    started: false,
    uids: [],
    emails: [],
    proc: false,
    cleared: false,
    pageType: 1, //1:search page, 2: post page, 3: share page, 4 group, 5: comments
    isBatchStarted: false,
    breakBatch: false,
    delay: 2,
    maxResults: 7000
};
var beforeLocation = window.location.toString();

var downloadId, downloadEmail, randomDelay;


kango.addMessageListener('startScrape', function (event) {
    scrollToggle(function(){
        event.source.dispatchMessage('startScrape_response', {value: uleadPro.started || uleadPro.isBatchStarted});
    });
});
kango.addMessageListener('clearAll', function (event) {
    uleadPro.uids.length = 0;
    uleadPro.emails.length = 0;
    uleadPro.cleared = true;
    uleadPro.started = true;
    scrollToggle(function(){
        event.source.dispatchMessage('clearAll_response', {value: uleadPro.cleared});
    });
});
kango.addMessageListener('getStatus', function (event) {
    event.source.dispatchMessage('getStatus_response', {value: uleadPro.started || uleadPro.isBatchStarted});
});
kango.addMessageListener('downloadUID', function (event) {
    // send data back to content script
    kango.invokeAsync('kango.storage.getItem', 'active', function (data) {
        if (uleadPro.uids.length > 0 || uleadPro.emails.length > 0) {
            if (event.data.dd) {
                var dllink = document.createElement('a');
                var new_list = [];
                for (var i = 0, uidLen = uleadPro.uids.length; i < uidLen; i++) {
                    if (!(!uleadPro.uids[i] && uleadPro.uids[i].replace(/\t|\n|\r|\f/g, "") == "" || new_list.indexOf(uleadPro.uids[i]) !== -1)) {
                        new_list.push(uleadPro.uids[i].match(/^\d+/));
                    }
                }
                // if (!data) {
                //     new_list = new_list.slice(0, 100);
                // }
            }

            if (event.data.dm) {
                var demail = document.createElement('a');
                var email_list = [];
                for (var j = 0, emailLen = uleadPro.emails.length; j < emailLen; j++) {
                    if (email_list.indexOf(uleadPro.emails[j]) === -1) {
                        email_list.push(uleadPro.emails[j]);
                    }
                }
                // if (!data) {
                //     email_list = email_list.slice(0, 100);

                // }
            }

            if (new_list) {
                var fileName = document.getElementsByClassName("uiTypeahead")[0].innerText.trim() + "_id";
                dllink.setAttribute('href', encodeURI('data:text/plain;charset=utf-8,' + new_list.join('\r\n')));
                dllink.setAttribute('download', fileName + '.txt');
                document.body.appendChild(dllink);
                dllink.click();
                document.body.removeChild(dllink);
            }
            if (email_list) {
                var emailFileName = document.getElementsByClassName("uiTypeahead")[0].innerText.trim() + "_email";
                demail.setAttribute('href', encodeURI('data:text/plain;charset=utf-8,' + email_list.join('\r\n')));
                demail.setAttribute('download', emailFileName + '.txt');
                document.body.appendChild(demail);
                demail.click();
                document.body.removeChild(demail);
            }
        }
    });
});

function getUID(pageType, res, downloadId, downloadEmail) {
    //console.log("getUID");
    var resLen = res.length;
    if (resLen === 0) return;
    if (downloadId && uleadPro.uids.length < uleadPro.maxResults) {
        if (pageType == 2) {
            for (var i = 0; i < resLen; i++) {
                var linkData = res[i].getAttribute("data-gt");
                if (linkData !== null) {
                    var user = JSON.parse(linkData).engagement;
                    if (user && user["eng_tid"]) {
                        uleadPro.uids.push(user["eng_tid"].toString());
                        if(uleadPro.uids.length >= uleadPro.maxResults) {
                            stopScrape();
                            break;
                        }
                    }
                }
                res[i].setAttribute("momane_dd", "1");
            }
        } else if (pageType == 1) {
            for (var m = 0; m < resLen; m++) {
                var userM = JSON.parse(res[m].getAttribute("data-bt"));
                if (userM && userM["id"]) {
                    uleadPro.uids.push(userM["id"].toString());
                }
                res[m].setAttribute("momane_dd", "1");
                if(uleadPro.uids.length >= uleadPro.maxResults) {
                    stopScrape();
                    break;
                }
            }
        } else {
            for (var mm = 0; mm < resLen; mm++) {
                var userMM = res[mm].getAttribute("data-hovercard").match(/\?id=(\d+)/);
                if (userMM && userMM.length > 1) {
                    uleadPro.uids.push(userMM[1]);
                }
                res[mm].setAttribute("momane_dd", "1");
                if(uleadPro.uids.length >= uleadPro.maxResults) {
                    stopScrape();
                    break;
                }
            }
        }
    }
    if (downloadEmail && uleadPro.emails.length < uleadPro.maxResults) {
        if (pageType === 1) {
            for (var j = 0; j < resLen; j++) {
                var link = res[j].querySelectorAll("a")[0].getAttribute("href"), email = link.replace(/.*facebook.com\//, "").replace(/\?.*/g, "") + "@facebook.com";
                if (email && email.indexOf("file.php") === -1 && email.indexOf('pages/') !== 0) {
                    uleadPro.emails.push(email);
                }
                res[j].setAttribute("momane_dd", "1");
                if(uleadPro.emails.length >= uleadPro.maxResults) {
                    stopScrape();
                    break;
                }
            }
        } else {
            for (var k = 0; k < resLen; k++) {
                var link2 = res[k].getAttribute("href");
                var email2 = link2.replace(/.*facebook.com\//, "").replace(/\?.*/g, "") + "@facebook.com";
                if (email2 && email2.indexOf("file.php") === -1 && email2.indexOf('pages/') !== 0) {
                    uleadPro.emails.push(email2);
                }
                res[k].setAttribute("momane_dd", "1");

                if(uleadPro.emails.length >= uleadPro.maxResults) {
                    stopScrape();
                    break;
                }
            }
        }
    }
}
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function scrollWindow(){
    window.scrollTo(0,document.body.scrollHeight);
}

function closePopups() {
    //console.log('close popups');
    var closeButtons = document.querySelectorAll('a[role=button][title=Close]');
    for (var i = 0; i < closeButtons.length; i++) {
        closeButtons[i].click(); // Close popup
    }
}

function scrapePopups(sharesType, likesType, commentsType){
    var shares = [];
    var likes = [];

    if (sharesType) {
        var sharesCollection = document.querySelectorAll('.UFIShareLink:not([momane_dd="1"])');
        shares = [].slice.call(sharesCollection);
    }
    if (likesType){
        var likesCollection = document.querySelectorAll('.UFINoWrap:not([momane_dd="1"])');
        likes = [].slice.call(likesCollection);
    }
    var itemsToProcess = shares.concat(likes);
    // console.log('itemsToProcess: ' + itemsToProcess.length);

    function waitForPage(callback) {
        // console.log('waitForPage');
        if (getPageType() != -1) return callback();
        setTimeout(function () {
            waitForPage(callback);
        }, 100);
    }

    function waitForEndOfPage(callback) {
        //console.log('waitForEndOfPage');
        if (isScrollingFinished() || uleadPro.breakBatch) return callback();
        setTimeout(function () {
            waitForEndOfPage(callback);
        }, 1000);
    }

    function waitForClosePopup(callback) {
        // console.log('waitForClosePopup');
        if (getPageType() === -1 || getPageType() === 1) return callback();
        setTimeout(function(){
            waitForClosePopup(callback);
        }, 100);
    }

    function async(arg, callback) {
        arg.click(); // Open popup
        waitForPage(function () {
            startScrap('shares');
            waitForEndOfPage(function() {
                var delayMs = Math.max(1000, uleadPro.delay*1000);
                setTimeout(function() {
                    // console.log('EndOfPage');
                    clearInterval(uleadPro.proc);
                    closePopups();
                    arg.setAttribute("momane_dd", "1");
                    waitForClosePopup(function() {
                        callback();
                    });
                }, delayMs);
            });
        });
    }

    function final() {
        //console.log('final');

        function scrollPage(){
            uleadPro.pageType = getPageType();
            if (isScrollingFinished() || uleadPro.breakBatch) {
                //console.log('break');
                uleadPro.isBatchStarted = false;
                stopScrape();
                return;
            }
            scrollWindow();
            // console.log('scroll');
            setTimeout(function() {
                scrapePopups(sharesType, likesType, commentsType);
            }, 500);
        }

        if (commentsType){
            openComments(function(){
                // console.log('comments are opened');
                scrollPage();
            });
        } else {
            scrollPage();
        }
    }

    function series(item) {
        if (uleadPro.breakBatch) return closePopups();
        if (item) {
            async(item, function () {
                // console.log('next');
                return series(itemsToProcess.shift());
            });
        } else {
            return final();
        }
    }
    series(itemsToProcess.shift());
}

function openComments(callback){
    startScrap('comments');
    var comments = document.querySelectorAll('.UFIPagerLink');
    if (comments.length == 0 || uleadPro.breakBatch) return callback();
    //console.log('comments: ' + comments.length);
    comments[0].click(); // Open comment
    setTimeout(function(){
        openComments(callback);
    }, Math.max(1000, uleadPro.delay*1000));
}

function stopScrape(){
    clearInterval(uleadPro.proc);
    uleadPro.proc = false;
    uleadPro.started = false;
    sameValueCount = 0;
    oldCount = 0;
    if (uleadPro.isBatchStarted) uleadPro.breakBatch = true;
    uleadPro.isBatchStarted = false;
}

function scrollToggle(callback) {
    //console.log("locate the script");
    if (uleadPro.started) {
        stopScrape();
        return callback();
    }
    kango.invokeAsync('kango.storage.getItem', 'allType', function (allType) {
        kango.invokeAsync('kango.storage.getItem', 'sharesType', function (sharesType) {
            kango.invokeAsync('kango.storage.getItem', 'likesType', function (likesType) {
                kango.invokeAsync('kango.storage.getItem', 'commentsType', function (commentsType) {
                    kango.invokeAsync('kango.storage.getItem', 'delay', function (delay) {
                        kango.invokeAsync('kango.storage.getItem', 'maxResults', function (maxResults) {

                            uleadPro.maxResults = maxResults;

                            if(allType){
                                startScrap('all');
                            }

                            if(!allType && (sharesType || likesType || commentsType)){
                                uleadPro.delay = delay;
                                uleadPro.breakBatch = false;
                                uleadPro.isBatchStarted = true;
                                uleadPro.started = true;
                                scrapePopups(sharesType, likesType, commentsType);
                            }

                            return callback();
                        });
                    });
                });
            });
        });
    });
}

function startScrap(downloadType){
    var pageType = getPageType();
    if (pageType === -1 && downloadType === 'all') {
        alert("no profiles can be scraped");
    } else if (downloadType === 'comments'){
        uleadPro.pageType = 5;
    } else {
        uleadPro.pageType = pageType;
    }

    // console.log('page type: ' + uleadPro.pageType);
    sameValueCount = 0;
    oldCount = 0;

    function innerProcessing() {
        if (uleadPro.pageType === 1 || uleadPro.pageType === 3) { //for search and shares pages
            window.scrollBy(0, 500);
            // console.log('inner scroll');
        } else {
            var seeMoreLink = $("a.uiMorePagerPrimary[href^='/']");
            if (seeMoreLink.length > 0) {
                seeMoreLink[0].click();
            }
        }

        var res = [];
        if (uleadPro.pageType == 1) {
            res = document.querySelectorAll('#initial_browse_result div[data-bt*="{\\"id"]:not([momane_dd="1"])');
        } else if (uleadPro.pageType == 2) {
            res = document.querySelectorAll('.uiScrollableAreaContent div.fwb a:not([momane_dd="1"])');
        } else if (uleadPro.pageType == 3) {
            res = document.querySelectorAll('#repost_view_dialog .clearfix a[aria-hidden]:not([momane_dd="1"])');
        } else if (uleadPro.pageType == 4) {
            res = document.querySelectorAll('.fbProfileBrowserListContainer div.fwb a:not([momane_dd="1"])');
        } else if (uleadPro.pageType == 5) {
            res = document.querySelectorAll('.UFICommentActorName:not([momane_dd="1"])');
        }

        kango.invokeAsync('kango.storage.getItem', 'downloadId', function (ifDId) {
            downloadId = ifDId;
            kango.invokeAsync('kango.storage.getItem', 'downloadEmail', function (ifdmail) {
                downloadEmail = ifdmail;
                getUID(uleadPro.pageType, res, ifDId, ifdmail);
            });
        });

        // don't click links in batch mode
        if (uleadPro.isBatchStarted) return;

        var guestsDialogCheck = document.querySelectorAll(".profileBrowserDialog > div > div > div > div > div:nth-of-type(1) > div > div:nth-of-type(1)")[0];
        var elms3 = document.querySelectorAll('.profileBrowserDialog a[class*="uiMorePagerPrimary"]'); //See more links
        if (typeof guestsDialogCheck !== 'undefined') {
            for (var i = 0; i < elms3.length; i++) {
                var link = elms3[i];
                link.click();
            }
        } else {
            // Click Links
            var elms = document.querySelectorAll('a[class="UFIPagerLink"]'); //Comments
            for (var i = 0; i < elms.length; i++) {
                var link = elms[i];
                link.click();
            }
            var elms2 = document.querySelectorAll('a[class*="fbFeedbackPagerLink"]');
            for (var i = 0; i < elms2.length; i++) {
                var link = elms2[i];
                link.click();
            }
        }
    }

    uleadPro.started = true;
    innerProcessing();
    if (uleadPro.pageType !== 5) // no need to scroll comments
        uleadPro.proc = setInterval(innerProcessing, 500);
}

function getPageType() {
    var searchSel = document.querySelectorAll('#initial_browse_result div[data-bt*="{\\"id"]');
    if (searchSel.length > 0) return 1;
        searchSel = document.querySelectorAll(".uiScrollableAreaContent .uiProfileBlockContent a");
        if (searchSel.length > 0) return 2;
        searchSel = document.querySelectorAll('#repost_view_dialog .clearfix a[aria-hidden]');
        if (searchSel.length > 0) return 3;
        searchSel = document.querySelectorAll(".fbProfileBrowserListContainer div.fwb a");
        if (searchSel.length > 0) return 4;
        return -1;
}

function resetPage() {
    // console.log('Reset Page...');
    if (uleadPro.started) {
        clearInterval(uleadPro.proc);
        uleadPro.proc = false;
        uleadPro.started = false;
    }
    if (uleadPro.isBatchStarted){
        uleadPro.breakBatch = true;
        uleadPro.isBatchStarted = false;
    }
    uleadPro.uids = [];
    sameValueCount = 0;
    oldCount = 0;
}

function getCountResults(){
    return (downloadEmail) ? uleadPro.emails.length : uleadPro.uids.length;
}

var sameValueCount = 0;
var oldCount = 0;
if (window.location.hostname === "www.facebook.com") {
    setInterval(function () {
        //console.log('count: ' + (uleadPro.uids.length || uleadPro.emails.length));
        if((!uleadPro.isBatchStarted && isScrollingFinished()) || uleadPro.breakBatch){
            setTimeout(function(){
                clearInterval(uleadPro.proc);
            }, 1000);

            var data = {
                from: 'extract_elite_content',
                method: "updateCount",
                guid: uleadPro.guid,
                data: uleadPro.uids.length || uleadPro.emails.length,
                started: uleadPro.started || uleadPro.isBatchStarted,
                stop: true
            };
            //console.log('stop: true');
            kango.dispatchMessage('getAll', data);
            return;
        }

        var data = {
            from: 'extract_elite_content',
            method: "updateCount",
            guid: uleadPro.guid,
            data: uleadPro.uids.length || uleadPro.emails.length,
            started: uleadPro.started || uleadPro.isBatchStarted,
            stop: false
        };
        //console.log('stop: false');
        kango.dispatchMessage('getAll', data);
    }, 800);
}

if (window.location.host.toString() === "www.facebook.com" || window.location.host.toString() === "facebook.com") {
    setInterval(pageChangedListener, 900);
    function pageChangedListener() {
        if (beforeLocation != window.location.toString()) {
            resetPage();
            beforeLocation = window.location.toString();
        }
    }
}

function isScrollingFinished(){
    return (
        (uleadPro.started && document.getElementById("browse_end_of_results_footer") != null )
        || (document.querySelectorAll("#pagelet_group_pager").length > 0 && document.querySelectorAll("#pagelet_group_pager a[role=button]").length === 0)
        || (uleadPro.pageType === 3 && document.querySelectorAll("#pagelet_scrolling_pager .uiMorePagerLoader").length == 0)
        || ((uleadPro.pageType === 2 || uleadPro.pageType === 4) && $("a.uiMorePagerPrimary[href^='/']").length == 0 )
        || getCountResults() >= uleadPro.maxResults);
}

function startsWith(str, needle) {
    return str.slice(0, needle.length) == needle;
}

function sleep() {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > getRandomInt(1, 3) * 1000) {
            break;
        }
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
