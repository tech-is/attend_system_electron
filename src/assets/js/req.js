let inputString = '';
// let studentID = null;
const STORAGE_KEY = 'techis';
const tableElem = document.getElementById('tbody');
const KEYOBJ = {
    48: 0,
    49: 1,
    50: 2,
    51: 3,
    52: 4,
    53: 5,
    54: 6,
    55: 7,
    56: 8,
    57: 9
};
const logObj = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');

function onPress() {
    let key = event.keyCode;
    if (key === 13) {
        // console.log(inputString);
        let name = null;
        let studentId = null;
        let barcode = Number(inputString);
        inputString = '';
        if (barcode > 0) {
            getStudent(barcode)
                .then(json => {
                    name = json.Name.value;
                    studentId = json.$id.value;
                    return get_kintone_record(studentId);
                })
                .then(recordID => {
                    if (recordID > 0) {
                        update_kintone_record(recordID).then(() => {
                            logObj.unshift({
                                'name': name,
                                'created_at': getNowDatetime(),
                                'status': '退席済'
                            })
                            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logObj));
                            // localStorage.setItem(STORAGE_KEY, JSON.stringify(logObj));
                            generateRow(tableElem);
                            SuccessAlert(name);
                        });
                    } else {
                        insert_kintone_record(studentId).then(() => {
                            logObj.unshift({
                                'name': name,
                                'created_at': getNowDatetime(),
                                'status': '出席中'
                            })
                            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logObj));
                            // localStorage.setItem(STORAGE_KEY, JSON.stringify(logObj));
                            generateRow(tableElem);
                            SuccessAlert(name, true);
                        });
                    }
                })
                .catch(function (err) {
                    console.log(err);
                    errorAlert(err);
                })
        } else {
            errorAlert('バーコードが入力されていません');
        }
    } else {
        key in KEYOBJ ? inputString += KEYOBJ[key] : false;
    }
}

function generateRow() {
    let tbody = '';
    let logs = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
    if (logs.length > 0) {
        logs.forEach(function (value, index) {
            if (tbody == '') {
                tbody = `<tr><td>${value.name}</td><td>${value.created_at}</td><td>${value.status}</td></tr>`;
            } else {
                tbody += `<tr><td>${value.name}</td><td>${value.created_at}</td><td>${value.status}</td></tr>`;
            }
        })
        tableElem.innerHTML = tbody;
        return true;
    } else {
        return false;
    }
}

function SuccessAlert(name, status = false) {
    Swal.fire({
        icon: 'success',
        title: name + 'さん',
        text: status ? 'ようこそ！' : 'お疲れ様でした！',
        timer: 2500,
        showConfirmButton: false
    })
}

function errorAlert(text) {
    Swal.fire({
        icon: 'error',
        title: 'エラー',
        text: text,
        timer: 2500,
        showConfirmButton: false
    })
}

function getNowYMD(day = 0) {
    let dt = new Date();
    day > 0 ? dt.setDate(dt.getDate() + 1) : false;
    let y = dt.getFullYear();
    let m = ("00" + (dt.getMonth() + 1)).slice(-2);
    let d = ("00" + (dt.getDate())).slice(-2);
    let time = 'T00:00:00' + '\+0900';
    return y + '-' + m + '-' + d + time;
}

function getNowDatetime() {
    let dt = new Date();
    let y = dt.getFullYear();
    let m = ("00" + (dt.getMonth() + 1)).slice(-2);
    let d = ("00" + (dt.getDate())).slice(-2);
    let h = ("00" + dt.getHours()).slice(-2);
    let i = ("00" + dt.getMinutes()).slice(-2);
    let s = ("00" + dt.getSeconds()).slice(-2);
    let time = 'T' + h + ':' + i + ':' + s + '\+0900';
    return y + '-' + m + '-' + d + time;
}

function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

async function getStudent(barcode) {
    let url = APICONF.student.url
    // let conf = APICONF.GET
    let params = `?app=${APICONF.student.app}&query=${encodeURIComponent("barcode=\"" + barcode + "\"")}&fields[0]=${encodeURIComponent('$id')}&fields[1]=${encodeURIComponent('Name')}&totalCount=true`
    let req = url + params;
    let response = await fetch(req, {
        headers: {
            'X-Cybozu-API-Token': APICONF.token
        }
    })
    if (await response.ok) {
        let json = await response.json();
        if (json.totalCount === '1') {
            return json['records'][0];
        } else {
            throw new Error('バーコードが存在しません');
        }
    } else {
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
}

async function get_kintone_record(id) {
    let url = APICONF.GET.url
    let now = getNowYMD();
    let nextday = getNowYMD(1);
    let params = `?app=${APICONF.GET.app}&query=${encodeURIComponent("student_id = \"" + Number(id) + "\" and attend_at > \"" + now + "\" and attend_at < \"" + nextday + "\" and attend_status in (\"出席中\")")}
                &fields[0]=record_id&totalCount=true`
    let response = await fetch(url + params, {
        headers: {
            'X-Cybozu-API-Token': APICONF.token
        }
    })
    if (await response.ok) {
        let json = await response.json();
        return json.totalCount === '1' ? Number(json['records'][0]['record_id']['value']) : -1;
    } else {
        // throw new Error(`Request failed: ${response.status}`);
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
}

async function insert_kintone_record(id) {
    let url = APICONF.POST.url
    let now = getNowDatetime();
    let data = {
        "app": APICONF.POST.app,
        "record": {
            "student_id": {
                "value": id
            },
            "attend_at": {
                "value": now
            },
            "attend_status": {
                "value": "出席中"
            }
        }
    }
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Cybozu-API-Token': APICONF.token
        },
        body: JSON.stringify(data),
    })
    if (await response.ok) {
        return true;
    } else {
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
}

async function update_kintone_record(id) {
    let url = APICONF.PUT.url
    let now = getNowDatetime();
    let data = {
        "app": APICONF.PUT.app,
        "id": id,
        "record": {
            "left_at": {
                "value": now
            },
            "attend_status": {
                "value": "退席済"
            }
        }
    }
    let header = APICONF.token;
    header['Content-Type'] = 'application/json';
    let response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Cybozu-API-Token': APICONF.token
        },
        body: JSON.stringify(data),
    })
    if (await response.ok) {
        return true;
    } else {
        // throw new Error(`Request failed: ${response.status}`);
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
}
