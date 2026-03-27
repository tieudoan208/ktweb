<script setup>
/*
Quannm
*/
import { onMounted, ref, provide, watch, onBeforeUnmount, nextTick } from "vue";


const emit = defineEmits(["cell-click", "page-change", "before-edit-cell", "cell-change"]);

const props = defineProps({
    data: { type: Array, default: () => [] },
    id: { type: String, default: "" },
    key: { type: String, default: "id" },
    height: { type: String, default: "" },
    pageSize: { type: Number, default: 25 },
    showPagination: { type: Boolean, default: false },
    showFooter: { type: Boolean, default: false },
    treeView: { type: Boolean, default: false },
    filterable: { type: Boolean, default: true },
    treeDefaultCollapsed: { type: Boolean, default: false }, // Mặc định đóng tất cả node
    paginationType: { type: String, default: "none" }, // none, scroll, node
    loadType: { type: String, default: "client" }, // client, server
    treeIndentWidth: { type: Number, default: 15 }, // Độ rộng indent cho mỗi cấp
    dynamicColumns: { type: Array, default: () => null } // Cột động từ API

});

/* ---------------- INTERNAL STATE ---------------- */
const columns = ref([]);
const grid = ref(null);
const gridContainer = ref("gridContainer");
const styleContainer = ref(
    "height:" + (props.height || "500px") + "; width:100%;"
);
const resizer = ref(null);
const dataSource = ref([]);
const dataCache = ref([]);
const dataView = ref(null);
const id = ref(null);
const filters = ref([]);

// Pending dynamic columns (khi grid chưa sẵn sàng)
const pendingDynamicColumns = ref(null);

// Pagination state
const currentPage = ref(1);
const totalRows = ref(0);


let observer;

/* ---------------- PROVIDE COLUMN REGISTRATION ---------------- */
provide("registerColumn", (col) => {
    columns.value.push(col);
});

/* ---------------- OPTIONS ---------------- */
const cols = [];
const pageSize = props.pageSize || 15;


const options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    rowHeight: 32,
    editable: true,
    forceFitColumns: true,
    showHeaderRow: props.filterable,
    explicitInitialization: true,
    createFooterRow: props.paginationType == "node" || props.showFooter ? true : false,
    showFooterRow: props.paginationType == "node" || props.showFooter ? true : false,
    footerRowHeight: 45,
    headerRowHeight: 38
};

/* ---------------- WATCH DATA ---------------- */
// Watch cả reference và length của array để phát hiện thay đổi
// Không dùng deep watch để tránh trigger khi edit cell
watch(
    () => [props.data, props.data?.length],
    ([val, length]) => {
        dataSource.value = Array.isArray(val) ? val : [];
        if (grid.value) {
            dataCache.value = dataSource.value;
            setDataSource(dataSource.value);
        }
    },
    { deep: false }
);

// Watch dynamicColumns - cập nhật grid khi có cột động từ API
watch(
    () => props.dynamicColumns,
    (newCols) => {
        if (newCols && newCols.length > 0) {
            if (grid.value) {
                updateColumns(newCols);
            } else {
                // Grid chưa sẵn sàng, lưu lại để apply sau
                pendingDynamicColumns.value = newCols;
            }
        }
    },
    { deep: true }
);

// Watch currentPage để refresh grid khi trang thay đổi
watch(
    () => currentPage.value,
    (newPage) => {
        if (grid.value) {
            // Cập nhật lại pagination UI
            updatePaginationUI();
        }
    }
);


const onSearch = (dieuKien) => {
    let timer;

    clearTimeout(timer);

    timer = window.setTimeout(function () {
        if (!dataView.value) return;
        debugger;

        // Create filter function for DataView
        const searchFilter = (item) => {
            // First check search conditions
            const matchesSearch = Object.keys(dieuKien).every(key => {
                if (!dieuKien[key]) return true;
                const itemValue = item[key];
                if (itemValue === null || itemValue === undefined) return false;
                return itemValue.toString().toLowerCase().includes(dieuKien[key].toLowerCase());
            });

            if (!matchesSearch) return false;

            // Then check tree filter if treeView is enabled
            if (props.treeView) {
                return treeFilter(item);
            }

            return true;
        };

        // Handle filtering based on paginationType and loadType
        if (props.paginationType === "node" && props.loadType === "client") {
            // Filter from full cache data
            const filteredData = dataCache.value.filter(searchFilter);

            // Reset to first page when filtering
            currentPage.value = 1;

            // Update totalRows
            totalRows.value = filteredData.length;

            // Set filtered data with pagination (node pagination uses page parameter)
            setDataView(filteredData, 0, 1);

            // Update pagination UI after data is set
            updatePaginationUI();
        } else {
            // Default behavior: filter directly in DataView
            dataView.value.setFilter(searchFilter);
            dataView.value.refresh();

            // Update totalRows based on filtered items count
            totalRows.value = dataView.value.getItems().length;
        }
    }, 50);
}

// Hàm tính toán indent và các thuộc tính tree view tự động
const processTreeData = (data) => {
    if (!data || data.length === 0) return [];

    // Ensure all items have 'id' field first
    const idField = props.key || "Id";
    data.forEach((item, index) => {
        if (!item.id) {
            // If item doesn't have 'id', use the key field or generate one
            item.id = item[idField] || index;
        }
    });

    // Tạo Map để tra cứu nhanh hơn
    const dataMap = new Map(data.map(item => [item.id, item]));

    // Hàm đệ quy tính indent level dựa trên parent
    const calculateIndent = (item, dataMap) => {
        if (!item.parent) return 0;
        const parent = dataMap.get(item.parent);
        if (!parent) return 0;
        return calculateIndent(parent, dataMap) + 1;
    };

    // Xử lý từng item: tính indent, hasChildren, collapsed
    data.forEach(item => {
        // Tự động tính indent
        item._indent = calculateIndent(item, dataMap);

        // Tự động set _hasChildren
        item._hasChildren = data.some(child => child.parent === item.id);

        // Set _collapsed dựa trên props.treeDefaultCollapsed
        if (item._collapsed === undefined) {
            item._collapsed = props.treeDefaultCollapsed;
        }
    });

    // Sắp xếp dữ liệu theo thứ tự parent-child đúng
    const sortedData = [];
    const addedIds = new Set();

    // Hàm đệ quy để thêm node và các con của nó
    const addNodeAndChildren = (nodeId) => {
        if (addedIds.has(nodeId)) return;

        const node = dataMap.get(nodeId);
        if (!node) return;

        sortedData.push(node);
        addedIds.add(nodeId);

        // Tìm và thêm tất cả các con
        const children = data.filter(item => item.parent === nodeId);

        // Sắp xếp con theo trường Xep nếu có
        children.sort((a, b) => {
            const aVal = a.Xep !== undefined ? a.Xep : 0;
            const bVal = b.Xep !== undefined ? b.Xep : 0;
            return aVal - bVal;
        });

        children.forEach(child => {
            addNodeAndChildren(child.id);
        });
    };

    // Tìm tất cả root nodes (không có parent hoặc parent = null)
    const rootNodes = data.filter(item => !item.parent || item.parent === null);

    // Sắp xếp root nodes theo trường Xep
    rootNodes.sort((a, b) => {
        const aVal = a.Xep !== undefined ? a.Xep : 0;
        const bVal = b.Xep !== undefined ? b.Xep : 0;
        return aVal - bVal;
    });

    // Thêm từng root node và các con của nó
    rootNodes.forEach(root => {
        addNodeAndChildren(root.id);
    });

    return sortedData;
};
/* ---------------- MOUNT ---------------- */
onMounted(() => {

    id.value = props.id || "Grid" + Math.random().toString(36).substring(2);
    gridContainer.value = props.id + "GridContainer";

    /* Collect columns */
    columns.value.forEach((c, index) => {
        cols.push({
            id: c.field,
            name: c.name,
            field: c.field,
            minWidth: c.width ? parseInt(c.width) : 150,
            cssClass: c.css || "",
            type: c.type || "text",
            dec: c.dec || 0,
            editor: getEditor(c.editor),
            dataSource: c.dataSource || [], // Truyen dataSource cho autocomplete editor
            filter: c.filter || 'none',
            formatter: props.format ? props.format : ((props.treeView && index === 0) ? treeFormatter : defaultFormat)
        });
    });

    /* Init after DOM ready */
    nextTick(function () {
        // Initialize DataView
        dataView.value = new Slick.Data.DataView();
        dataCache.value = dataSource.value;
        setDataView(dataSource.value, 0);

        // Create grid with DataView
        grid.value = new Slick.Grid("#" + id.value, dataView.value, cols, options);

        // Register DataView events
        dataView.value.onRowCountChanged.subscribe(function () {
            grid.value.updateRowCount();
            grid.value.render();
        });

        dataView.value.onRowsChanged.subscribe(function (e, args) {
            grid.value.invalidateRows(args.rows);
            grid.value.render();
        });

        grid.value.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));

        /* Resize plugin */
        resizer.value = new Slick.Plugins.Resizer({
            container: '#' + gridContainer.value,
            rightPadding: 5,
            bottomPadding: 10,
            minHeight: 150,
            minWidth: 250,
            calculateAvailableSizeBy: 'container'
        });
        grid.value.registerPlugin(resizer.value);

        const el = document.querySelector("#" + gridContainer.value);
        observer = new ResizeObserver(() => resizer.value.resizeGrid());
        observer.observe(el);

        /* EVENTS */
        grid.value.onHeaderRowCellRendered.subscribe(function (e, args) {
            const col = args.column;
            const field = col.field;
            if (col.filter === "none") return;

            // Check for checkall first (before text filter)
            if (col.filter === "checkall" || (col.type === "checkbox" && col.filter === "checkall")) {
                args.node.innerHTML = ''; // empty it
                const checkboxElm = document.createElement('input');
                checkboxElm.type = 'checkbox';
                checkboxElm.className = "form-check-input";
                checkboxElm.style.cursor = "pointer";
                checkboxElm.style.width = "15px";
                checkboxElm.style.height = "15px";
                checkboxElm.style.margin = "auto";
                checkboxElm.dataset.columnid = args.column.id;
                checkboxElm.dataset.field = field;

                checkboxElm.addEventListener("change", (evt) => {
                    const isChecked = evt.target.checked ? 1 : 0;

                    // Always use DataView to update all items
                    if (dataView.value) {
                        const allItems = dataView.value.getItems();
                        allItems.forEach(item => {
                            item[field] = isChecked;
                            dataView.value.updateItem(item.id, item);
                        });
                    }
                });

                const wrapper = document.createElement('div');
                wrapper.className = "d-flex justify-content-center align-items-center";
                wrapper.style.height = "100%";
                wrapper.appendChild(checkboxElm);
                args.node.appendChild(wrapper);
            }
            else if (col.filter === "text") {
                args.node.innerHTML = ''; // empty it
                const inputElm = document.createElement('input');
                inputElm.placeholder = '🔎︎';
                inputElm.className = "form-control form-control-sm";
                inputElm.dataset.columnid = args.column.id;

                inputElm.addEventListener("input", (evt) => {
                    filters.value[field] = evt.target.value;
                    onSearch(filters.value);
                });
                args.node.appendChild(inputElm);
            }
            else if (col.filter === "select") {
                const select = document.createElement("select");
                select.className = "form-select form-select-sm";

                // Get distinct values from DataView
                const allItems = dataView.value ? dataView.value.getItems() : dataSource.value;
                const distinct = [...new Set(allItems.map((r) => r[field]))];

                select.innerHTML =
                    `<option value="all">All</option>` +
                    distinct.map((v) => `<option value="${v}">${v}</option>`).join("");

                select.addEventListener("change", (evt) => {
                    filters.value[field] = evt.target.value == "all" ? "" : evt.target.value;
                    onSearch(filters.value);
                });

                args.node.appendChild(select);
            }
        });

        grid.value.onFooterRowCellRendered.subscribe(function (event, args) {
            const columns = grid.value.getColumns();
            if (args.column.id === columns[0].id) {
                args.node.setAttribute("colspan", columns.length);
                args.node.style.width = "100%";

                // Sử dụng hàm chung updatePaginationUI
                updatePaginationUI(args.node);
            } else {
                // ẩn các footer cell còn lại
                //args.node.remove();
            }
        });
        grid.value.onClick.subscribe((event, args) => {
            let rowData = grid.value.getDataItem(args.row);
            let column = grid.value.getColumns()[args.cell];
            const colTyle = column.type || "none";

            // Xử lý toggle tree view bằng icon mũi tên
            // Kiểm tra cả target và parent của target (vì click vào <i> bên trong <span>)
            const isToggleClick = event.target.classList.contains("tree-toggle") ||
                event.target.parentElement?.classList.contains("tree-toggle") ||
                event.target.classList.contains("fa-angle-right") ||
                event.target.classList.contains("fa-angle-down");

            if (props.treeView && isToggleClick) {
                const item = rowData;
                if (item) {
                    if (!item._collapsed) {
                        item._collapsed = true;
                    } else {
                        item._collapsed = false;
                    }
                    dataView.value.updateItem(item.id, item);
                }
                event.stopImmediatePropagation();
                return;
            }


            if (colTyle == "checkbox") {
                if (event.target.childNodes.length == 0) {
                    const isChecked = event.target.checked ? 1 : 0;
                    rowData[column.field] = isChecked;

                    // Update DataView
                    if (dataView.value) {
                        dataView.value.updateItem(rowData.id, rowData);
                    }

                    // Nếu là tree view, cập nhật tất cả con
                    if (props.treeView && rowData._hasChildren) {
                        updateChildrenCheckbox(rowData.id, column.field, isChecked);
                    }
                }
                else {
                    const isChecked = event.target.childNodes[1].checked ? 0 : 1;
                    rowData[column.field] = isChecked;

                    // Update DataView
                    if (dataView.value) {
                        dataView.value.updateItem(rowData.id, rowData);
                    }

                    // Nếu là tree view, cập nhật tất cả con
                    if (props.treeView && rowData._hasChildren) {
                        updateChildrenCheckbox(rowData.id, column.field, isChecked);
                    }
                }
            }

            const action = event.target.dataset.action || "none";
            let value = rowData[column.field];

            emit("cell-click", event, {
                row: args.row,
                cell: args.cell,
                value,
                currentRow: { ...rowData },
                action,
                column,
                args
            });
        });

        grid.value.onBeforeEditCell.subscribe(function (event, args) {
            const row = args.row;
            const cell = args.cell;
            const column = args.grid.getColumns()[cell];
            let currentRow = { ...args.grid.getDataItem(row) };
            const value = currentRow[column.field];

            emit("before-edit-cell", event, { row, cell, value, currentRow, column, args });
        });

        grid.value.onCellChange.subscribe(function (event, args) {
            const row = args.row;
            const cell = args.cell;
            const column = args.grid.getColumns()[cell];
            let currentRow = { ...args.grid.getDataItem(row) };
            const value = currentRow[column.field];

            emit("cell-change", event, { row, cell, value, currentRow, column, args });
        });

        grid.value.onScroll.subscribe(function (e, args) {
            const viewportElm = args.grid.getViewportNode();

            if (
                ['mousewheel', 'scroll'].includes(args.triggeredBy || '')
                && viewportElm.scrollTop > 0
                && Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
                && props.paginationType == "scroll"
            ) {
                console.log('onScroll end reached, add more items');
                const startIdx = dataView.value.getItemCount();
                var dulieu = loadData(dataCache.value, startIdx);

                dataView.value.beginUpdate()
                dataView.value.addItems(dulieu);
                dataView.value.endUpdate()
            }
        });

        grid.value.init();

        // Apply pending dynamic columns if any
        if (pendingDynamicColumns.value && pendingDynamicColumns.value.length > 0) {
            updateColumns(pendingDynamicColumns.value);
            pendingDynamicColumns.value = null;
        }
    });
});

/* ---------------- UNMOUNT ---------------- */

onBeforeUnmount(() => {
    observer?.disconnect();
});

/* ---------------- HELPERS ---------------- */

/* Tree View Helpers */
function treeFilter(item) {
    if (!item.parent) {
        return true;
    }

    let parent = dataView.value.getItemById(item.parent);
    while (parent) {
        if (parent._collapsed) {
            return false;
        }
        parent = dataView.value.getItemById(parent.parent);
    }
    return true;
}

// Hàm cập nhật checkbox cho tất cả con
function updateChildrenCheckbox(parentId, field, value) {
    if (!dataView.value) return;

    const allItems = dataView.value.getItems();
    const childrenToUpdate = [];

    // Tìm tất cả con của parent (đệ quy)
    function findChildren(pid) {
        allItems.forEach(item => {
            if (item.parent === pid) {
                childrenToUpdate.push(item);
                if (item._hasChildren) {
                    findChildren(item.id);
                }
            }
        });
    }

    findChildren(parentId);

    // Cập nhật giá trị cho tất cả con
    childrenToUpdate.forEach(child => {
        child[field] = value;
        dataView.value.updateItem(child.id, child);
    });
}

function treeFormatter(row, cell, value, columnDef, dataContext) {
    const spacer = "<span style='display:inline-block;height:1px;width:" + (props.treeIndentWidth * (dataContext._indent || 0)) + "px'></span>";

    if (dataContext._hasChildren) {
        if (dataContext._collapsed) {
            return spacer + " <span class='tree-toggle' style='cursor:pointer; display:inline-block; width:16px; text-align:center;'><i class='fa fa-angle-right'></i></span>&nbsp;" + value;
        } else {
            return spacer + " <span class='tree-toggle' style='cursor:pointer; display:inline-block; width:16px; text-align:center;'><i class='fa fa-angle-down'></i></span>&nbsp;" + value;
        }
    } else {
        return spacer + " <span style='display:inline-block;width:16px;'></span>&nbsp;" + value;
    }
}

function getEditor(editor) {
    switch (editor) {
        case "text": return TextEditor;
        case "select2": return Select2Editor;
        case "autocomplete": return AutocompleteEditor;
        case "date": return DateEditor;
        default: return "";
    }
}
// Helper function to check if row has data (excluding internal fields)
function hasRowData(dataContext) {
    if (!dataContext) return false;

    // Get all values except internal fields (starting with _ or id)
    const values = Object.entries(dataContext)
        .filter(([key]) => !key.startsWith('_') && key !== 'id')
        .map(([, val]) => val);

    var dl = values.every(b => b == "" || b == undefined || b == null)
    return !dl;
}

function defaultFormat(row, cell, value, columnDef, dataContext) {
    const type = columnDef.type;
    var className = columnDef.cssClass || '';
    value = value === null || value === undefined ? "" : value;

    if (type == 'text') {
        return "<div class='w-100 ps-2 pt-1 " + className + "'>" + value + "</div>";
    }
    else if (type == 'number') {
        var dec = columnDef.dec || 0;
        return "<div class='w-100 ps-1 pt-1 text-end " + className + "'>" + (utils.string.isNullOrEmty(value) ? "" : utils.convert.toFormatNumber(value.toString(), dec)) + "</div>";
    }
    else if (type === 'date') {
        var giatri = typeof (value) === 'string' ? value : utils.convert.numberToDate(value);
        return "<div class='w-100 ps-2 text-center " + className + "'>" + giatri + "</div>";
    }
    else if (type == "checkbox") {
        if (!hasRowData(dataContext)) {
            return value || "";
        }
        var id = utils.string.generateUUID();
        var valRow = Object.values(dataContext).join("");
        var gtri = utils.string.isNullOrEmty(value) ? 0 : value * 1;
        if (!utils.string.isNullOrEmty(valRow)) {
            var str = `<div class="d-flex justify-content-center align-items-center h-100"> `;
            if (gtri == 1)
                str += `<input type="checkbox"  data-action="checkbox" id="${id}" checked data-value="${gtri}" data-row="${row}" checked/></div>`;
            else
                str += `<input type="checkbox" id="${id}" data-action="checkbox" data-value="${gtri}" data-row="${row}" /></div>`;
            return str;
        }
        else return "";
    }
    else if (type.type == "custom") {
        return type.format(row, cell, value, columnDef, dataContext);
    }
    else {
        try {
            // Check if row has actual data - if empty, don't render button/status/label
            if (!hasRowData(dataContext)) {
                return value || "";
            }

            if (type.type == "button") {
                var str = "<div style = 'text-align: center; width:100%;'>";
                type.list.forEach(v => {
                    str += `<button class="btn btn-sm me-1 btn-${v.class}" title="${v.title}" data-action="${v.action}"><i class='${v.icon}' data-action="${v.action}"></i></button>`;
                });
                return str + "</div>";
            }
            else if (type.type == "status") {
                var str = "<div style = 'text-align: center; width:100%;  margin-top:2px;'>";
                var item = type.list.find(i => i.action == value);
                if (item != null) {
                    return str + `<span class="badge bg-${item.class}">` + item.title + `</span></div>`;
                }
                else {
                    return str + `<span class="badge bg-info">${value}</span></div>`;
                }
            }
            else if (type.type == "label") {
                var str = "<div style = 'text-align: center; width:100%;  margin-top:2px;'>";
                var item = type.list.find(i => i.action == value);
                if (item != null) {
                    return str + `<span>` + item.title + `</span></div>`;
                }
                else {
                    return str + `<span >${value}</span></div>`;
                }
            }
        } catch (e) {
            console.error("Lỗi khi định dạng giá trị:", e);
            return value; // Trả về giá trị gốc nếu có lỗi
        }
    }

    return value;
}
const setDataView = async (data, index, page = 1) => {
    if (!dataView.value) return;
    var dulieu = data;

    // Update total rows
    totalRows.value = data.length;
    if (data.length < pageSize) {
        utils.parseData(data, cols, pageSize);
    }
    // Process data based on mode
    if (props.treeView) {
        dulieu = processTreeData(data);
    } else {
        dulieu.forEach((item, idx) => {
            if (!item.id) {
                item.id = idx + 1;
            }
        });
    }

    var dataFilter = dulieu;

    // Handle pagination based on paginationType and loadType
    if (props.paginationType == "scroll") {
        dataFilter = await loadData(dulieu, index);
    } else if (props.paginationType == "node") {
        if (props.loadType === "server") {
            // Server mode: emit event to parent to handle loading data
            emit("page-change", {
                page: page,
                pageSize: props.pageSize,
                totalRows: totalRows.value
            });
            // For server mode, we'll load a slice based on current page
            const startIdx = (page - 1) * props.pageSize;
            dataFilter = await loadData(dulieu, startIdx);
        } else {
            // Client mode: load data from cache based on page
            const startIdx = (page - 1) * props.pageSize;
            dataFilter = await loadData(dulieu, startIdx);
        }
    }

    dataView.value.beginUpdate();
    dataView.value.setItems(dataFilter);

    // Set tree filter if treeView is enabled
    if (props.treeView) {
        dataView.value.setFilter(treeFilter);
    }

    dataView.value.endUpdate();
    dataView.value.refresh();
}
const setDataSource = async (data) => {
    if (!grid.value) return;
    await setDataView(data, 0);
    grid.value.invalidate();
    grid.value.render();
}

// Hàm cập nhật cột động từ API
const updateColumns = (dynamicCols) => {
    if (!grid.value || !dynamicCols) return;

    const newCols = dynamicCols.map(c => ({
        id: c.field,
        name: c.name,
        field: c.field,
        minWidth: c.width ? parseInt(c.width) : 200,
        cssClass: c.css || "",
        type: c.type || "text",
        dec: c.dec || 0,
        editor: getEditor(c.editor),
        dataSource: c.dataSource || [], // Truyen dataSource cho autocomplete editor
        filter: 'none',
        formatter: defaultFormat
    }));

    grid.value.setColumns(newCols);
    grid.value.invalidate();
    grid.value.render();
}

const isNullOrEmptyRow = (rowIndex) => {
    var obj = grid.value.getDataItem(rowIndex);
    return utils.isAllEmptyOrNull(obj);
}

const resetActiveRow = () => {
    setActiveRow(-1);
    resetActiveCell();
}
const resetActiveCell = () => {
    grid.value.resetActiveCell();
}
const setActiveRow = (index) => {
    grid.value.setSelectedRows([index]);
}
const updateRow = (rowIndex, data) => {
    grid.value.updateRow(rowIndex, data);
}
const updateCell = (rowIndex, cellIndex, value) => {
    grid.value.updateCell(rowIndex, cellIndex, value);
}

const loadData = (data, startIdx) => {
    var dataRef = data.slice(startIdx, startIdx + props.pageSize);
    return dataRef;
}

// Hàm mở tất cả các node
const expandAll = () => {
    if (!dataView.value) return;

    const allItems = dataView.value.getItems();
    allItems.forEach(item => {
        if (item._hasChildren) {
            item._collapsed = false;
            dataView.value.updateItem(item.id, item);
        }
    });
}

// Hàm đóng tất cả các node
const collapseAll = () => {
    if (!dataView.value) return;

    const allItems = dataView.value.getItems();
    allItems.forEach(item => {
        if (item._hasChildren) {
            item._collapsed = true;
            dataView.value.updateItem(item.id, item);
        }
    });
}

// Hàm toggle một node cụ thể
const toggleNode = (itemId) => {
    if (!dataView.value) return;

    const item = dataView.value.getItemById(itemId);
    if (item && item._hasChildren) {
        item._collapsed = !item._collapsed;
        dataView.value.updateItem(item.id, item);
    }
}
const getFilter = () => {
    return filters.value;
}

// Change page handler for paginationType="node"
const changePage = async (page) => {
    currentPage.value = page;
    debugger;
    if (props.loadType === "server") {
        emit("page-change", {
            page: page,
            pageSize: props.pageSize,
            totalRows: totalRows.value
        });
    } else {
        const startIdx = (page - 1) * props.pageSize;
        const dataFilter = await loadData(dataCache.value, startIdx);
        if (dataView.value) {
            dataView.value.beginUpdate();
            dataView.value.setItems(dataFilter);
            dataView.value.endUpdate();
            dataView.value.refresh();
        }
    }
}

// Hàm cập nhật UI phân trang
// node: footer cell element (tùy chọn). Nếu không truyền, sẽ tự tìm trong footer row
const updatePaginationUI = (node) => {
    if (!grid.value) return;

    let firstCell = node;

    // Nếu không truyền node, tự tìm trong footer row
    if (!firstCell) {
        const footerRow = grid.value.getFooterRow();
        if (!footerRow) return;

        const footerCells = footerRow.querySelectorAll('.slick-footerrow-column');
        if (footerCells.length === 0) return;

        firstCell = footerCells[0];
    }

    // Tính toán số trang
    const totalPages = Math.ceil(totalRows.value / props.pageSize);

    // Tạo HTML phân trang mới
    let paginationHtml = `
        <nav aria-label="Page navigation" class="mt-1">
            <ul class="pagination justify-content-center mb-0">
                <li class="page-item ${currentPage.value === 1 ? 'disabled' : ''}">
                    <a class="page-link pagination-first" href="javascript:void(0)" data-action="first" title="Trang đầu">&laquo;</a>
                </li>
                <li class="page-item ${currentPage.value === 1 ? 'disabled' : ''}">
                    <a class="page-link pagination-prev" href="javascript:void(0)" data-action="prev" title="Trang trước">‹</a>
                </li>`;

    // Hiển thị các trang
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > 7) {
        startPage = Math.max(1, currentPage.value - 2);
        endPage = Math.min(totalPages, currentPage.value + 2);

        if (currentPage.value <= 3) {
            endPage = 5;
        } else if (currentPage.value >= totalPages - 2) {
            startPage = totalPages - 4;
        }
    }

    // Thêm trang đầu nếu không trong range
    if (startPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" data-page="1">1</a></li>`;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Hiển thị các trang trong range
    for (let i = startPage; i <= endPage; i++) {
        const active = i === currentPage.value ? 'active' : '';
        paginationHtml += `<li class="page-item ${active}"><a class="page-link" href="javascript:void(0)" data-page="${i}">${i}</a></li>`;
    }

    // Thêm trang cuối nếu không trong range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    paginationHtml += `
                <li class="page-item ${currentPage.value === totalPages ? 'disabled' : ''}">
                    <a class="page-link pagination-next" href="javascript:void(0)" data-action="next" title="Trang sau">›</a>
                </li>
                <li class="page-item ${currentPage.value === totalPages ? 'disabled' : ''}">
                    <a class="page-link pagination-last" href="javascript:void(0)" data-action="last" title="Trang cuối">&raquo;</a>
                </li>
            </ul>
        </nav>
        <div class="text-center mt-1" style="font-size: 12px; color: #6c757d;">
            Trang ${currentPage.value} / ${totalPages} (${totalRows.value} bản ghi)
        </div>`;

    firstCell.innerHTML = paginationHtml;

    // Thêm lại sự kiện click
    setTimeout(() => {
        const paginationLinks = firstCell.querySelectorAll('.page-link');
        paginationLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const action = this.dataset.action;
                const page = this.dataset.page;

                let newPage = currentPage.value;

                if (action === 'first') {
                    newPage = 1;
                } else if (action === 'prev') {
                    newPage = Math.max(1, currentPage.value - 1);
                } else if (action === 'next') {
                    newPage = Math.min(totalPages, currentPage.value + 1);
                } else if (action === 'last') {
                    newPage = totalPages;
                } else if (page) {
                    newPage = parseInt(page);
                }

                if (newPage !== currentPage.value && newPage >= 1 && newPage <= totalPages) {
                    changePage(newPage);
                }
            });
        });
    }, 100);
}

// Get current page info
const getPaginationInfo = () => {
    return {
        currentPage: currentPage.value,
        pageSize: props.pageSize,
        totalRows: totalRows.value,
        totalPages: Math.ceil(totalRows.value / props.pageSize)
    };
}



// expose ra ngoài để parent gọi được
defineExpose({
    resetActiveRow,
    setDataSource,
    setActiveRow,
    updateRow,
    updateCell,
    expandAll,
    collapseAll,
    toggleNode,
    getFilter,
    changePage,
    getPaginationInfo,
    updateColumns
})
</script>

<template>
    <div :id="gridContainer" :style="styleContainer">
        <div :id="id" style="width: 100%;  border: 1px solid rgba(0, 0, 0, 0.125)" />
        <div style="display: none;">
            <slot></slot>
        </div>
    </div>
</template>