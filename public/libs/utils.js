

(function (global) {
    const utils = {
        version: '1.0.0',

        // Một số hàm tiện ích
        sayHello(name) {
            console.log(`👋 Hello, ${name}!`);
        },
        isAllEmptyOrNull(obj) {
            return Object.values(obj).every(
                v => v === null || v === "" || v === undefined
            );
        },
        parseData(data, column, max) {
            if (data.length > max || column.length === 0) return data;
            var len = data.length;;
            for (var j = 0; j <= max - len; j++) {
                var obj = {};

                for (var i = 0; i < column.length; i++) {
                    var col = column[i];
                    obj[col.field] = "";
                }
                data.push(obj);
            }
            return data;
        },
        getKeyCode(e) {
            return e.keyCode || e.which;
        },
        getCaret(el) {
            if (!el) return { start: 0, end: 0 };

            // Chỉ hoạt động trên input hoặc textarea
            if (typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
                return {
                    start: el.selectionStart,
                    end: el.selectionEnd
                };
            }

            return { start: 0, end: 0 };
        },
        setCaret(el, start, end) {
            if (!el) return;
            // Chỉ hoạt động trên input hoặc textarea
            if (el.setSelectionRange) {
                el.focus();
                el.setSelectionRange(start, end);
            } else if (el.createTextRange) {
                var range = el.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        },
        getParamUrl(param) {
            let params = new URLSearchParams(document.location.search);
            let val = params.get(param); // is the string "Jonathan"
            return val;
        },
        findRow(data, criteria) {
            var index = -1;
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const values = Object.values(row);
                const isEmpty =
                    Object.keys(row).length === 0 ||
                    values.every(v => v === null || v === "" || v === undefined);

                // Nếu có tiêu chí tìm kiếm
                if (criteria && Object.keys(criteria).length > 0) {
                    const isMatch = Object.entries(criteria).every(
                        ([k, v]) => row[k] === v
                    );
                    if (isMatch) {
                        return { index: i, row };
                    }
                }
                if (isEmpty && index == -1) {
                    index = i;
                }
            }

            return { index: index, row: null };
        },
        appendRow(data, row, criteria) {
            const found = this.findRow(data, criteria);
            if (found.index >= 0) {
                data[found.index] = row;
            } else {
                data.push(row);
            }
        },
        isElement(el) {
            return el ? el.nodeType === 1 : false
        },
        removeCssClass(el, className) {
            let obj = null;
            if (utils.isElement(el)) {
                obj = el;
            } else {
                obj = document.getElementById(el);
            }
            if (!obj) return false;
            const aCtrRequired = obj.querySelectorAll("input[required], textarea[required]");
            for (let i = 0; i < aCtrRequired.length; i++) {
                const control = aCtrRequired[i];
                control.classList.remove(className);
            }
        },
        checkIsValid(el) {
            let obj = null;
            if (utils.isElement(el)) {
                obj = el;
            } else {
                obj = document.getElementById(el);
            }
            if (!obj) return false;

            // Lấy tất cả input + textarea có required
            const aCtrRequired = obj.querySelectorAll("input[required], textarea[required]");
            let check = false;
            let title = "";
            for (let i = 0; i < aCtrRequired.length; i++) {
                const control = aCtrRequired[i];

                // Remove class invalid trước
                control.classList.remove("is-invalid");

                const value = control.value.trim();
                let tmp = control.getAttribute("title");
                title = title + utils.string.isNullOrEmty(tmp) ? "" : tmp + " </br>";

                if (value === "") {
                    check = true;
                    control.classList.add("is-invalid");
                    control.focus();
                }
            }
            if (check) {
                showError(title == "" ? "Vui lòng nhập đủ thông tin!" : title);
                return false;
            }

            return true;
        },
        buildTree(data, idKey = "ma", parentKey = "ma_ct") {
            const map = new Map();
            const roots = [];

            data.forEach(item => {
                map.set(item[idKey], { ...item, children: [] });
            });

            data.forEach(item => {
                const node = map.get(item[idKey]);
                const parentId = item[parentKey];

                if (!parentId) {
                    roots.push(node);
                } else {
                    const parent = map.get(parentId);
                    if (parent) parent.children.push(node);
                }
            });

            return roots;

        },

        // Nhóm hàm toán học
        math: {

            round(value, decimals) {
                return Math.round(value * 10 ** decimals) / 10 ** decimals;
            }
        },

        // Nhóm xử lý convert 
        convert: {
            toInt(val) {
                return parseInt(val);
            },
            toBool(val) {
                switch (val.toString().toLowerCase().trim()) {
                    case "true": case "yes": case "1": return true;
                    case "false": case "no": case "0": case null: return false;
                    default: return undefined;
                }
            },
            toFormatNumber(val, dec = 0, type = "US") {
                if (typeof (val) == "number")
                    val = val.toString();
                if (val == null || val == "") return "";
                var b_moi = "", b_chan = "", b_tp = "", b_dau = "", b_cham = "", b_s, i;
                for (i = 0; i < val.length; i++) {
                    b_s = val.slice(i, i + 1);
                    if (b_s == ".") b_cham = ".";
                    else if (b_s == "-") b_dau = "-";
                    else if ("0123456789".indexOf(b_s) >= 0) {
                        if (b_cham == ".") b_tp = b_tp + b_s;
                        else if (b_chan == "0") b_chan = b_s;
                        else b_chan = b_chan + b_s;
                    }
                }
                if (b_chan.length > 3) {
                    while (b_chan != "") {
                        i = b_chan.length - 3;
                        if (i < 0) i = 0;
                        if (b_moi != "") b_moi = b_chan.slice(i) + "," + b_moi;
                        else b_moi = b_chan.slice(i);
                        if (i == 0) b_chan = ""; else b_chan = b_chan.slice(0, i);
                    }
                }
                else b_moi = b_chan;
                if (dec != null || dec != undefined)
                    if (dec > 0 && b_tp.length > dec) b_tp = b_tp.slice(0, dec);
                b_moi = b_dau + b_moi + b_cham + b_tp;

                if (type == "VNI") {
                    var b_chu1 = b_moi; console.log(b_chu1);
                    b_chu1 = b_chu1.replace('.', 'z'); console.log(b_chu1);
                    while (b_chu1.indexOf(',') >= 0) b_chu1 = b_chu1.replace(',', '.');
                    b_chu1 = b_chu1.replace('z', ',');
                    return b_chu1;
                }
                else
                    return b_moi;
            },

            formatToNumber(val, dec = 0, type = "US") {
                if (typeof (val) == "string") {
                    val = val.replace(/,/g, '');
                    return parseFloat(val).toFixed(dec);
                }
                return val;
            }
        },
        // Nhóm xử lý chuỗi
        string: {
            isJSON(str) {
                try {
                    return (JSON.parse(str) && !!str);
                } catch (e) {
                    return false;
                }
            },
            NVL(str, newval) {
                if (this.isNullOrEmty(str)) return newval;
                else return str;
            },
            deCode(val, condi, valT, valF) {
                if (val == condi)
                    return valT;
                else return valF;
            },

            getError(ndung) {
                var txt = ndung;
                if (ndung.indexOf('loi') >= 0) {
                    var i1 = ndung.indexOf('loi:');
                    var i2 = ndung.indexOf(':loi');

                    if (i1 > 0 && i2 > 0) {
                        txt = ndung.sliceing(i1 + 4, i2);
                    }
                }

                return txt;
            },
            isNullOrEmty(str) {
                if (str == null || str == "" || str == undefined)
                    return true;
                else
                    return false;
            },
            generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0; // random 0..15
                    const v = (c === 'x') ? r : (r & 0x3 | 0x8); // giữ chuẩn v4
                    return v.toString(16);
                });
            },
            formCodeToChar(input) {
                if (input === null || input === undefined) return '';

                // nếu đã là một ký tự string ngắn thì trả về luôn
                if (typeof input === 'string' && input.length === 1) return input;

                // Number -> code point
                if (typeof input === 'number') {
                    return String.fromCodePoint(input);
                }

                if (typeof input === 'string') {
                    var s = input.trim();

                    // HTML entity: &#123; hoặc &#x1F600;
                    if (/^&#\d+;?$/.test(s) || /^&#x[0-9a-fA-F]+;?$/.test(s)) {
                        return htmlEntityToChar(s);
                    }

                    // U+XXXX or 0xXXXX or hex string
                    var mU = s.match(/^U\+([0-9A-Fa-f]+)$/);
                    if (mU) {
                        return String.fromCodePoint(parseInt(mU[1], 16));
                    }
                    var m0x = s.match(/^0x([0-9A-Fa-f]+)$/);
                    if (m0x) {
                        return String.fromCodePoint(parseInt(m0x[1], 16));
                    }

                    // decimal string "65"
                    if (/^\d+$/.test(s)) {
                        return String.fromCodePoint(parseInt(s, 10));
                    }

                    // hex without prefix "1F600"
                    if (/^[0-9A-Fa-f]+$/.test(s) && s.length > 2) {
                        // nếu chuỗi hex dài có khả năng là code point
                        return String.fromCodePoint(parseInt(s, 16));
                    }

                    // fallback: trả về chính string (có thể là multi-char)
                    return s;
                }
            },
            htmlEntityToChar(entity) {
                // an toàn nhất: tạo element DOM (chạy trong browser)
                if (typeof document !== 'undefined') {
                    const el = document.createElement('textarea'); // textarea giữ textContent an toàn
                    // đảm bảo entity kết thúc bằng ; để innerHTML hiểu đúng
                    const normalized = entity.endsWith(';') ? entity : entity + ';';
                    el.innerHTML = normalized;
                    return el.textContent;
                } else {
                    // nếu không có DOM (node.js), xử lý thủ công:
                    var mDec = entity.match(/^&#(\d+);?$/);
                    if (mDec) return String.fromCodePoint(parseInt(mDec[1], 10));
                    var mHex = entity.match(/^&#x([0-9A-Fa-f]+);?$/);
                    if (mHex) return String.fromCodePoint(parseInt(mHex[1], 16));
                    return entity;
                }
            }
        },
        //xử ký date
        date: {
            getCurrentDate() {
                var now = new Date();
                var day = ("0" + now.getDate()).slice(-2);
                var month = ("0" + (now.getMonth() + 1)).slice(-2);
                var today = (day) + "/" + (month) + "/" + now.getFullYear();
                return today;
            },
            getFirstDateOfMonth() {
                var now = new Date();
                var day = "01";
                var month = ("0" + (now.getMonth() + 1)).slice(-2);
                var today = (day) + "/" + (month) + "/" + now.getFullYear();
                return today;
            },

            numberToMonth(val) {
                var value = val.toString();
                let year = value.substring(0, 4);
                let month = value.substring(4, 6);

                return `${month}/${year}`;
            },
            numberToDate(val) {
                if (utils.string.isNullOrEmty(val)) return "";
                var value = val.toString();
                const year = value.substring(0, 4);
                const month = value.substring(4, 6);
                const day = value.substring(6, 8);

                return `${day}/${month}/${year}`;
            },
            dateToNumber(input) {
                if (!input || typeof input !== "string") return "";

                let parts = input.split("/");

                // Lấy ngày, tháng, năm (nếu thiếu thì mặc định)
                let day = parts[0] ? parts[0].padStart(2, "0") : "01";
                let month = parts[1] ? parts[1].padStart(2, "0") : "01";
                let year = parts[2] || new Date().getFullYear().toString();

                // Chuẩn hóa năm (vd: 23 -> 2023)
                if (year.length === 2) {
                    year = "20" + year;
                }

                return `${year}${month}${day}`;
            }
        },
        excel: {
            alignmentLeft: {
                vertical: 'center',
                horizontal: 'left',
                wrapText: '1',
            },
            alignmentCenter: {
                vertical: 'center',
                horizontal: 'center',
                wrapText: '1',
            },
            alignmentRight: {
                vertical: 'center',
                horizontal: 'right',
                wrapText: '1',
            },
            borderCell: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            },
            getFont(fontName = 'Times New Roman', fontSize = 10, italic = false, bold = false) {
                return {
                    sz: fontSize,
                    name: fontName,
                    italic: italic,
                    bold: bold,
                };
            },
            createCellStyle(font, alignment = configExcel.alignmentLeft) {
                return {
                    font: font,
                    alignment: alignment,
                    border: configExcel.borderCell,
                };
            },
            get TIME_NEW_ROMAN() {
                return 'Times New Roman';
            },
            get emptyCell() {
                return {
                    v: '',
                    s: {
                        font: this.getFont(),
                        alignment: this.alignmentCenter,
                        border: this.borderCell,
                    },
                };
            },
        }
    };

    global.utils = utils;
})(typeof window !== 'undefined' ? window : this);


function confirmBox(calbackFunction, question) {
    var msg = 'Mọi dữ liệu liên quan sẽ bị mất. Bạn có chắc chắn xóa bản ghi?';
    if (!utils.string.isNullOrEmty(question)) msg = question;

    var dialog = new BootstrapDialog({
        title: 'CẢNH BÁO',
        message: msg,
        type: BootstrapDialog.TYPE_DANGER,
        closable: true,
        draggable: true,
        closeByBackdrop: false,
        closeByKeyboard: false,
        buttons: [
            {
                label: 'Đóng lại',
                cssClass: 'btn btn-sm btn-success',
                action: function (dialogItself) {
                    calbackFunction(dialogItself, 'NO');
                    dialogItself.close();
                    return true; // Tự động đóng dialog
                }
            },
            {
                label: 'Đồng ý',
                cssClass: 'btn btn-sm btn-danger',
                icon: 'fa fa-floppy',
                action: function (dialogItself) {
                    calbackFunction(dialogItself, 'YES');
                    return false; // Không tự động đóng, để callback xử lý
                }
            }
        ]
    });

    dialog.open();
    return dialog;
}