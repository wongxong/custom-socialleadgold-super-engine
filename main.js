var user = kango.storage.getItem("user");
var header = {
    name: "socialleadg",
    code: "Hfu8Xow2sMv"
};
if (!kango.storage.setItem("rememberLogin")) {
    kango.storage.setItem("rememberLogin", false);
}
if (user) {
    $.ajax({
        url: "http://gold.socialleadgold.com/authenticateg.php",
        type: "POST",
        data: {
            username: user.username,
            password: user.password
        },
        headers: {
            "Authorization": "Basic " + btoa(header.name + ":" + header.code)
        },
        success: function (data) {
            console.log(data);
            if (data != "VALID|PAID") {
                kango.storage.setItem("active", false);
            }
        },
        error: function(){
            kango.storage.setItem("active", false);
        }
    });
}else{
    kango.storage.setItem("active", false);
}
