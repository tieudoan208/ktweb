class SelectInput {
    constructor(element, options = {}) {
        // Inject CSS
        // SelectInputCSS.inject();

        // Get container element
        this.container = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // Generate unique instance ID
        this.instanceId = 'select_' + Math.random().toString(36).substr(2, 9);

        // Register this instance globally with unique variable name
        const globalVarName = options.globalVar || this.instanceId;
        window[globalVarName] = this;

        // Default options
        this.options = {
            data: [],
            placeholder: 'Chọn...',
            searchPlaceholder: 'Tìm kiếm...',
            multiple: false,
            searchable: true,
            clearable: true,
            disabled: false,
            size: 'sm', // 'sm', 'normal', 'lg' - mặc định sm
            pageSize: 50,
            enablePagination: true,
            loadingText: 'Đang tải...',
            noDataText: 'Không có dữ liệu',
            noResultsText: 'Không tìm thấy kết quả',
            showFooterButton: false, // Hiển thị nút ở cuối dropdown (mặc định true)
            footerButtonText: 'Thêm mới', // Text của nút footer
            textField: 'text', // Field name cho text hiển thị
            valueField: 'id', // Field name cho value
            subFields: [], // Mảng các field hiển thị phía dưới (font nhỏ, in đậm)
            globalVar: null, // Tên biến global để bind instance
            renderOption: null, // Hàm custom render option
            renderSelection: null, // Hàm custom render selection
            tableMode: false, // Hiển thị dạng table
            tableColumns: [], // Cấu hình cột cho table mode
            showTableHeader: true, // Hiển thị header của table
            height: null, // Chiều cao dropdown (px, ví dụ: 220)
            setWidth: null, // Chiều rộng dropdown (px hoặc string như '300px', '100%')
            treeMode: false, // Hiển thị dạng cây (parent-child)
            parentField: 'parent', // Field name cho parent (mặc định 'parent')
            onSelect: null,
            onUnselect: null,
            onClear: null,
            onSearch: null,
            onOpen: null,
            onClose: null,
            onLoadMore: null,
            onFooterButtonClick: null, // Event cho footer button
            ...options
        };

        // Đảm bảo data luôn là array hợp lệ
        if (!Array.isArray(this.options.data)) {
            this.options.data = [];
        }

        // State
        this.state = {
            isOpen: false,
            searchQuery: '',
            highlightedIndex: -1,
            currentPage: 1,
            isLoading: false,
            selectedValues: [],
            filteredData: [...this.options.data],
            displayedData: []
        };

        // Bind methods
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleWheel = this.handleWheel.bind(this);

        // Initialize
        this.init();
    }

    init() {
        // Sắp xếp dữ liệu nếu đang ở tree mode
        if (this.options.treeMode) {
            this.options.data = this.sortTreeData(this.options.data);
        }

        this.createElements();
        this.bindEvents();
        this.applyFiltersAndPagination(true);
        this.updateDisplay();
        this.updateResults();

        // Thêm observer để theo dõi khi table được render
        if (this.options.tableMode) {
            this.observeTableChanges();
        }
    }

    // Theo dõi thay đổi table để căn chỉnh lại cột
    observeTableChanges() {
        if (this.tableObserver) {
            this.tableObserver.disconnect();
        }

        const tableWrapper = this.container.querySelector('.select-input__table-wrapper');
        if (tableWrapper) {
            this.tableObserver = new MutationObserver((mutations) => {
                // Chỉ align khi có thay đổi thực sự về structure
                const hasStructuralChange = mutations.some(mutation =>
                    mutation.type === 'childList' && mutation.addedNodes.length > 0
                );

                if (hasStructuralChange) {
                    setTimeout(() => this.alignTableColumns(), 10);
                    setTimeout(() => this.alignTableColumns(), 100);
                }
            });

            this.tableObserver.observe(tableWrapper, {
                childList: true,
                subtree: true
            });
        }
    }

    createElements() {
        // Add size class to container
        this.container.className = `select-input select-input--${this.options.size}`;

        // Debug: Add debug class if showFooterButton is true (commented out for normal operation)
        // if (this.options.showFooterButton) {
        //     this.container.className += ' select-input--debug';
        // }         

        this.container.innerHTML = `
                    <div class="select-input__selection" tabindex="0">
                        <div class="select-input__rendered">
                            <span class="select-input__placeholder">${this.options.placeholder}</span>
                        </div>
                        ${this.options.clearable ? '<span class="select-input__clear" style="display: none;"><i class="bi bi-x-circle-fill"></i></span>' : ''}
                        <span class="select-input__arrow"><i class="bi bi-chevron-down"></i></span>
                    </div>
                    <div class="select-input__dropdown">
                        ${this.options.searchable ? `
                            <div class="select-input__search">
                                <input type="text" class="select-input__search-field" placeholder="${this.options.searchPlaceholder}">
                            </div>
                        ` : ''}
                        <div class="select-input__results"></div>
                        ${this.options.showFooterButton ? `
                            <div class="select-input__footer">
                                <button type="button" class="select-input__footer-button">
                                    <i class="bi bi-plus-circle me-1"></i>${this.options.footerButtonText}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;

        // Get references to elements
        this.elements = {
            selection: this.container.querySelector('.select-input__selection'),
            rendered: this.container.querySelector('.select-input__rendered'),
            clear: this.container.querySelector('.select-input__clear'),
            arrow: this.container.querySelector('.select-input__arrow'),
            dropdown: this.container.querySelector('.select-input__dropdown'),
            search: this.container.querySelector('.select-input__search-field'),
            results: this.container.querySelector('.select-input__results'),
            footerButton: this.container.querySelector('.select-input__footer-button')
        };

        // Tính toán chiều cao dropdown dựa vào pageSize
        this.calculateDropdownHeight();

        // Debug log 

        if (this.options.disabled) {
            this.disable();
        }
    }

    bindEvents() {
        // Selection click
        this.elements.selection.addEventListener('click', () => this.toggle());
        this.elements.selection.addEventListener('keydown', this.handleKeyboard);

        // Clear button
        if (this.elements.clear) {
            this.elements.clear.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearSelection();
            });
        }

        // Search input
        if (this.elements.search) {
            this.elements.search.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            this.elements.search.addEventListener('keydown', this.handleKeyboard);
        }

        // Results scroll
        this.elements.results.addEventListener('scroll', this.handleScroll);

        // Prevent wheel event propagation to grid
        this.elements.results.addEventListener('wheel', this.handleWheel, { passive: false });

        // Footer button
        if (this.elements.footerButton) {
            this.elements.footerButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.options.onFooterButtonClick) {
                    this.options.onFooterButtonClick();
                }
            });
        }

        // Outside click
        document.addEventListener('click', this.handleOutsideClick);
    }

    handleKeyboard(event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (this.state.isOpen) {
                    this.highlightNext();
                } else {
                    this.open();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (this.state.isOpen) {
                    this.highlightPrevious();
                }
                break;
            case 'Tab':
            case 'Enter':
                event.preventDefault();
                if (this.state.isOpen && this.state.highlightedIndex >= 0) {
                    // Có item được highlight, chọn item đó
                    const item = this.state.displayedData[this.state.highlightedIndex];
                    if (item) {
                        this.selectOption(item);
                    }
                } else if (!this.state.isOpen && event.key !== 'Tab') {
                    // Dropdown đang đóng và nhấn Enter (không phải Tab), mở dropdown
                    this.open();
                } else {
                    // Dropdown đang mở nhưng không có item nào được highlight
                    // HOẶC nhấn Tab khi dropdown đang đóng
                    // Đóng dropdown và chuyển sang input tiếp theo/trước đó
                    this.close();

                    // Lấy tất cả các input và select-input__selection
                    const allInputs = Array.from(document.querySelectorAll('input:not([disabled]):not(.select-input__search-field), textarea:not([disabled])'));
                    const allSelects = Array.from(document.querySelectorAll('.select-input__selection:not(.disabled)'));

                    // Kết hợp và sắp xếp theo vị trí trong DOM
                    const focusableElements = [...allInputs, ...allSelects].sort((a, b) => {
                        const posA = a.compareDocumentPosition(b);
                        return posA & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
                    });

                    // Tìm vị trí hiện tại (selection element)
                    const currentIndex = focusableElements.indexOf(this.elements.selection);

                    // Xác định hướng di chuyển: Shift+Tab = quay lại, Tab/Enter = tiếp theo
                    const isBackward = event.shiftKey && event.key === 'Tab';

                    if (isBackward) {
                        // Shift+Tab: Quay lại control trước đó
                        if (currentIndex > 0) {
                            const prevElement = focusableElements[currentIndex - 1];

                            // Nếu element trước đó là Select2
                            if (prevElement.classList.contains('select-input__selection')) {
                                const selectContainer = prevElement.closest('.select-input');
                                if (selectContainer) {
                                    prevElement.click();
                                    setTimeout(() => {
                                        const searchInput = selectContainer.querySelector('.select-input__search-field');
                                        if (searchInput) {
                                            searchInput.focus();
                                        }
                                    }, 100);
                                }
                            } else {
                                // Element thông thường, focus bình thường
                                prevElement.focus();
                            }
                        }
                    } else {
                        // Tab/Enter: Chuyển sang control tiếp theo
                        if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                            const nextElement = focusableElements[currentIndex + 1];

                            // Nếu element tiếp theo là Select2
                            if (nextElement.classList.contains('select-input__selection')) {
                                const selectContainer = nextElement.closest('.select-input');
                                if (selectContainer) {
                                    nextElement.click();
                                    setTimeout(() => {
                                        const searchInput = selectContainer.querySelector('.select-input__search-field');
                                        if (searchInput) {
                                            searchInput.focus();
                                        }
                                    }, 100);
                                }
                            } else {
                                // Element thông thường, focus bình thường
                                nextElement.focus();
                            }
                        }
                    }
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.close();
                break;
            case 'Backspace':
                if (this.options.multiple && !this.state.searchQuery && this.state.selectedValues.length > 0) {
                    event.preventDefault();
                    const lastItem = this.state.selectedValues[this.state.selectedValues.length - 1];
                    this.removeSelection(lastItem.id);
                }
                break;
        }
    }

    handleOutsideClick(event) {
        if (!this.container.contains(event.target)) {
            this.close();
        }
    }

    handleScroll() {
        if (this.scrollTimeout) return;

        this.scrollTimeout = setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } = this.elements.results;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20;

            if (isNearBottom && !this.state.isLoading && this.hasMore()) {
                this.loadMore();
            }
            this.scrollTimeout = null;
        }, 100);
    }

    handleWheel(event) {
        // Ngăn chặn wheel event propagate lên grid
        const { scrollTop, scrollHeight, clientHeight } = this.elements.results;
        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight;

        // Chỉ ngăn propagation khi đang scroll trong phạm vi dropdown
        // Nếu đã ở đầu và scroll lên, hoặc đã ở cuối và scroll xuống, cho phép propagate
        if ((event.deltaY < 0 && !isAtTop) || (event.deltaY > 0 && !isAtBottom)) {
            event.stopPropagation();
        }
    }

    handleSearch(query) {
        this.state.searchQuery = query.trim();
        this.state.highlightedIndex = -1;

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFiltersAndPagination(true);
            this.updateResults();
            if (this.options.onSearch) {
                this.options.onSearch(query);
            }
        }, 300);
    }

    applyFiltersAndPagination(resetPagination = true) {
        // Filter data
        if (this.state.searchQuery) {
            const searchQuery = this.state.searchQuery.toLowerCase();

            this.state.filteredData = this.options.data.filter(item => {
                // Table mode: search across all displayed columns
                if (this.options.tableMode && this.options.tableColumns.length > 0) {
                    return this.options.tableColumns.some(column => {
                        if (column.field) {
                            const fieldValue = item[column.field];
                            if (fieldValue != null) {
                                return fieldValue.toString().toLowerCase().includes(searchQuery);
                            }
                        }
                        return false;
                    });
                } else {
                    // List mode: search only in textField
                    return this.getItemText(item).toLowerCase().includes(searchQuery);
                }
            });
        } else {
            this.state.filteredData = [...this.options.data];
        }

        // Tree mode: lọc các item bị ẩn do parent collapsed
        if (this.options.treeMode) {
            this.state.filteredData = this.state.filteredData.filter(item => !this.isItemHidden(item));
        }

        // Reset pagination if needed
        if (resetPagination) {
            this.state.currentPage = 1;
            this.state.displayedData = this.state.filteredData.slice(0, this.options.pageSize);
        }
    }

    loadMore() {
        if (this.state.isLoading || !this.hasMore()) return;

        this.state.isLoading = true;

        setTimeout(() => {
            this.state.currentPage++;

            const startIndex = (this.state.currentPage - 1) * this.options.pageSize;
            const endIndex = this.state.currentPage * this.options.pageSize;
            const newItems = this.state.filteredData.slice(startIndex, endIndex);

            this.state.displayedData.push(...newItems);
            this.state.isLoading = false;

            this.updateResults();

            if (this.options.onLoadMore) {
                this.options.onLoadMore({ page: this.state.currentPage, items: newItems });
            }
        }, 300);
    }

    selectOption(item) {
        if (this.options.multiple) {
            const existingIndex = this.state.selectedValues.findIndex(v => this.getItemValue(v) === this.getItemValue(item));
            if (existingIndex >= 0) {
                this.removeSelection(this.getItemValue(item));
            } else {
                this.state.selectedValues.push(item);
                this.updateDisplay();
                if (this.options.onSelect) {
                    this.options.onSelect(item);
                }
            }
        } else {
            this.state.selectedValues = [item];
            this.updateDisplay();
            this.close();
            if (this.options.onSelect) {
                this.options.onSelect(item);
            }
        }
        this.updateResults();
    }

    removeSelection(value) {
        const item = this.state.selectedValues.find(v => this.getItemValue(v) === value);
        this.state.selectedValues = this.state.selectedValues.filter(v => this.getItemValue(v) !== value);
        this.updateDisplay();
        this.updateResults();
        if (item && this.options.onUnselect) {
            this.options.onUnselect(item);
        }
    }

    clearSelection() {
        const previousValues = [...this.state.selectedValues];
        this.state.selectedValues = [];
        this.updateDisplay();
        this.updateResults();
        if (this.options.onClear) {
            this.options.onClear({ previousValues });
        }
    }

    open() {
        if (this.state.isOpen || this.options.disabled) return;

        this.state.isOpen = true;
        this.elements.dropdown.classList.add('show');
        this.elements.selection.classList.add('focused');
        this.elements.arrow.classList.add('opened');

        // Fix min-width dropdown bằng width của select, cho phép auto extend
        const selectRect = this.container.getBoundingClientRect();
        this.elements.dropdown.style.minWidth = selectRect.width + 'px';

        // Áp dụng setWidth nếu được cấu hình
        if (this.options.setWidth) {
            if (typeof this.options.setWidth === 'number') {
                this.elements.dropdown.style.width = this.options.setWidth + 'px';
            } else {
                this.elements.dropdown.style.width = this.options.setWidth;
            }
        }

        // Table mode: đảm bảo header và body thẳng hàng
        if (this.options.tableMode) {
            this.alignTableColumns();
        }

        if (this.elements.search) {
            this.elements.search.focus();
        }
        // Auto scroll to selected item
        this.scrollToSelectedItem();
        if (this.options.onOpen) {
            this.options.onOpen();
        }
    }

    close() {
        if (!this.state.isOpen) return;

        this.state.isOpen = false;
        this.state.highlightedIndex = -1;
        this.elements.dropdown.classList.remove('show');
        this.elements.selection.classList.remove('focused');
        this.elements.arrow.classList.remove('opened');

        if (this.options.searchable) {
            this.state.searchQuery = '';
            if (this.elements.search) {
                this.elements.search.value = '';
            }
            this.applyFiltersAndPagination(true);
            this.updateResults();
        }

        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    toggle() {
        if (this.state.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    highlightNext() {
        this.state.highlightedIndex = Math.min(
            this.state.highlightedIndex + 1,
            this.state.displayedData.length - 1
        );
        this.updateResults();
    }

    highlightPrevious() {
        this.state.highlightedIndex = Math.max(this.state.highlightedIndex - 1, 0);
        this.updateResults();
    }

    hasMore() {
        const totalPages = Math.ceil(this.state.filteredData.length / this.options.pageSize);
        return this.state.currentPage < totalPages;
    }

    // Helper methods for field access
    getItemText(item) {
        return item[this.options.textField] || '';
    }

    getItemValue(item) {
        return item[this.options.valueField];
    }

    // Helper method to create standardized item object
    createItemObject(item) {
        if (typeof item === 'string' || typeof item === 'number') {
            return {
                [this.options.valueField]: item,
                [this.options.textField]: item.toString()
            };
        }
        return item;
    }

    // Sắp xếp dữ liệu theo thứ tự parent-child cho tree mode
    sortTreeData(data) {
        if (!this.options.treeMode || !data || data.length === 0) return data;

        const valueField = this.options.valueField;
        const parentField = this.options.parentField;

        // Tạo Map để tra cứu nhanh
        const dataMap = new Map(data.map(item => [this.getItemValue(item), item]));

        // Thêm thuộc tính _hasChildren và _collapsed cho mỗi item
        data.forEach(item => {
            // Kiểm tra xem item có con không
            item._hasChildren = data.some(child => child[parentField] === this.getItemValue(item));

            // Mặc định expand all (collapsed = false)
            if (item._collapsed === undefined) {
                item._collapsed = false;
            }
        });

        const sortedData = [];
        const addedValues = new Set();

        // Hàm đệ quy để thêm node và các con của nó
        const addNodeAndChildren = (nodeValue) => {
            if (addedValues.has(nodeValue)) return;

            const node = dataMap.get(nodeValue);
            if (!node) return;

            sortedData.push(node);
            addedValues.add(nodeValue);

            // Tìm và thêm tất cả các con
            const children = data.filter(item => item[parentField] === nodeValue);
            children.forEach(child => {
                addNodeAndChildren(this.getItemValue(child));
            });
        };

        // Tìm tất cả root nodes (không có parent hoặc parent = null)
        const rootNodes = data.filter(item => !item[parentField] || item[parentField] === null);

        // Thêm từng root node và các con của nó
        rootNodes.forEach(root => {
            addNodeAndChildren(this.getItemValue(root));
        });

        return sortedData;
    }

    // Kiểm tra xem item có bị ẩn do parent collapsed không
    isItemHidden(item) {
        if (!this.options.treeMode) return false;
        if (!item[this.options.parentField]) return false;

        // Tìm parent
        let currentParent = this.options.data.find(i =>
            this.getItemValue(i) === item[this.options.parentField]
        );

        // Kiểm tra tất cả parent trong cây
        while (currentParent) {
            if (currentParent._collapsed) {
                return true;
            }
            currentParent = this.options.data.find(i =>
                this.getItemValue(i) === currentParent[this.options.parentField]
            );
        }

        return false;
    }

    // Toggle expand/collapse cho một item
    toggleTreeNode(item) {
        if (!this.options.treeMode || !item._hasChildren) return;

        item._collapsed = !item._collapsed;

        // Cập nhật lại filtered data và displayed data
        this.applyFiltersAndPagination(true);
        this.updateResults();
    }

    scrollToSelectedItem() {
        if (this.state.selectedValues.length === 0) return;
        const valueField = this.options.valueField || 'id';
        const selectedValue = this.state.selectedValues[0][valueField];
        // Tìm index trong displayedData theo valueField
        const selectedIndex = this.state.displayedData.findIndex(item => item[valueField] === selectedValue);
        if (selectedIndex >= 0) {
            // Table mode: scroll body container, List mode: scroll results
            if (this.options.tableMode) {
                const bodyContainer = this.container.querySelector('.select-input__table-body-container');
                if (bodyContainer) {
                    const rows = bodyContainer.querySelectorAll('.select-input__table-row');
                    const selectedRow = rows[selectedIndex];
                    if (selectedRow) {
                        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            } else {
                const options = this.elements.results.querySelectorAll('.select-input__option');
                const selectedOption = options[selectedIndex];
                if (selectedOption) {
                    selectedOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else if (!this.options.multiple && this.state.selectedValues.length > 0) {
            // Nếu chưa có trong displayedData, tìm trong filteredData
            const foundInAllData = this.state.filteredData.findIndex(item => item[valueField] === selectedValue);
            if (foundInAllData >= 0) {
                // Tính lại trang chứa item
                const targetPage = Math.ceil((foundInAllData + 1) / this.options.pageSize);
                if (targetPage > this.state.currentPage) {
                    this.state.currentPage = targetPage;
                    this.state.displayedData = this.state.filteredData.slice(0, targetPage * this.options.pageSize);
                    this.updateResults();
                    setTimeout(() => {
                        this.scrollToSelectedItem();
                    }, 100);
                }
            }
        }
    }

    updateDisplay() {
        const hasSelectedValues = this.state.selectedValues.length > 0;

        // Update rendered area
        if (this.options.multiple && hasSelectedValues) {
            this.elements.rendered.innerHTML = this.state.selectedValues.map(item => `
                        <span class="select-input__choice">
                            ${this.getItemText(item)}
                            <span class="select-input__choice-remove" data-item-id="${this.getItemValue(item)}">
                                <i class="bi bi-x"></i>
                            </span>
                        </span>
                    `).join('');

            // Add event listeners for choice remove buttons
            this.elements.rendered.querySelectorAll('.select-input__choice-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const itemId = btn.getAttribute('data-item-id');
                    this.removeSelection(itemId);
                });
            });
        } else {
            const displayText = hasSelectedValues ? this.getItemText(this.state.selectedValues[0]) : this.options.placeholder;
            const className = hasSelectedValues ? 'select-input__single-value' : 'select-input__placeholder';
            this.elements.rendered.innerHTML = `<span class="${className}">${displayText}</span>`;
        }

        // Update clear button
        if (this.elements.clear) {
            this.elements.clear.style.display = hasSelectedValues ? 'block' : 'none';
        }
    }

    updateResults() {
        let html = '';

        if (this.state.displayedData.length > 0) {
            if (this.options.tableMode && this.options.tableColumns.length > 0) {
                html = this.renderTableResults();
            } else {
                html = this.renderListResults();
            }
        } else {
            html = `<div class="select-input__message">${this.state.searchQuery ? this.options.noResultsText : this.options.noDataText}</div>`;
        }

        if (this.state.isLoading) {
            html += `
                        <div class="select-input__loading">
                            <div class="spinner"></div>
                            <span>${this.options.loadingText}</span>
                        </div>
                    `;
        }

        this.elements.results.innerHTML = html;

        // Add event listeners for option clicks (both list and table mode)
        const clickableElements = this.options.tableMode ?
            this.elements.results.querySelectorAll('.select-input__table-row') :
            this.elements.results.querySelectorAll('.select-input__option');

        clickableElements.forEach(element => {
            element.addEventListener('click', (e) => {
                // Xử lý click vào icon toggle tree (giống grid)
                const isToggleClick = e.target.classList.contains('tree-toggle') ||
                    e.target.parentElement?.classList.contains('tree-toggle') ||
                    e.target.classList.contains('fa-angle-right') ||
                    e.target.classList.contains('fa-angle-down');

                if (this.options.treeMode && isToggleClick) {
                    // Lấy item value từ data attribute
                    const toggleElement = e.target.classList.contains('tree-toggle') ?
                        e.target : e.target.parentElement;
                    const itemValue = toggleElement?.getAttribute('data-item-value');

                    if (itemValue) {
                        // Tìm item trong data
                        const item = this.options.data.find(i =>
                            this.getItemValue(i).toString() === itemValue
                        );
                        if (item) {
                            this.toggleTreeNode(item);
                        }
                    }
                    e.stopPropagation();
                    return;
                }

                // Click vào option để select
                const itemIndex = parseInt(element.getAttribute('data-item-index'));
                const item = this.state.displayedData[itemIndex];
                if (item) {
                    this.selectOption(item);
                }
            });
        });

        // Force align table columns after rendering if table mode
        if (this.options.tableMode && this.state.isOpen) {
            setTimeout(() => this.alignTableColumns(), 10);
            setTimeout(() => this.alignTableColumns(), 50);
        }
    }

    // Public API methods
    getValue() {
        return this.options.multiple ? this.state.selectedValues : (this.state.selectedValues[0] || null);
    }

    setValue(value) {
        if (this.options.multiple && Array.isArray(value)) {
            this.state.selectedValues = value.map(item => {
                // Tìm kiếm theo valueField được cấu hình
                let found = this.options.data.find(dataItem =>
                    this.getItemValue(dataItem) === this.getItemValue(item) ||
                    this.getItemValue(dataItem) === item
                );
                return found || item;
            }).filter(item => item);
        } else if (!this.options.multiple && value) {
            // Tìm kiếm theo valueField được cấu hình
            let found = this.options.data.find(item =>
                this.getItemValue(item) === this.getItemValue(value) ||
                this.getItemValue(item) === value
            );
            this.state.selectedValues = found ? [found] : (value ? [value] : []);
        } else {
            this.state.selectedValues = [];
        }
        this.updateDisplay();
        this.updateResults();
    }

    setData(data) {
        // Sắp xếp dữ liệu nếu đang ở tree mode
        this.options.data = this.options.treeMode ? this.sortTreeData(data) : data;
        this.applyFiltersAndPagination(true);
        this.updateResults();
    }

    addData(newData) {
        this.options.data.push(...newData);
        this.applyFiltersAndPagination(true);
        this.updateResults();
    }

    clear() {
        this.clearSelection();
    }

    enable() {
        this.options.disabled = false;
        this.container.classList.remove('select-input--disabled');
        this.elements.selection.classList.remove('disabled');
        this.elements.selection.tabIndex = 0;
    }

    disable() {
        this.options.disabled = true;
        this.container.classList.add('select-input--disabled');
        this.elements.selection.classList.add('disabled');
        this.elements.selection.tabIndex = -1;
        this.close();
    }

    // New method to change size
    setSize(size) {
        this.container.className = `select-input select-input--${size}`;
        this.options.size = size;
    }

    destroy() {
        document.removeEventListener('click', this.handleOutsideClick);
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        if (this.tableObserver) this.tableObserver.disconnect();
        this.container.innerHTML = '';
    }

    // Tính toán chiều cao dropdown dựa vào pageSize
    calculateDropdownHeight() {
        const itemHeight = this.options.size === 'sm' ? 35 : (this.options.size === 'lg' ? 50 : 42);
        const searchHeight = this.options.searchable ? 50 : 0;
        const footerHeight = this.options.showFooterButton ? 45 : 0;
        const headerHeight = this.options.tableMode && this.options.showTableHeader ? 40 : 0;

        // Tính chiều cao cho pageSize items (tối đa 10 items hiển thị)
        const displayItems = Math.min(this.options.pageSize, 10);
        const resultsHeight = displayItems * itemHeight;
        const totalHeight = resultsHeight + searchHeight + footerHeight + headerHeight;

        // Set chiều cao cho dropdown và results
        this.elements.dropdown.style.maxHeight = totalHeight + 'px';
        this.elements.results.style.maxHeight = resultsHeight + 'px';

        // Nếu là table mode, set chiều cao cho body container
        if (this.options.tableMode) {
            setTimeout(() => {
                const bodyContainer = this.container.querySelector('.select-input__table-body-container');
                if (bodyContainer) {
                    bodyContainer.style.maxHeight = resultsHeight + 'px';
                    bodyContainer.style.overflowY = 'auto';

                    // Thêm wheel event handler cho table body container
                    bodyContainer.addEventListener('wheel', (event) => {
                        const { scrollTop, scrollHeight, clientHeight } = bodyContainer;
                        const isAtTop = scrollTop === 0;
                        const isAtBottom = scrollTop + clientHeight >= scrollHeight;

                        // Ngăn propagation khi đang scroll trong phạm vi dropdown
                        if ((event.deltaY < 0 && !isAtTop) || (event.deltaY > 0 && !isAtBottom)) {
                            event.stopPropagation();
                        }
                    }, { passive: false });
                }
            }, 10);
        }
    }

    // Căn chỉnh cột header và body trong table mode
    alignTableColumns() {
        const tableWrapper = this.container.querySelector('.select-input__table-wrapper');
        if (!tableWrapper) return;

        const headerTable = tableWrapper.querySelector('.select-input__table-header-table');
        const bodyTable = tableWrapper.querySelector('.select-input__table-body-table');

        if (!headerTable || !bodyTable) return;

        // Force table layout cho cả 2 table
        headerTable.style.tableLayout = 'fixed';
        headerTable.style.width = '100%';
        bodyTable.style.tableLayout = 'fixed';
        bodyTable.style.width = '100%';

        // Đợi DOM render xong và thực hiện căn chỉnh
        const alignColumns = () => {
            const headerRow = headerTable.querySelector('thead tr');
            const firstBodyRow = bodyTable.querySelector('tbody tr');

            if (headerRow && firstBodyRow) {
                const ths = headerRow.querySelectorAll('th');
                const tds = firstBodyRow.querySelectorAll('td');

                if (ths.length === tds.length && ths.length > 0) {
                    // Tính toán width dựa trên config
                    let totalConfigWidth = 0;
                    let autoColumns = 0;

                    this.options.tableColumns.forEach(column => {
                        if (column.width && column.width !== 'auto') {
                            totalConfigWidth += parseInt(column.width);
                        } else {
                            autoColumns++;
                        }
                    });

                    // Set width cho từng cột
                    ths.forEach((th, i) => {
                        if (tds[i] && this.options.tableColumns[i]) {
                            const columnConfig = this.options.tableColumns[i];
                            let width = columnConfig.width || 'auto';

                            // Nếu width là auto, tính toán dựa trên space còn lại
                            if (width === 'auto' && autoColumns > 0) {
                                const containerWidth = tableWrapper.offsetWidth;
                                const remainingWidth = containerWidth - totalConfigWidth - 20; // trừ padding/border
                                width = Math.max(100, Math.floor(remainingWidth / autoColumns)) + 'px';
                            }

                            // Set width cho header
                            th.style.width = width;
                            th.style.minWidth = width;
                            th.style.maxWidth = width;

                            // Set width cho body cell
                            tds[i].style.width = width;
                            tds[i].style.minWidth = width;
                            tds[i].style.maxWidth = width;
                        }
                    });

                    // Apply cho tất cả rows trong tbody
                    const allBodyRows = bodyTable.querySelectorAll('tbody tr');
                    allBodyRows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        cells.forEach((cell, i) => {
                            if (ths[i] && this.options.tableColumns[i]) {
                                const width = ths[i].style.width;
                                cell.style.width = width;
                                cell.style.minWidth = width;
                                cell.style.maxWidth = width;
                            }
                        });
                    });
                }
            }
        };

        // Thực hiện căn chỉnh nhiều lần để đảm bảo
        setTimeout(alignColumns, 10);
        setTimeout(alignColumns, 50);
        setTimeout(alignColumns, 150);
        setTimeout(alignColumns, 300);
    }

    // Tính level của item trong cây (dựa vào parent)
    getItemLevel(item) {
        if (!this.options.treeMode) return 0;

        let level = 0;
        let currentItem = item;
        const parentField = this.options.parentField;
        const valueField = this.options.valueField;
        const maxDepth = 20; // Tránh vòng lặp vô hạn

        while (currentItem && currentItem[parentField] && level < maxDepth) {
            level++;
            // Tìm parent item
            currentItem = this.options.data.find(i =>
                this.getItemValue(i) === currentItem[parentField]
            );
        }

        return level;
    }

    // Render results as list (default mode)
    renderListResults() {
        let html = '';
        this.state.displayedData.forEach((item, index) => {
            const isSelected = this.state.selectedValues.some(v => this.getItemValue(v) === this.getItemValue(item));
            const isHighlighted = index === this.state.highlightedIndex;
            const classes = [
                'select-input__option',
                isSelected ? 'selected' : '',
                isHighlighted ? 'highlighted' : ''
            ].filter(Boolean).join(' ');

            // Use custom render function if provided
            let content;
            if (this.options.renderOption) {
                content = this.options.renderOption(item, isSelected, isHighlighted);
            } else {
                const mainText = this.getItemText(item);

                // Tree mode: thêm indent và icon expand/collapse
                let prefix = '';
                if (this.options.treeMode) {
                    const level = this.getItemLevel(item);
                    const indent = level * 15; // 15px cho mỗi level (giống grid)
                    const spacer = `<span style="display:inline-block;height:1px;width:${indent}px;"></span>`;

                    if (item._hasChildren) {
                        // Item có con: hiển thị icon expand/collapse
                        const itemValue = this.getItemValue(item);
                        if (item._collapsed) {
                            // Collapsed: hiển thị mũi tên phải
                            prefix = `${spacer}<span class="tree-toggle" data-item-value="${itemValue}" style="cursor:pointer; display:inline-block; width:16px; text-align:center;"><i class="fa fa-angle-right"></i></span>&nbsp;`;
                        } else {
                            // Expanded: hiển thị mũi tên xuống
                            prefix = `${spacer}<span class="tree-toggle" data-item-value="${itemValue}" style="cursor:pointer; display:inline-block; width:16px; text-align:center;"><i class="fa fa-angle-down"></i></span>&nbsp;`;
                        }
                    } else {
                        // Item không có con: chỉ hiển thị spacer
                        prefix = `${spacer}<span style="display:inline-block;width:16px;"></span>&nbsp;`;
                    }
                }

                // Thêm sub fields nếu có
                if (this.options.subFields && this.options.subFields.length > 0) {
                    const subContent = this.options.subFields
                        .map(field => item[field])
                        .filter(val => val)
                        .join(' • ');
                    if (subContent) {
                        content = `${prefix}<div class="select-input__main-text">${mainText}</div><div class="select-input__sub-fields">${subContent}</div>`;
                    } else {
                        content = `${prefix}<div class="select-input__main-text">${mainText}</div>`;
                    }
                } else {
                    content = prefix + mainText;
                }
            }

            html += `<div class="${classes}" data-item-index="${index}">${content}</div>`;
        });
        return html;
    }

    // Render results as table
    renderTableResults() {
        let html = '<div class="select-input__table-wrapper">';

        // Header container (fixed)
        if (this.options.showTableHeader) {
            html += '<div class="select-input__table-header-container">';
            html += '<table class="select-input__table-header-table">';
            html += '<thead class="select-input__table-header"><tr>';
            this.options.tableColumns.forEach(column => {
                const width = column.width || 'auto';
                html += `<th style="width: ${width}; min-width: ${width}; max-width: ${width};">${column.title || column.field}</th>`;
            });
            html += '</tr></thead>';
            html += '</table>';
            html += '</div>';
        }

        // Body container (scrollable)
        html += '<div class="select-input__table-body-container">';
        html += '<table class="select-input__table-body-table">';
        html += '<tbody>';
        this.state.displayedData.forEach((item, index) => {
            const isSelected = this.state.selectedValues.some(v => this.getItemValue(v) === this.getItemValue(item));
            const isHighlighted = index === this.state.highlightedIndex;
            const classes = [
                'select-input__table-row',
                isSelected ? 'selected' : '',
                isHighlighted ? 'highlighted' : ''
            ].filter(Boolean).join(' ');
            html += `<tr class="${classes}" data-item-index="${index}">`;

            this.options.tableColumns.forEach(column => {
                const width = column.width || 'auto';
                let cellContent = '';
                if (column.render) {
                    cellContent = column.render(item, isSelected, isHighlighted);
                } else if (column.field) {
                    cellContent = item[column.field] || '';
                    if (column.type === 'image' && cellContent) {
                        cellContent = `<img src="${cellContent}" alt="${column.title || column.field}" />`;
                    } else if (column.type === 'badge' && cellContent) {
                        cellContent = `<span class="badge bg-secondary">${cellContent}</span>`;
                    }
                }
                html += `<td class="select-input__table-cell" style="width: ${width}; min-width: ${width}; max-width: ${width};">${cellContent}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
}