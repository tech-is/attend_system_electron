let inputString = '';
const STORAGE_KEY = 'techis';
const TABLE_ELEM = document.getElementById('tbody');
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
KEYCODE_ENTER = 13
const LOGOBJ = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');

function onPress() {
    let key = event.keyCode;
    if (key === KEYCODE_ENTER) {
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
                            LOGOBJ.unshift({
                                'name': name,
                                'created_at': getNowDatetime(),
                                'status': '退席済'
                            })
                            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(LOGOBJ));
                            generateRow(TABLE_ELEM);
                            SuccessAlert(name);
                        });
                    } else {
                        insert_kintone_record(studentId).then(() => {
                            LOGOBJ.unshift({
                                'name': name,
                                'created_at': getNowDatetime(),
                                'status': '出席中'
                            })
                            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(LOGOBJ));
                            generateRow(TABLE_ELEM);
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
        if (key in KEYOBJ) {
            inputString += KEYOBJ[key]
        }
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
        TABLE_ELEM.innerHTML = tbody;
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

function getYMD(add = false) {
    let dt = new Date();
    if (add) {
        dt.setDate(dt.getDate() + 1);
    }
    return dt.toISOString().substr(0, 10);
}

function getNowDatetime() {
    // return new Date().toISOString().substr(0, 19) + 'Z'
    return new Date().toISOString();
}

function createQueryString(obj) {
    let qs = '?';
    let lastkey = Object.keys(obj).pop();
    for (let key in obj) {
        qs += key + '=' + encodeURIComponent(obj[key]) + (lastkey !== key ? '&' : '');
    }
    return qs;
}

async function getStudent(barcode) {
    let url = APICONF.student.url
    let params = createQueryString({
        'app': `${APICONF.student.app}`,
        'query': 'barcode="' + barcode + '"',
        'fields[0]': `$id`,
        'fields[1]': 'Name',
        'totalCount': 'true'
    });
    let req = url + params;
    let response = await fetch(req, {
        headers: {
            'X-Cybozu-API-Token': APICONF.token
        }
    })
    if (await !response.ok) {
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
    let json = await response.json();
    if (json.totalCount !== '1') {
        throw new Error('バーコードが存在しません');
    }
    return json['records'][0];
}

async function get_kintone_record(id) {
    let url = APICONF.GET.url
    let now = getYMD() + 'T00:00:00+0900';
    let nextday = getYMD(true) + 'T00:00:00+0900';
    let params = createQueryString({
        'app': APICONF.GET.app,
        'query': 'student_id =\"' + Number(id) + '\" and attend_at >\"'
            + now + '\" and attend_at < \"' + nextday + '\" and attend_status in ("\出席中\")',
        'fields[0]': 'record_id',
        'totalCount': true
    });
    let response = await fetch(url + params, {
        headers: {
            'X-Cybozu-API-Token': APICONF.token
        }
    })
    if (await !response.ok) {
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
    let json = await response.json();
    return json.totalCount === '1' ? Number(json['records'][0]['record_id']['value']) : -1;
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
    if (await !response.ok) {
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
    return true;
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
    let response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Cybozu-API-Token': APICONF.token
        },
        body: JSON.stringify(data),
    })
    if (await !response.ok) {
        let text = await response.text();
        throw new Error(`Request failed: ${text}`);
    }
    return true;
}
