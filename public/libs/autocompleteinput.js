/**
 * AutocompleteInput - Autocomplete Component cho SlickGrid Editor
 * Tương tự SelectInput nhưng với tính năng tìm kiếm và nhập mới
 */

class AutocompleteInput {
    constructor(element, options = {}) {
        // Get container element
        this.container = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // Generate unique instance ID
        this.instanceId = 'ac_' + Math.random().toString(36).substr(2, 9);

        // Default options
        this.options = {
            data: options.data || [],
            placeholder: options.placeholder || 'Nhập hoặc chọn...',
            valueField: options.valueField || 'id',
            labelField: options.labelField || 'text',
            allowNew: options.allowNew !== undefined ? options.allowNew : true,
            newItemLabel: options.newItemLabel || 'Thêm "{text}"',
            pageSize: options.pageSize || 50,
            maxHeight: options.maxHeight || '200px',
            onSelect: options.onSelect || null,
            onClear: options.onClear || null,
            onNewItem: options.onNewItem || null
        };

        // State
        this.searchText = '';
        this.currentValue = null;
        this.currentItem = null;
        this.displayedItems = [];
        this.currentPage = 0;
        this.isLoading = false;
        this.hasMoreData = true;
        this.showDropdown = false;
        this.highlightedIndex = -1;

        // Elements
        this.inputElement = null;
        this.clearButton = null;
        this.dropdown = null;
        this.scrollHandler = null;

        this.init();
    }

    init() {
        this.createElements();
        this.attachEvents();
    }

    createElements() {
        // Clear container
        this.container.innerHTML = '';
        this.container.style.cssText = "position: relative; display: inline-block; width: 100%;";

        // Input element
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control form-control-sm';
        this.inputElement.placeholder = this.options.placeholder;
        this.inputElement.autocomplete = 'off';
        this.inputElement.style.marginTop = '-1px';
        this.inputElement.style.height = '27px';
        this.inputElement.style.padding = '5px';
        this.inputElement.style.paddingRight = '25px';
        this.container.appendChild(this.inputElement);

        // Clear button
        this.clearButton = document.createElement('span');
        this.clearButton.innerHTML = '×';
        this.clearButton.style.cssText = 'position: absolute; right: 5px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; color: #999; display: none; z-index: 10; line-height: 1; padding: 0 5px;';
        this.clearButton.title = 'Xóa';
        this.container.appendChild(this.clearButton);

        // Dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-input-dropdown';
        this.dropdown.style.cssText = 'position: absolute; z-index: 10000; background: white; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; display: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15);';
        document.body.appendChild(this.dropdown);
    }

    attachEvents() {
        // Input events
        this.inputElement.addEventListener('input', (e) => this.onInput(e));
        this.inputElement.addEventListener('focus', () => this.onFocus());
        this.inputElement.addEventListener('blur', () => this.onBlur());
        this.inputElement.addEventListener('keydown', (e) => this.onKeydown(e));

        // Clear button
        this.clearButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clear();
        });

        // Click outside
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        // Scroll & resize
        window.addEventListener('scroll', () => this.updateDropdownPosition(), true);
        window.addEventListener('resize', () => this.updateDropdownPosition());
    }

    onInput(e) {
        this.searchText = e.target.value.toLowerCase();
        this.currentValue = e.target.value;

        this.updateClearButton();

        // Filter data
        const filtered = this.options.data.filter(item => {
            return item[this.options.labelField].toLowerCase().includes(this.searchText);
        });

        this.displayedItems = filtered;
        this.currentPage = 0;
        this.hasMoreData = filtered.length > this.options.pageSize;
        this.highlightedIndex = -1;

        this.showDropdown = true;
        this.renderDropdown();
    }

    onFocus() {
        this.updateClearButton();

        // Show all items on focus
        const searchText = this.inputElement.value ? this.inputElement.value.toLowerCase() : '';
        const filtered = searchText ?
            this.options.data.filter(item => {
                return item[this.options.labelField].toLowerCase().includes(searchText);
            }) :
            this.options.data;

        this.displayedItems = filtered;
        this.currentPage = 0;
        this.hasMoreData = filtered.length > this.options.pageSize;
        this.highlightedIndex = -1;
        this.showDropdown = true;

        this.renderDropdown();
    }

    onBlur() {
        setTimeout(() => {
            this.showDropdown = false;
            this.hideDropdown();
        }, 200);
    }

    onKeydown(e) {
        const keyCode = {
            ENTER: 13,
            UP: 38,
            DOWN: 40,
            TAB: 9,
            ESCAPE: 27
        };

        if (!this.showDropdown) {
            if (e.keyCode === keyCode.DOWN || e.keyCode === keyCode.ENTER) {
                this.showDropdown = true;
                this.renderDropdown();
            }
            return;
        }

        const pagedItems = this.getPagedItems();
        const totalOptions = pagedItems.length + (this.shouldShowAddNew() ? 1 : 0);

        switch (e.keyCode) {
            case keyCode.UP:
                e.preventDefault();
                this.highlightPrevious();
                break;
            case keyCode.DOWN:
                e.preventDefault();
                this.highlightNext();
                break;
            case keyCode.ENTER:
                e.preventDefault();
                if (this.highlightedIndex === pagedItems.length && this.shouldShowAddNew()) {
                    this.confirmNew();
                } else if (this.highlightedIndex >= 0 && pagedItems[this.highlightedIndex]) {
                    this.selectItem(pagedItems[this.highlightedIndex]);
                } else if (this.shouldShowAddNew() && this.getFilteredItems().length === 0) {
                    this.confirmNew();
                }
                break;
            case keyCode.TAB:
                if (this.highlightedIndex === pagedItems.length && this.shouldShowAddNew()) {
                    this.confirmNew();
                } else if (this.highlightedIndex >= 0 && pagedItems[this.highlightedIndex]) {
                    this.selectItem(pagedItems[this.highlightedIndex]);
                } else {
                    if (!this.searchText.trim()) {
                        this.clear();
                    } else if (this.options.allowNew) {
                        this.confirmNew();
                    }
                }
                break;
            case keyCode.ESCAPE:
                this.showDropdown = false;
                this.hideDropdown();
                if (this.currentItem) {
                    this.inputElement.value = this.currentItem[this.options.labelField];
                }
                break;
        }
    }

    getFilteredItems() {
        const keyword = this.searchText.toLowerCase().trim();
        if (!keyword) return this.options.data;
        return this.options.data.filter(item => {
            return String(item[this.options.labelField] || '').toLowerCase().includes(keyword);
        });
    }

    getPagedItems() {
        const filtered = this.displayedItems;
        if (this.options.pageSize > 0 && filtered.length > this.options.pageSize) {
            const startIndex = this.currentPage * this.options.pageSize;
            return filtered.slice(startIndex, startIndex + this.options.pageSize);
        }
        return filtered;
    }

    shouldShowAddNew() {
        return this.options.allowNew &&
            this.searchText.trim().length > 0 &&
            !this.findExactMatch(this.searchText);
    }

    findExactMatch(text) {
        const keyword = text.toLowerCase().trim();
        return this.options.data.find(item =>
            item[this.options.labelField].toLowerCase() === keyword
        );
    }

    renderDropdown() {
        if (!this.showDropdown) {
            this.hideDropdown();
            return;
        }

        const pagedItems = this.getPagedItems();
        const filteredItems = this.displayedItems;
        const showAddNew = this.shouldShowAddNew();

        if (pagedItems.length === 0 && !showAddNew) {
            this.dropdown.innerHTML = '<div style="padding: 8px; color: #999;">Không có kết quả</div>';
            this.dropdown.style.display = 'block';
            this.updateDropdownPosition();
            return;
        }

        let html = '';

        pagedItems.forEach((item, idx) => {
            const isActive = idx === this.highlightedIndex;
            html += `<div class="autocomplete-item ${isActive ? 'highlighted' : ''}"
                data-index="${idx}"
                data-id="${item[this.options.valueField]}"
                data-text="${item[this.options.labelField]}"
                style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0; ${isActive ? 'background-color: #f0f0f0;' : ''}">
                ${item[this.options.labelField]}
            </div>`;
        });

        // Show load more if has more data
        if (this.hasMoreData && filteredItems.length > (this.currentPage + 1) * this.options.pageSize) {
            html += `<div class="autocomplete-loadmore" style="padding: 8px 10px; cursor: pointer; text-align: center; color: #0d6efd; background-color: #f8f9fa; border-bottom: 1px solid #ddd;">
                <i class="fa fa-spinner fa-spin"></i> Đang tải thêm...
            </div>`;
        }

        // Add new button
        if (showAddNew) {
            const isActive = this.highlightedIndex === pagedItems.length;
            const label = this.options.newItemLabel.replace('{text}', this.searchText.trim());
            html += `<div class="autocomplete-item autocomplete-new ${isActive ? 'highlighted' : ''}"
                data-action="add-new"
                style="padding: 6px 10px; cursor: pointer; color: #0d6efd; border-top: 1px solid #ddd; ${isActive ? 'background-color: #f0f0f0;' : ''}">
                <i class="bi bi-plus-circle"></i> ${label}
            </div>`;
        }

        this.dropdown.innerHTML = html;
        this.dropdown.style.display = 'block';
        this.updateDropdownPosition();
        this.attachDropdownEvents();
        this.attachScrollHandler();
    }

    attachDropdownEvents() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item[data-index]');
        items.forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input blur before selection
                e.stopPropagation();
                const idx = parseInt(item.dataset.index);
                const pagedItems = this.getPagedItems();
                if (pagedItems[idx]) {
                    this.selectItem(pagedItems[idx]);
                }
            });

            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            item.addEventListener('mouseover', () => {
                const idx = parseInt(item.dataset.index);
                this.highlightedIndex = idx;
                this.renderDropdown();
            });
        });

        const addNewBtn = this.dropdown.querySelector('[data-action="add-new"]');
        if (addNewBtn) {
            addNewBtn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input blur before selection
                e.stopPropagation();
                this.confirmNew();
            });

            addNewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            addNewBtn.addEventListener('mouseover', () => {
                this.highlightedIndex = this.getPagedItems().length;
                this.renderDropdown();
            });
        }
    }

    attachScrollHandler() {
        if (this.scrollHandler) {
            this.dropdown.removeEventListener('scroll', this.scrollHandler);
        }

        this.scrollHandler = () => {
            const scrollTop = this.dropdown.scrollTop;
            const scrollHeight = this.dropdown.scrollHeight;
            const clientHeight = this.dropdown.clientHeight;

            if (scrollHeight - scrollTop - clientHeight < 30 && !this.isLoading && this.hasMoreData) {
                this.isLoading = true;
                this.currentPage++;

                const nextStartIndex = this.currentPage * this.options.pageSize;
                const nextEndIndex = nextStartIndex + this.options.pageSize;
                const nextPageItems = this.displayedItems.slice(nextStartIndex, nextEndIndex);

                if (nextPageItems.length > 0) {
                    const loadMoreEl = this.dropdown.querySelector('.autocomplete-loadmore');
                    if (loadMoreEl) {
                        loadMoreEl.remove();
                    }

                    this.hasMoreData = this.displayedItems.length > (this.currentPage + 1) * this.options.pageSize;

                    let newHtml = '';
                    nextPageItems.forEach(item => {
                        newHtml += `<div class="autocomplete-item" data-index="${this.displayedItems.indexOf(item)}"
                            data-id="${item[this.options.valueField]}"
                            data-text="${item[this.options.labelField]}"
                            style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
                            ${item[this.options.labelField]}
                        </div>`;
                    });

                    if (this.hasMoreData) {
                        newHtml += `<div class="autocomplete-loadmore" style="padding: 8px 10px; cursor: pointer; text-align: center; color: #0d6efd; background-color: #f8f9fa; border-bottom: 1px solid #ddd;">
                            <i class="fa fa-spinner fa-spin"></i> Đang tải thêm...
                        </div>`;
                    }

                    if (loadMoreEl && loadMoreEl.parentNode) {
                        loadMoreEl.insertAdjacentHTML('beforebegin', newHtml);
                    }

                    this.attachDropdownEvents();
                }

                this.isLoading = false;
            }
        };

        this.dropdown.addEventListener('scroll', this.scrollHandler);
    }

    highlightNext() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        const current = this.dropdown.querySelector('.autocomplete-item.highlighted');
        let index = current ? Array.from(items).indexOf(current) : -1;

        if (current) {
            current.classList.remove('highlighted');
            current.style.backgroundColor = '';
        }

        if (index < items.length - 1) {
            index++;
        } else if (items.length > 0) {
            index = 0;
        }

        if (items.length > 0) {
            items[index].classList.add('highlighted');
            items[index].style.backgroundColor = '#f0f0f0';
            items[index].scrollIntoView({ block: 'nearest' });
            this.highlightedIndex = index;
        }
    }

    highlightPrevious() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        const current = this.dropdown.querySelector('.autocomplete-item.highlighted');
        let index = current ? Array.from(items).indexOf(current) : -1;

        if (current) {
            current.classList.remove('highlighted');
            current.style.backgroundColor = '';
        }

        if (index > 0) {
            index--;
        } else if (items.length > 0) {
            index = items.length - 1;
        }

        if (items.length > 0) {
            items[index].classList.add('highlighted');
            items[index].style.backgroundColor = '#f0f0f0';
            items[index].scrollIntoView({ block: 'nearest' });
            this.highlightedIndex = index;
        }
    }

    selectItem(item) {
        this.inputElement.value = item[this.options.labelField];
        this.searchText = item[this.options.labelField];
        this.currentValue = item[this.options.valueField];
        this.currentItem = item;
        this.showDropdown = false;
        this.hideDropdown();
        this.highlightedIndex = -1;
        this.updateClearButton();

        if (this.options.onSelect) {
            this.options.onSelect(item);
        }
    }

    confirmNew() {
        const text = this.searchText.trim();
        if (!text) return;

        this.currentValue = text;
        this.currentItem = { [this.options.valueField]: text, [this.options.labelField]: text };
        this.inputElement.value = text;
        this.showDropdown = false;
        this.hideDropdown();
        this.highlightedIndex = -1;
        this.updateClearButton();

        if (this.options.onNewItem) {
            this.options.onNewItem({ text });
        }
        if (this.options.onSelect) {
            this.options.onSelect(this.currentItem);
        }
    }

    clear() {
        this.inputElement.value = '';
        this.searchText = '';
        this.currentValue = null;
        this.currentItem = null;
        this.clearButton.style.display = 'none';
        this.hideDropdown();

        if (this.options.onClear) {
            this.options.onClear();
        }
    }

    updateClearButton() {
        if (this.inputElement.value) {
            this.clearButton.style.display = 'block';
        } else {
            this.clearButton.style.display = 'none';
        }
    }

    updateDropdownPosition() {
        if (!this.showDropdown) return;
        const rect = this.inputElement.getBoundingClientRect();
        this.dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
        this.dropdown.style.left = rect.left + 'px';
        this.dropdown.style.minWidth = rect.width + 'px';
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
    }

    handleClickOutside(e) {
        if (!this.container.contains(e.target) && !this.dropdown.contains(e.target)) {
            this.showDropdown = false;
            this.hideDropdown();
        }
    }

    // Public methods
    setValue(value) {
        // Tìm item trong data dựa trên value
        const item = this.options.data.find(i => i[this.options.valueField] == value);
        if (item) {
            this.selectItem(item);
        } else if (this.options.allowNew && value) {
            // Nếu không tìm thấy nhưng cho phép nhập mới
            this.inputElement.value = value;
            this.searchText = value;
            this.currentValue = value;
            this.currentItem = { [this.options.valueField]: value, [this.options.labelField]: value };
            this.updateClearButton();
        } else {
            this.clear();
        }
    }

    getValue() {
        return this.currentValue;
    }

    getItem() {
        return this.currentItem;
    }

    setData(data) {
        this.options.data = data;
        if (this.showDropdown) {
            this.renderDropdown();
        }
    }

    open() {
        this.inputElement.focus();
        this.onFocus();
    }

    focus() {
        this.inputElement.focus();
        this.inputElement.select();
    }

    destroy() {
        // Clean up scroll listener
        if (this.scrollHandler && this.dropdown) {
            this.dropdown.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }

        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }

        document.removeEventListener('click', this.handleClickOutside);
        window.removeEventListener('scroll', this.updateDropdownPosition);
        window.removeEventListener('resize', this.updateDropdownPosition);
    }
}
