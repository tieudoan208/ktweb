function TextEditor(args) {
    var input;
    var defaultValue;
    var typeData = args.column.type;
    var editCell = true;
    this.keyCaptureList = [Slick.keyCode.LEFT, Slick.keyCode.RIGHT, Slick.keyCode.ENTER];
    var keyCode = Slick.keyCode, Utils = Slick.Utils;
    var idControl = args.grid.uid + "_" + args.column.field;
    var dec = args.column.dec || 0;
    this.init = function () {
        //debugger; 
        var navOnLR = args.grid.getOptions().editorCellNavOnLRKeys;
        input = Utils.createDomElement("input", { type: "text", className: "form-control form-control-sm", id: idControl }, args.container);
        input.style.marginTop = "-1px";
        input.height = " 27px";
        input.padding = "5px";
        if (typeData == "number" || typeData == "money") {
            input.style.textAlign = "right";
        }
        input.addEventListener("keydown", this.handleKeyDown.bind(this))
    }

    this.destroy = function () {
        input.removeEventListener("keydown", this.handleKeyDown.bind(this))
        input.remove();
    };

    this.handleKeyDown = function (e) {
        var newchar = e.key;
        var keycode = e.keyCode | e.which;
        var position = utils.getCaret(e.target), textLength = e.target.value.length;
        var old = e.target.value;

        switch (keycode) {
            case keyCode.LEFT:
            case keyCode.RIGHT:
                {
                    return;
                }
            case keyCode.ENTER:
                {
                    args.item[args.column.field] = utils.convert.formatToNumber(old, dec);
                    args.grid.navigateNext();
                    e.preventDefault();
                    return;
                }
            case keyCode.DELETE:
                {
                    if (position.start == position.end && position.start < textLength) {
                        position.end = position.end + 1;
                    }
                    if (position.start == textLength)
                        return;
                    if (typeData == "number") {
                        var cur = old.substring(position.start, position.end);
                        if (cur == "," && position.start < old.length)
                            position.end = position.end + 1;
                        var newchar = old.substring(0, position.start) + old.substring(position.end);
                        var newcharNumber = utils.convert.formatToNumber(newchar).toString();
                        var format = utils.convert.toFormatNumber(newcharNumber, dec);
                        e.target.value = format;
                        args.item[args.column.field] = newcharNumber;
                        utils.setCaret(e.target, position.start, position.start);
                        e.preventDefault();
                        return true;
                    }
                }
            case keyCode.BACKSPACE:
                if (position.end <= 0)
                    return;
                if (typeData == "number") {
                    var cur = old.substring(position.start - 1, position.end);
                    if (cur == "," && position.start < old.length)
                        position.start = position.start - 1;
                    var newchar = old.substring(0, position.start - 1) + old.substring(position.end);
                    var newcharNumber = utils.convert.formatToNumber(newchar).toString();
                    var format = utils.convert.toFormatNumber(newcharNumber, dec);
                    e.target.value = format;
                    args.item[args.column.field] = newcharNumber;
                    utils.setCaret(e.target, position.end, position.end);
                    e.preventDefault();
                    return true;
                }
        }


        var dec = parseInt(args.column.dec);

        if (typeData == "number") {
            var check = "0123456789.";

            if (dec > 0)
                check = check + ".";
            if (check.indexOf(newchar) < 0 || (newchar == "0" && old == "0")
                || (newchar == "." && old.indexOf(".") >= 0) || (newchar == "-" && old.indexOf("-") >= 0)) {
                e.preventDefault();
                return false;
            }

            old = old.slice(0, position.start) + newchar + old.substr(position.end);
            newchar = utils.convert.toFormatNumber(old, dec);
            e.target.value = newchar;
            args.item[args.column.field] = old;
            utils.setCaret(e.target, newchar.length, newchar.length);
            e.preventDefault();
        }
        else {
            if (keycode < 32 || e.ctrlKey || e.altKey) {
                return;
            }
            old = old.slice(0, position.start) + newchar + old.substr(position.end);
            e.target.value = old;
            args.item[args.column.field] = old;
            utils.setCaret(e.target, position.start + 1, position.start + 1);
            e.preventDefault();
        }
    }


    this.focus = function () {
        input.focus();
    };

    this.getValue = function () {
        return input.value;
    };

    this.setValue = function (val) {
        input.value = val;
    };

    this.loadValue = function (item) {
        defaultValue = item[args.column.field] || "";
        input.value = defaultValue;
        input.select();
    };

    this.serializeValue = function () {
        return input.value;
    };

    this.applyValue = function (item, state) {
        if (typeData == "number") {
            item[args.column.field] = utils.convert.formatToNumber(state, dec);
        } else
            item[args.column.field] = state;
    };

    this.isValueChanged = function () {
        return (!(input.value === "" && defaultValue == null)) && (input.value != defaultValue);
    };

    this.validate = function () {
        if (args.column.validator) {
            var validationResults = args.column.validator(input.val());
            if (!validationResults.valid) {
                return validationResults;
            }
        }

        return {
            valid: true,
            msg: null
        };
    };

    this.init();
}


function DateEditor(args) {
    var input;
    var hiddenInput;
    var defaultValue;
    var idControl = args.grid.uid + "_" + args.column.field;

    this.keyCaptureList = [Slick.keyCode.LEFT, Slick.keyCode.RIGHT, Slick.keyCode.ENTER];
    var keyCode = Slick.keyCode, Utils = Slick.Utils;

    /**
     * Parse dd/MM/yyyy → Date object
     */
    function parseDate(str) {
        if (!str) return null;
        var parts = str.trim().split("/");
        if (parts.length !== 3) return null;
        var d = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10);
        var y = parseInt(parts[2], 10);
        if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1) return null;
        var date = new Date(y, m - 1, d);
        if (isNaN(date.getTime())) return null;
        return date;
    }

    /**
     * Format Date → dd/MM/yyyy
     */
    function formatDate(date) {
        if (!date || isNaN(date.getTime())) return "";
        var d = ("0" + date.getDate()).slice(-2);
        var m = ("0" + (date.getMonth() + 1)).slice(-2);
        var y = date.getFullYear();
        return d + "/" + m + "/" + y;
    }

    /**
     * Format Date → yyyy-MM-dd (for native input)
     */
    function formatDateISO(date) {
        if (!date || isNaN(date.getTime())) return "";
        var y = date.getFullYear();
        var m = ("0" + (date.getMonth() + 1)).slice(-2);
        var d = ("0" + date.getDate()).slice(-2);
        return y + "-" + m + "-" + d;
    }

    /**
     * Parse yyyy-MM-dd (from hidden native input) → dd/MM/yyyy
     */
    function parseISODate(isoStr) {
        if (!isoStr) return "";
        var date = new Date(isoStr + "T00:00:00");
        if (isNaN(date.getTime())) return "";
        return formatDate(date);
    }

    /**
     * Set caret position
     */
    this.init = function () {
        // Wrapper
        var wrapper = Utils.createDomElement("div", {
            style: "position: relative; display: flex; align-items: center; width: 100%;"
        }, args.container);

        // Hidden native date input (handles browser picker)
        hiddenInput = Utils.createDomElement("input", {
            type: "date",
            id: idControl + "_hidden",
            style: "position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px;"
        }, wrapper);

        // Visible text input (dd/MM/yyyy)
        input = Utils.createDomElement("input", {
            type: "text",
            className: "form-control form-control-sm",
            id: idControl,
            placeholder: "__/__/____",
            maxlength: "10",
            style: "width: 100%; margin-top: -1px; height: 27px; padding: 5px; letter-spacing: 0.5px;"
        }, wrapper);

        // Calendar icon button
        var iconBtn = Utils.createDomElement("button", {
            type: "button",
            id: idControl + "_btn",
            title: "Mở lịch",
            style: "flex-shrink: 0; margin-left: -28px; margin-top: -1px; height: 27px; border: 1px solid #ced4da; background: #f8f9fa; cursor: pointer; padding: 0 6px; border-radius: 0 4px 4px 0; display: flex; align-items: center; z-index: 1;"
        }, wrapper);
        iconBtn.innerHTML = '<i class="fa fa-calendar" style="color:#555;"></i>';

        // Click icon → open native date picker
        iconBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var parsed = parseDate(input.value);
            if (parsed) {
                hiddenInput.value = formatDateISO(parsed);
            } else {
                hiddenInput.value = "";
            }
            hiddenInput.showPicker ? hiddenInput.showPicker() : hiddenInput.click();
        });

        // Hidden input change → update visible text
        hiddenInput.addEventListener("change", function () {
            input.value = parseISODate(hiddenInput.value);
            args.item[args.column.field] = input.value;
        });

        // Keydown — full input.js pattern
        input.addEventListener("keydown", function (e) {
            var newchar = e.key;
            var keycode = e.keyCode | e.which;
            var position = utils.getCaret(e.target);
            var old = e.target.value;

            // Allow modifier keys
            if (e.ctrlKey || e.altKey) {
                if (['c', 'C', 'a', 'A', 'x', 'X', 'v', 'V'].indexOf(newchar) >= 0) {
                    // Let browser handle copy/select/cut/paste
                    setTimeout(function () {
                        var val = e.target.value;
                        args.item[args.column.field] = val;
                    }, 0);
                    return;
                }
                return;
            }

            switch (keycode) {
                case keyCode.LEFT:
                case keyCode.RIGHT:
                case keyCode.HOME:
                case keyCode.END:
                case keyCode.TAB:
                    return; // allow cursor move / tab

                case keyCode.ENTER:
                    args.item[args.column.field] = e.target.value;
                    args.grid.navigateNext();
                    e.preventDefault();
                    return;

                case keyCode.BACKSPACE: {
                    var pos = position.start;
                    // Don't go before start
                    if (pos === 0 && position.start === position.end) {
                        e.preventDefault();
                        return;
                    }
                    // Special: if at position 3 (after first /) or 6 (after second /),
                    // skip the slash
                    if (pos === 3 || (pos === 6 && old.length > 6)) {
                        var newVal = old.substring(0, pos - 1) + old.substring(pos);
                        e.target.value = newVal;
                        args.item[args.column.field] = newVal;
                        utils.setCaret(e.target, pos - 1, pos - 1);
                    } else {
                        var newVal = old.substring(0, position.start - 1) + old.substring(position.end);
                        e.target.value = newVal;
                        args.item[args.column.field] = newVal;
                        utils.setCaret(e.target, position.start - 1, position.start - 1);
                    }
                    e.preventDefault();
                    return;
                }

                case keyCode.DELETE: {
                    var pos = position.start;
                    if (pos === old.length) {
                        e.preventDefault();
                        return;
                    }
                    // Special: if at position 2 (before first /) or 5 (before second /),
                    // skip the slash
                    if (pos === 2 || (pos === 5 && old.length > 5)) {
                        var newVal = old.substring(0, pos) + "_" + old.substring(pos + 1);
                        e.target.value = newVal;
                        args.item[args.column.field] = newVal;
                        utils.setCaret(e.target, pos + 1, pos + 1);
                    } else {
                        var newVal = old.substring(0, position.start) + old.substring(position.end + 1);
                        e.target.value = newVal;
                        args.item[args.column.field] = newVal;
                        utils.setCaret(e.target, position.start, position.start);
                    }
                    e.preventDefault();
                    return;
                }

                default: {
                    // Only allow digits
                    var check = "0123456789";
                    if (check.indexOf(newchar) === -1) {
                        e.preventDefault();
                        return;
                    }
                    // Enforce max 8 digits (10 chars with slashes)
                    var raw = old.replace(/[^0-9]/g, "");
                    if (raw.length >= 8) {
                        e.preventDefault();
                        return;
                    }
                    // Insert "/" if needed at position 2 or 5
                    var charLost = "";
                    var insertPos = position.start;
                    if (insertPos === 2) {
                        charLost = "/";
                        insertPos = 3;
                    } else if (insertPos === 5) {
                        charLost = "/";
                        insertPos = 6;
                    }
                    // Build new value
                    var before = old.substring(0, position.start);
                    var after = old.substring(position.end);
                    var newVal = before + charLost + newchar + after;
                    e.target.value = newVal;
                    args.item[args.column.field] = newVal;
                    // Set caret after the inserted char
                    var caretPos = position.start + charLost.length + 1;
                    utils.setCaret(e.target, caretPos, caretPos);
                    e.preventDefault();
                    return;
                }
            }
        });

        // Paste: strip non-digits and truncate to 8
        input.addEventListener("paste", function (e) {
            e.preventDefault();
            var pasted = (e.clipboardData || window.clipboardData).getData("text");
            var digits = pasted.replace(/[^0-9]/g, "").substring(0, 8);
            if (!digits) return;
            var d = digits.substring(0, 2);
            var m = digits.substring(2, 4);
            var y = digits.substring(4, 8);
            var newVal = d + "/" + m + "/" + y;
            input.value = newVal;
            args.item[args.column.field] = newVal;
            utils.setCaret(input, newVal.length, newVal.length);
        });
    };

    this.destroy = function () {
        input.remove();
        hiddenInput.remove();
    };

    this.focus = function () {
        input.focus();
        input.select();
    };

    this.getValue = function () {
        return input.value;
    };

    this.setValue = function (val) {
        input.value = val || "";
    };

    this.loadValue = function (item) {
        defaultValue = item[args.column.field] || "";
        var d = parseDate(defaultValue);
        if (d) {
            input.value = formatDate(d);
        } else {
            input.value = parseISODate(defaultValue);
        }
        args.item[args.column.field] = input.value;
        input.select();
    };

    this.serializeValue = function () {
        return input.value;
    };

    this.applyValue = function (item, state) {
        item[args.column.field] = state;
    };

    this.isValueChanged = function () {
        return (!(input.value === "" && defaultValue == null)) && (input.value !== defaultValue);
    };

    this.validate = function () {
        var val = input.value.trim();
        if (!val || val === "__/__/____") {
            return { valid: true, msg: null };
        }
        var parsed = parseDate(val);
        if (!parsed) {
            return { valid: false, msg: "Ngày không hợp lệ. Định dạng: dd/MM/yyyy" };
        }
        return { valid: true, msg: null };
    };

    this.init();
}


function Select2Editor(args) {
    var input;
    var defaultValue;
    this.keyCaptureList = [Slick.keyCode.UP, Slick.keyCode.DOWN, Slick.keyCode.LEFT, Slick.keyCode.RIGHT];
    var keyCode = Slick.keyCode, Utils = Slick.Utils;
    var idControl = args.grid.uid + "_" + args.column.field;
    var tableMode = args.column.tableMode || false;
    var tableColumns = args.column.tableColumns || [];
    this.init = function () {
        var dataSource = args.column.dataSource || []; // Khởi tạo với mảng rỗng nếu chưa có
        Utils.createDomElement("div", { id: idControl }, args.container);
        input = new SelectInput('#' + idControl, {
            data: dataSource,
            placeholder: 'Chọn giá trị...',
            size: 'sm',
            multiple: false,
            pageSize: 100,
            tableMode: tableMode,
            tableColumns: tableColumns,
            showTableHeader: true,
            onSelect: (item) => {
                args.item[args.column.field] = item.text;
                args.item["Id" + args.column.field] = item.id;
            },
            onClear: () => {
                args.item[args.column.field] = "";
                args.item["Id" + args.column.field] = "";
            }
        });
        input.open();
    }

    this.destroy = function () {
        input.destroy();
    };
    this.show = function () {
    };
    this.hide = function () {
    };
    this.position = function (position) {
    };
    this.focus = function () {
        input.open();
    };
    this.loadValue = function (item) {
        //debugger;
        defaultValue = item["Id" + args.column.field];
        input.setValue(defaultValue);
    };
    this.serializeValue = function () {
        return input.getValue();
    };
    this.applyValue = function (item, state) {
        // debugger;
        if (state == null || state == "") {
            item[args.column.field] = "";
            item["Id" + args.column.field] = "";
        }
        else {
            item[args.column.field] = state.text;
            item["Id" + args.column.field] = state.id
            // item[args.column.field] = state;
        }
    };
    this.isValueChanged = function () {
        return (!(input.getValue() == "" && defaultValue == null)) && (input.getValue() != defaultValue);
    };
    this.validate = function () {
        return {
            valid: true,
            msg: null
        };
    };

    // Thêm hàm setDataSource để update dataSource sau khi init
    this.setDataSource = function (newDataSource) {
        if (input && newDataSource) {
            input.setData(newDataSource);
        }
    };

    this.init();
}


function AutocompleteEditor(args) {
    var inputElement;
    var clearButton;
    var inputWrapper;
    var defaultValue;
    var currentValue = null;
    var displayedItems = []; // Danh sách items đang hiển thị
    var currentPage = 0;
    var pageSize = 50; // Số items mỗi trang
    var isLoading = false;
    var hasMoreData = true;
    this.keyCaptureList = [Slick.keyCode.UP, Slick.keyCode.DOWN, Slick.keyCode.ENTER, Slick.keyCode.TAB];
    var keyCode = Slick.keyCode, Utils = Slick.Utils;
    var idControl = args.grid.uid + "_" + args.column.field;

    var scrollHandler = null; // Lưu reference của scroll handler để có thể remove sau

    this.init = function () {
        var dataSource = args.column.dataSource || [];
        var allowNew = args.column.allowNew === true ? true : false; // Mặc định cho phép nhập mới

        // Reset pagination
        displayedItems = [];
        currentPage = 0;
        hasMoreData = true;
        isLoading = false;

        // Tạo wrapper cho input và nút clear
        inputWrapper = document.createElement("div");
        inputWrapper.style.cssText = "position: relative; display: inline-block; width: 100%;";
        args.container.appendChild(inputWrapper);

        // Tạo input element
        inputElement = Utils.createDomElement("input", {
            type: "text",
            className: "form-control form-control-sm",
            id: idControl,
            placeholder: "Nhập hoặc chọn...",
            autocomplete: "off"
        }, inputWrapper);

        inputElement.style.marginTop = "-1px";
        inputElement.style.height = "27px";
        inputElement.style.padding = "5px";
        inputElement.style.paddingRight = "25px"; // Để chừa chỗ cho nút clear

        // Tạo nút clear
        clearButton = document.createElement("span");
        clearButton.innerHTML = "×";
        clearButton.style.cssText = "position: absolute; right: 5px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; color: #999; display: none; z-index: 10; line-height: 1; padding: 0 5px;";
        clearButton.title = "Xóa";
        inputWrapper.appendChild(clearButton);

        // Tạo dropdown container
        var dropdownId = idControl + "_dropdown";
        var dropdown = document.createElement("div");
        dropdown.id = dropdownId;
        dropdown.className = "autocomplete-dropdown";
        dropdown.style.cssText = "position: absolute; z-index: 10000; background: white; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; display: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15);";
        document.body.appendChild(dropdown);

        // Hàm cập nhật hiển thị nút clear
        function updateClearButton() {
            if (inputElement.value) {
                clearButton.style.display = "block";
            } else {
                clearButton.style.display = "none";
            }
        }

        // Xử lý click nút clear
        clearButton.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            inputElement.value = "";
            currentValue = null;
            args.item[args.column.field] = "";
            args.item["Id" + args.column.field] = "";
            clearButton.style.display = "none";
            hideDropdown();
            inputElement.focus();
        });

        // Xử lý input event
        inputElement.addEventListener("input", function (e) {
            var searchText = e.target.value.toLowerCase();
            currentValue = e.target.value;

            // Cập nhật hiển thị nút clear
            updateClearButton();

            // Lọc dữ liệu
            var filtered = dataSource.filter(function (item) {
                return item.text.toLowerCase().includes(searchText);
            });

            // Hiển thị dropdown
            showDropdown(filtered, searchText);
        });

        // Xử lý keydown
        inputElement.addEventListener("keydown", function (e) {
            if (e.keyCode === keyCode.ENTER) {
                var highlighted = dropdown.querySelector(".autocomplete-item.highlighted");
                if (highlighted) {
                    selectItem(highlighted.dataset.id, highlighted.dataset.text);
                } else if (allowNew && inputElement.value) {
                    // Cho phép nhập giá trị mới
                    args.item[args.column.field] = inputElement.value;
                    args.item["Id" + args.column.field] = inputElement.value;
                } else if (!inputElement.value) {
                    // Nếu input rỗng thì xóa value
                    args.item[args.column.field] = "";
                    args.item["Id" + args.column.field] = "";
                }
                hideDropdown();

                // Get grid info for wrap-around logic
                const columns = args.grid.getColumns();
                const rows = args.grid.getDataLength();
                const currentRow = args.row;
                const currentCell = args.cell;
                const lastCell = columns.length - 1;
                const lastRow = rows - 1;

                // Fix: Dùng setTimeout để đảm bảo giá trị được set trước khi navigate
                // Enter: move to next row cell 0
                if (currentCell === lastCell) {
                    // Ở cell cuối
                    if (currentRow === lastRow) {
                        // Last cell of last row → exit grid
                        focusNextFocusableElement(args.container);
                    } else {
                        // Move to next row, cell 0
                        setTimeout(function () {
                            args.grid.navigateToCell(currentRow + 1, 0, true);
                        }, 0);
                    }
                } else {
                    // Normal navigate next
                    setTimeout(function () {
                        args.grid.navigateNext();
                    }, 0);
                }
                e.preventDefault();
                return false;
            } else if (e.keyCode === keyCode.TAB) {
                // Xử lý Tab/Shift+Tab: chọn giá trị và chuyển cell/row
                e.stopPropagation(); // Prevent SlickGrid's default Tab handler from also processing
                var highlighted = dropdown.querySelector(".autocomplete-item.highlighted");
                if (highlighted) {
                    selectItem(highlighted.dataset.id, highlighted.dataset.text);
                } else if (!inputElement.value || inputElement.value.trim() === "") {
                    // Nếu input rỗng hoặc chỉ có khoảng trắng thì xóa value v-model
                    args.item[args.column.field] = "";
                    args.item["Id" + args.column.field] = "";
                    currentValue = null;
                } else if (allowNew && inputElement.value) {
                    // Cho phép nhập giá trị mới
                    args.item[args.column.field] = inputElement.value;
                    args.item["Id" + args.column.field] = inputElement.value;
                } else if (inputElement.value) {
                    // Tìm exact match trong dataSource
                    var exactMatch = dataSource.find(function (item) {
                        return item.text.toLowerCase() === inputElement.value.toLowerCase();
                    });
                    if (exactMatch) {
                        selectItem(exactMatch.id, exactMatch.text);
                    } else if (allowNew) {
                        args.item[args.column.field] = inputElement.value;
                        args.item["Id" + args.column.field] = inputElement.value;
                    } else {
                        // Không tìm thấy match và không cho phép nhập mới thì xóa
                        args.item[args.column.field] = "";
                        args.item["Id" + args.column.field] = "";
                        currentValue = null;
                    }
                }
                hideDropdown();

                // Get grid info for wrap-around logic
                const columns = args.grid.getColumns();
                const rows = args.grid.getDataLength();
                const currentRow = args.row;
                const currentCell = args.cell;
                const lastCell = columns.length - 1;
                const lastRow = rows - 1;

                // Fix: Dùng setTimeout để đảm bảo giá trị được set trước khi navigate
                // Check Shift+Tab hoặc Tab để navigate backwards/forwards
                if (e.shiftKey) {
                    // Shift+Tab: navigate prev
                    if (currentCell === 0) {
                        // Nếu ở cell 0
                        if (currentRow === 0) {
                            // Row 0 cell 0 → exit grid, focus prev element
                            focusPreviousFocusableElement(args.container);
                        } else {
                            // Move to prev row, last cell
                            setTimeout(function () {
                                args.grid.navigateToCell(currentRow - 1, lastCell, true);
                            }, 0);
                        }
                    } else {
                        // Normal prev cell
                        setTimeout(function () {
                            args.grid.navigatePrev();
                        }, 0);
                    }
                } else {
                    // Tab: navigate next
                    if (currentCell === lastCell) {
                        // Nếu ở cell cuối
                        if (currentRow === lastRow) {
                            // Last row last cell → exit grid, focus next element
                            focusNextFocusableElement(args.container);
                        } else {
                            // Move to next row, cell 0
                            setTimeout(function () {
                                args.grid.navigateToCell(currentRow + 1, 0, true);
                            }, 0);
                        }
                    } else {
                        // Normal next cell
                        setTimeout(function () {
                            args.grid.navigateNext();
                        }, 0);
                    }
                }
                e.preventDefault();
                return false;
            } else if (e.keyCode === keyCode.UP) {
                highlightPrevious();
                e.preventDefault();
            } else if (e.keyCode === keyCode.DOWN) {
                highlightNext();
                e.preventDefault();
            }
        });

        // Xử lý blur
        inputElement.addEventListener("blur", function () {
            setTimeout(function () {
                hideDropdown();
            }, 200);
        });

        // Xử lý focus
        inputElement.addEventListener("focus", function () {
            // Cập nhật hiển thị nút clear khi focus
            updateClearButton();

            // Hiển thị tất cả items khi focus
            var searchText = inputElement.value ? inputElement.value.toLowerCase() : '';
            var filtered = searchText ?
                dataSource.filter(function (item) {
                    return item.text.toLowerCase().includes(searchText);
                }) :
                dataSource;
            showDropdown(filtered, searchText);
        });

        function showDropdown(items, searchText, append) {
            append = append || false;

            // Lưu items đang hiển thị nếu là lần đầu
            if (!append) {
                displayedItems = items;
                currentPage = 0;
                // Kiểm tra xem có còn dữ liệu để load hay không
                hasMoreData = items.length > pageSize;

                // Remove old scroll listener nếu có
                if (scrollHandler && dropdown) {
                    dropdown.removeEventListener('scroll', scrollHandler);
                }
            }

            // Lấy items cho trang hiện tại
            var startIndex = currentPage * pageSize;
            var endIndex = startIndex + pageSize;
            var pageItems = displayedItems.slice(startIndex, endIndex);

            if (pageItems.length === 0 && !allowNew && !append) {
                dropdown.innerHTML = '<div style="padding: 8px; color: #999;">Không có kết quả</div>';
                dropdown.style.display = "block";
                positionDropdown();
                return;
            }

            var html = "";
            if (!append) {
                html = "";
            }

            pageItems.forEach(function (item) {
                // Không tự động highlight item nào
                html += '<div class="autocomplete-item" data-id="' + item.id + '" data-text="' + item.text + '" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">' +
                    item.text + '</div>';
            });

            // Hiển thị thông báo nếu còn dữ liệu để load
            if (hasMoreData && displayedItems.length > (currentPage + 1) * pageSize) {
                html += '<div class="autocomplete-item autocomplete-loadmore" style="padding: 8px 10px; cursor: pointer; text-align: center; color: #0d6efd; background-color: #f8f9fa; border-bottom: 1px solid #ddd;">' +
                    '<i class="fa fa-spinner fa-spin"></i> Đang tải thêm...</div>';
            }

            if (allowNew && searchText && displayedItems.length === 0) {
                html += '<div class="autocomplete-item autocomplete-new" data-id="' + searchText + '" data-text="' + searchText + '" style="padding: 6px 10px; cursor: pointer; color: #0d6efd; border-top: 1px solid #ddd;"><i class="bi bi-plus-circle"></i> Thêm mới: "' + searchText + '"</div>';
            }

            if (append) {
                // Thêm vào dropdown hiện tại
                var loadMoreEl = dropdown.querySelector(".autocomplete-loadmore");
                if (loadMoreEl) {
                    loadMoreEl.remove();
                }
                var existingItems = dropdown.querySelectorAll(".autocomplete-item:not(.autocomplete-loadmore)");
                var newHtml = "";
                pageItems.forEach(function (item) {
                    newHtml += '<div class="autocomplete-item" data-id="' + item.id + '" data-text="' + item.text + '" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">' +
                        item.text + '</div>';
                });
                if (hasMoreData && displayedItems.length > (currentPage + 1) * pageSize) {
                    newHtml += '<div class="autocomplete-item autocomplete-loadmore" style="padding: 8px 10px; cursor: pointer; text-align: center; color: #0d6efd; background-color: #f8f9fa; border-bottom: 1px solid #ddd;">' +
                        '<i class="fa fa-spinner fa-spin"></i> Đang tải thêm...</div>';
                }
                // Chỉ insert nếu có loadMoreEl (tức là dropdown vẫn còn trong DOM)
                if (loadMoreEl && loadMoreEl.parentNode) {
                    loadMoreEl.insertAdjacentHTML('beforebegin', newHtml);
                }
            } else {
                dropdown.innerHTML = html;
            }

            dropdown.style.display = "block";
            positionDropdown();

            // Bind click events
            bindDropdownItemEvents();

            // Bind scroll event - chỉ một lần cho dropdown này
            if (!append && scrollHandler) {
                dropdown.removeEventListener('scroll', scrollHandler);
            }

            if (!scrollHandler) {
                scrollHandler = function () {
                    var scrollTop = dropdown.scrollTop;
                    var scrollHeight = dropdown.scrollHeight;
                    var clientHeight = dropdown.clientHeight;

                    // Khi scroll gần cuối (còn 30px nữa là đến cuối) và còn dữ liệu để load
                    if (scrollHeight - scrollTop - clientHeight < 30 && !isLoading && hasMoreData && displayedItems.length > (currentPage + 1) * pageSize) {
                        isLoading = true;
                        currentPage++;

                        var nextStartIndex = currentPage * pageSize;
                        var nextEndIndex = nextStartIndex + pageSize;
                        var nextPageItems = displayedItems.slice(nextStartIndex, nextEndIndex);

                        if (nextPageItems.length > 0) {
                            var newHtml = "";
                            nextPageItems.forEach(function (item) {
                                newHtml += '<div class="autocomplete-item" data-id="' + item.id + '" data-text="' + item.text + '" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">' +
                                    item.text + '</div>';
                            });

                            var loadMoreEl = dropdown.querySelector(".autocomplete-loadmore");
                            if (loadMoreEl) {
                                loadMoreEl.remove();
                            }

                            // Cập nhật hasMoreData sau khi load thêm
                            hasMoreData = displayedItems.length > (currentPage + 1) * pageSize;

                            if (hasMoreData) {
                                newHtml += '<div class="autocomplete-item autocomplete-loadmore" style="padding: 8px 10px; cursor: pointer; text-align: center; color: #0d6efd; background-color: #f8f9fa; border-bottom: 1px solid #ddd;">' +
                                    '<i class="fa fa-spinner fa-spin"></i> Đang tải thêm...</div>';
                            }

                            // Insert new items
                            if (loadMoreEl && loadMoreEl.parentNode) {
                                loadMoreEl.insertAdjacentHTML('beforebegin', newHtml);
                            } else {
                                // Nếu không có loadMoreEl (trang cuối), append vào cuối
                                var lastItem = dropdown.querySelector(".autocomplete-item:last-child");
                                if (lastItem) {
                                    lastItem.insertAdjacentHTML('afterend', newHtml);
                                } else {
                                    dropdown.innerHTML += newHtml;
                                }
                            }

                            // Bind lại events cho các item mới
                            bindDropdownItemEvents();
                        }

                        isLoading = false;
                    }
                };
            }

            dropdown.addEventListener('scroll', scrollHandler);
        }

        function bindDropdownItemEvents() {
            dropdown.querySelectorAll(".autocomplete-item:not(.autocomplete-loadmore)").forEach(function (item) {
                // Xóa old listener nếu có
                item.removeEventListener("mousedown", item._mousedownHandler);
                item.removeEventListener("mouseover", item._mouseoverHandler);

                // Tạo handlers mới
                item._mousedownHandler = function (e) {
                    e.preventDefault();
                    selectItem(this.dataset.id, this.dataset.text);
                    hideDropdown();
                };

                item._mouseoverHandler = function () {
                    dropdown.querySelectorAll(".autocomplete-item").forEach(function (i) {
                        i.classList.remove("highlighted");
                        i.style.backgroundColor = "";
                    });
                    this.classList.add("highlighted");
                    this.style.backgroundColor = "#f0f0f0";
                };

                item.addEventListener("mousedown", item._mousedownHandler);
                item.addEventListener("mouseover", item._mouseoverHandler);
            });
        }

        function hideDropdown() {
            dropdown.style.display = "none";
        }

        function positionDropdown() {
            var rect = inputElement.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY) + "px";
            dropdown.style.left = rect.left + "px";
            dropdown.style.minWidth = rect.width + "px";
        }

        function selectItem(id, text) {
            inputElement.value = text;
            currentValue = id;
            args.item[args.column.field] = text;
            args.item["Id" + args.column.field] = id;
        }

        function highlightNext() {
            var items = dropdown.querySelectorAll(".autocomplete-item");
            var current = dropdown.querySelector(".autocomplete-item.highlighted");
            var index = Array.from(items).indexOf(current);

            if (current) {
                current.classList.remove("highlighted");
                current.style.backgroundColor = "";
            }

            if (index < items.length - 1) {
                items[index + 1].classList.add("highlighted");
                items[index + 1].style.backgroundColor = "#f0f0f0";
                items[index + 1].scrollIntoView({ block: "nearest" });
            } else if (items.length > 0) {
                items[0].classList.add("highlighted");
                items[0].style.backgroundColor = "#f0f0f0";
            }
        }

        function highlightPrevious() {
            var items = dropdown.querySelectorAll(".autocomplete-item");
            var current = dropdown.querySelector(".autocomplete-item.highlighted");
            var index = Array.from(items).indexOf(current);

            if (current) {
                current.classList.remove("highlighted");
                current.style.backgroundColor = "";
            }

            if (index > 0) {
                items[index - 1].classList.add("highlighted");
                items[index - 1].style.backgroundColor = "#f0f0f0";
                items[index - 1].scrollIntoView({ block: "nearest" });
            } else if (items.length > 0) {
                items[items.length - 1].classList.add("highlighted");
                items[items.length - 1].style.backgroundColor = "#f0f0f0";
            }
        }

        inputElement.focus();
    }

    this.destroy = function () {
        // Clean up scroll listener
        if (scrollHandler && dropdown) {
            dropdown.removeEventListener('scroll', scrollHandler);
            scrollHandler = null;
        }

        var dropdown = document.getElementById(idControl + "_dropdown");
        if (dropdown) {
            dropdown.remove();
        }
        if (inputElement) {
            inputElement.remove();
        }
    };

    this.show = function () {
    };

    this.hide = function () {
    };

    this.position = function (position) {
    };

    this.focus = function () {
        if (inputElement) {
            inputElement.focus();
            inputElement.select();
        }
    };

    this.loadValue = function (item) {
        defaultValue = item["Id" + args.column.field];
        var displayText = item[args.column.field] || "";
        if (inputElement) {
            inputElement.value = displayText;
            currentValue = defaultValue;
        }
    };

    this.serializeValue = function () {
        return currentValue;
    };

    this.applyValue = function (item, state) {
        if (state == null || state == "") {
            item[args.column.field] = "";
            item["Id" + args.column.field] = "";
        } else {
            // Giá trị đã được set trong selectItem hoặc khi nhập mới
            // Không cần làm gì thêm vì đã được cập nhật trong event handlers
        }
    };

    this.isValueChanged = function () {
        return currentValue != defaultValue;
    };

    this.validate = function () {
        return {
            valid: true,
            msg: null
        };
    };

    // Thêm hàm setDataSource để update dataSource sau khi init
    this.setDataSource = function (newDataSource) {
        args.column.dataSource = newDataSource;
    };

    this.init();
}