//valid.js
//유효성 검사를 사용하는 곳이 여러개이므로, 각각 그에 맞춰서 복붙 및 수정을 하게 되면 다른 것과 달라질 가능성이 충분히 있다.
//회원가입, 

//다음에 유효성검사 함수 만들때는 require(필수) 파라미터를 이용하여 이 항목은 필수인지 안필수인지 구분할 수 있도록 할것.

//ajax 함수
function setInfoContentByAjax(url, type = "get", data, callback) {
    var result;
    $.ajax({
        url: url,
        type: type,
        data: data,
        success: function(response) {
            result = response.response;
        },
        error: function(error) {
            result = error.responseJSON;
            console.error(error);
        },
        complete: function() {
            if (typeof callback === "function") {
                callback(result);
            }
        },
    });
}

function studentid_valid(student_id, options = { require: true }) {
    var studentid_value = student_id.val();
    if (options.require == true && (studentid_value == "" || studentid_value == undefined)) {
        student_id.siblings(".invalid-feedback").text("필수입력값입니다.");
        student_id.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
}

function id_check(id, url) {
    console.log(id);
    var id_value = id.val();
    setInfoContentByAjax(url + id_value, "get", undefined, function(result) {
        console.log(result);
        if (result.resultCode == 0) { //뭔가 문제있을때
            id.removeClass("is-valid").addClass("is-invalid");
            id.siblings(".invalid-feedback").text(result.message);
            return false;
        }
        else {
            id.removeClass("is-invalid").addClass("is-valid");
            id.siblings(".valid-feedback").text(result.message);
            return true;
        }
    });
}

function id_valid(id, options = { require: true, id_check: true }) {
    var reg = /^[0-9a-zA-Z_]+$/;
    var id_value = id.val();
    if (options.require == true && (id_value == "" || id_value == undefined)) {
        id.siblings(".invalid-feedback").text("필수입력값입니다.");
        id.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    if (id_value.length >= 5 && id_value.length <= 15) {
        if (reg.test(id_value)) {
            if (options.id_check == true) {
                return id_check(id, "./check/");
            } else {
                return true;
            }
            //id.siblings(".valid-feedback").text("이 아이디를 사용하셔도 됩니다.");
            //id.removeClass("is-invalid").addClass("is-valid");
            //return true;
        }
        else {
            id.siblings(".invalid-feedback").text("아이디 형식에 맞지 않습니다.");
            id.removeClass("is-valid").addClass("is-invalid");
        }
    }
    else if (id_value.length < 6) {
        id.siblings(".invalid-feedback").text("5자리 이상 사용가능합니다");
        id.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else if (id_value.length > 15) {
        id.siblings(".invalid-feedback").text("15자리 까지 사용가능합니다");
        id.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
}

function email_valid(email, options = { require: true, specificemail: undefined }) {
    var email_value = email.val();
    
    if (options.require == true && (email_value == "" || email_value == undefined)) {
        email.siblings(".invalid-feedback").text("필수입력값입니다.");
        email.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    if (options.specificemail != undefined) {
        //특정 이메일만 허용할 수 있도록 막는 과정이 필요함
        //방법은 많음, 정규식, indexOf()
        //var exp = 
    }
    
    if (!/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i.test(email_value)) {
        email.siblings(".invalid-feedback").text("이메일 형식이 올바르지 않습니다.");
        email.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else {
        email.removeClass("is-invalid").addClass("is-valid");
        return true;
    }
}

function password_valid(password, options = { require: true }) {
    var password_value = password.val();
    if (options.require == true && (password_value == "" || password_value == undefined)) {
        password.siblings(".invalid-feedback").text("필수입력값입니다.");
        password.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    if (password_value != "") {
        if (password_value.length >= 8 && password_value.length <= 20) {
            if (/\s/.test(password_value)) {
                password.siblings(".invalid-feedback").text("비밀번호는 공백없이 입력해야 합니다.");
                password.removeClass("is-valid").addClass("is-invalid");
                return false;
            }
            else if ((/[0-9]/g.test(password_value) + /[a-z]/gi.test(password_value) + /[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi.test(password_value)) < 2) { //true값이 1을 가지기 때문에 가능한 계산
                password.siblings(".invalid-feedback").text("영문, 숫자, 특수문자 중 2가지 이상을 사용해야 합니다.");
                password.removeClass("is-valid").addClass("is-invalid");
                return false;
            }
            else {
                password.removeClass("is-invalid").addClass("is-valid");
                return true;
            }
        }
        else if (password_value.length < 8) {
            password.siblings(".invalid-feedback").text("8자리 이상 입력해야 합니다.");
            password.removeClass("is-valid").addClass("is-invalid");
            return false;
        }
        else if (password_value.length > 20) {
            password.siblings(".invalid-feedback").text("최대 20자까지 입력가능합니다.");
            password.removeClass("is-valid").addClass("is-invalid");
            return false;
        }
    }
}

function passwordr_valid(password, passwordr, options = { require: false }) {
    var password_value = password.val();
    var passwordr_value = passwordr.val();
    if (options.require == true && (passwordr_value == "" || passwordr_value == undefined)) {
        password.siblings(".invalid-feedback").text("필수입력값입니다.");
        password.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    
    if (password_value != passwordr_value) {
        passwordr.siblings(".invalid-feedback").text("비밀번호가 서로 일치하지 않습니다");
        passwordr.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else if (password_value == "") {
        passwordr.siblings(".invalid-feedback").text("비밀번호 항목이 비어있습니다.");
        passwordr.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else {
        passwordr.removeClass("is-invalid").addClass("is-valid");
        return true;
    }
}

function passwordo_valid(passwordo, options = { require: true }) {
    var passwordo_value = passwordo.val();
    if (options.require == true && (passwordo_value == "" || passwordo_value == undefined)) {
        passwordo.siblings(".invalid-feedback").text("필수입력값입니다.");
        passwordo.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    /*if (passwordo_value == "") {
        passwordo.siblings(".invalid-feedback").text("이전 비밀번호를 입력해야 합니다");
        passwordo.removeClass("is-valid").addClass("is-invalid");
        return false;
    }*/
}

function nickname_valid(nickname, options = { require: true }) {
    var nickname_value = nickname.val();
    if (options.require == true && (nickname_value == "" || nickname_value == undefined)) {
        nickname.siblings(".invalid-feedback").text("필수입력값입니다.");
        nickname.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    if (nickname_value.length >= 2 && nickname_value.length <= 15) {
        if (/\s/.test(nickname_value)) {
            nickname.siblings(".invalid-feedback").text("닉네임은 공백없이 입력해야 합니다.");
            nickname.removeClass("is-valid").addClass("is-invalid");
            return false;
        }
        else {
            nickname.removeClass("is-invalid").addClass("is-valid");
            return true;
        }
    }
    else if (nickname_value.length < 2) {
        nickname.siblings(".invalid-feedback").text("2자리 이상 입력해야 합니다.");
        nickname.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else if (nickname_value.length > 15) {
        nickname.siblings(".invalid-feedback").text("최대 15자까지 입력가능합니다.");
        nickname.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
}

function pwfinda_valid(pwfinda) {
    var pwfinda_value = pwfinda.val();
    if ($("#pwfind_select option:selected").val() == ("" || undefined || null)) {
        pwfinda.siblings(".invalid-feedback").text("비밀번호 찾기 질문이 정해지지 않았습니다.");
        pwfinda.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else if (pwfinda_value == "") {
        pwfinda.siblings(".invalid-feedback").text("비밀번호 찾기 답을 입력하셔야 합니다.");
        pwfinda.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    else {
        pwfinda.removeClass("is-invalid").addClass("is-valid");
        return true;
    }
}

function boardtitle_valid(title, options = { require: true }) {
    var title_value = title.val();
    if (options.require == true && (title_value == "" || title_value == undefined)) {
        title.siblings(".invalid-feedback").text("필수입력값입니다.");
        title.removeClass("is-valid").addClass("is-invalid");
        return false;
    } else {
        return true;
    }
}

function boardcontent_valid(content, options = { require: true }) {
    var content_value = content.val();
    if (options.require == true && (content_value == "" || content_value == undefined)) {
        content.siblings(".invalid-feedback").text("필수입력값입니다.");
        content.removeClass("is-valid").addClass("is-invalid");
        return false;
    } else {
        return true;
    }
}

function viewKorean(num) { var hanA = new Array("","일","이","삼","사","오","육","칠","팔","구","십"); var danA = new Array("","십","백","천","","십","백","천","","십","백","천","","십","백","천"); var result = ""; for(i=0; i<num.length; i++) { str = ""; han = hanA[num.charAt(num.length-(i+1))]; if(han != "") str += han+danA[i]; if(i == 4) str += "만"; if(i == 8) str += "억"; if(i == 12) str += "조"; result = str + result; } if(num != 0) result = result + "원"; return result ; }


function price_valid(price, options = { require: true, toKorean: false }) {
    var price_value = price.val();
    /*if(options.toKorean == true) {
        viewKorean(price);
    }*/
    if (options.require == true && (price_value == "" || price_value == undefined)) {
        price.siblings(".invalid-feedback").text("필수입력값입니다.");
        price.removeClass("is-valid").addClass("is-invalid");
        return false;
    } else {
        return true;
    }
}
var file;
$("#img_uploader").change(function(e) {
    var img_uploader = $(this);
    var myFile = $(this).prop('files');
    file = myFile[0];
    const image_type = ['image/gif', 'image/jpeg', 'image/png'];

    if (file.size >= 1024 * 1024 * 5) {
        img_uploader.siblings(".invalid-feedback").text("5MB이상인 파일은 업로드 할 수 없습니다.");
        img_uploader.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
    if (image_type.includes(file.type)) {
        image_preview(file);
        img_uploader.removeClass("is-invalid").addClass("is-valid");
        return true;
    }
    else {
        img_uploader.siblings(".invalid-feedback").text("이미지 파일만 업로드 할 수 있습니다.");
        img_uploader.removeClass("is-valid").addClass("is-invalid");
        return false;
    }
})
var img_url = undefined;

function image_preview(file) {
    var reader = new FileReader();
    reader.onload = (function(f) {
        return function(e) {
            img_url = e.target.result;
            var $div = $('<div class="thumb"><div class="close">X</div><img src="' + img_url + '" title="' + escape(f.name) + '" style="height:80px;width:auto;" class="rounded-circle"></div>');
            $("#thumbnails").html($div);
            f.target = $div;
        };
    })(file);
    reader.readAsDataURL(file);
}
$("#thumbnails").on("click", ".close", function(e) {
    var $target = $(e.target);
    file.upload = 'disable';
    $target.parent().remove();
});

function pwfindc_valid(pwfindc, require = true) {
    var pwfindc_input = $("#pwfindc_input");
    if ($("#pwfind_select").val() == "4" && require == true) { //이때만 유효성 검사
        if (pwfindc == "") {
            pwfindc_input.siblings(".invalid-feedback").text("비밀번호 찾기 질문이 정해지지 않았습니다.");
            pwfindc_input.removeClass("is-valid").addClass("is-invalid");
            return false;
        }
        else {
            pwfindc_input.removeClass("is-invalid").addClass("is-valid");
            return true;
        }
    }
    else {
        return true;
    }
}

function findUser(data, callback) {
    var i;
    for (i = 0; i < user_info.length; i++) {
        if (data == user_info[i]) {
            break;
        }
    }
    if (i > user_info.length) {
        i = undefined;
    }
    if (typeof callback === 'function') {
        callback(i);
    }
    return undefined;
}

function findUserById(data, callback) {
    var i;
    for (i = 0; i < user_info.length; i++) {
        if ((typeof data == "object" ? datadata.val() : data) == user_info[i].id) {
            break;
        }
    }
    if (i >= user_info.length) {
        i = undefined;
    }
    if (typeof callback === 'function') {
        callback(i);
    }
    return undefined;
}
