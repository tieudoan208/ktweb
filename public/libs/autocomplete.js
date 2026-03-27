/**
 * AutocompleteInput - Vanilla JavaScript Autocomplete Component
 * Tương tự Select2 nhưng hỗ trợ tìm kiếm và nhập mới
 */

// Inject CSS
(function() {
    if (document.getElementById('autocomplete-styles')) return;

    const style = document.createElement('style');
    style.id = 'autocomplete-styles';
    style.textContent = `
        .ac-wrap { position: relative; display: block; }
        .ac-input-wrap { position: relative; }
        .ac-input-wrap input { width: 100%; }
        .ac-input-wrap input.ac-input--new {
            padding-right: 52px;
            border-color: rgba(34, 197, 94, 0.55) !important;
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12) !important;
        }
        .ac-clear-btn {
            position: absolute;
            right: 5px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            font-size: 18px;
            color: #999;
            z-index: 10;
            line-height: 1;
            padding: 0 5px;
        }
        .ac-clear-btn:hover { color: #333; }
        .ac-badge-new {
            position: absolute;
            right: 7px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(34, 197, 94, 0.12);
            color: #16a34a;
            border: 1px solid rgba(34, 197, 94, 0.4);
            font-size: 0.62rem;
            font-weight: 800;
            padding: 0.12em 0.48em;
            border-radius: 3px;
            letter-spacing: 0.06em;
            pointer-events: none;
            line-height: 1.4;
        }
        .ac-dropdown {
            background: white;
            border: 1px solid #ced4da;
            border-radius: 0 0 6px 6px;
            box-shadow: 0 6px 20px rgba(0,0,0,.13);
            overflow: hidden;
        }
        .ac-empty { padding: 9px 13px; font-size: 0.84rem; color: #6c757d; }
        .ac-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
        .ac-item {
            padding: 8px 13px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.1s;
        }
        .ac-item:hover, .ac-item.ac-item--active {
            background: #eef4ff;
            color: #2563eb;
        }
        .ac-item:last-child { border-bottom: none; }
        .ac-label { font-size: 0.84rem; line-height: 1.35; }
        .ac-subtitle { font-size: 0.72rem; color: #888; margin-top: 2px; line-height: 1.2; }
        .ac-item.ac-item--active .ac-subtitle { color: rgba(37, 99, 235, 0.6); }
        .ac-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-top: 1px solid #f0f0f0;
            background: #fafafa;
            font-size: 0.72rem;
            color: #888;
        }
        .ac-add-new {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 13px;
            cursor: pointer;
            border-top: 1px dashed #d1d5db;
            font-size: 0.84rem;
            transition: background 0.1s;
        }
        .ac-add-new:hover, .ac-add-new.ac-item--active {
            background: rgba(22, 163, 74, 0.08);
            color: #16a34a;
        }
        .ac-add-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            background: #2563eb;
            color: #fff;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 700;
            flex-shrink: 0;
            transition: background 0.1s;
        }
        .ac-add-new:hover .ac-add-icon, .ac-add-new.ac-item--active .ac-add-icon {
            background: #16a34a;
        }
        .ac-grid-header {
            display: flex;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            padding: 5px 10px;
        }
        .ac-grid-header-cell {
            font-size: 0.72rem;
            font-weight: 700;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ac-grid-body { overflow-y: auto; }
        .ac-grid-row { display: flex; align-items: center; padding: 7px 10px; }
        .ac-grid-cell { overflow: hidden; }
        .ac-cell-text { font-size: 0.83rem; }
    `;
    document.head.appendChild(style);
})();

class AutocompleteInput {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.container) {
            console.error('AutocompleteInput: Container not found');
            return;
        }

        // Options
        this.options = {
            data: options.data || [],
            placeholder: options.placeholder || 'Nhập hoặc chọn...',
            size: options.size || 'sm',
            valueField: options.valueField || 'id',
            labelField: options.labelField || 'text',
            subTitleField: options.subTitleField || '',
            allowNew: options.allowNew !== undefined ? options.allowNew : false,
            newItemLabel: options.newItemLabel || 'Thêm "{text}"',
            rowCount: options.rowCount || 0,
            maxHeight: options.maxHeight || '260px',
            dropdownWidth: options.dropdownWidth || null,
            columns: options.columns || [],
            dropdownMode: options.dropdownMode || 'list', // 'list' or 'grid'
            onSelect: options.onSelect || null,
            onClear: options.onClear || null,
            onNewItem: options.onNewItem || null
        };

        // State
        this.searchText = '';
        this.currentValue = null;
        this.currentItem = null;
        this.showDropdown = false;
        this.highlightedIndex = -1;
        this.isNewMode = false;

        // Elements
        this.inputWrapper = null;
        this.inputElement = null;
        this.clearButton = null;
        this.dropdown = null;

        this.init();
    }

    init() {
        this.createElements();
        this.attachEvents();
    }

    createElements() {
        // Clear container
        this.container.innerHTML = '';
        this.container.className = 'ac-wrap';

        // Input wrapper
        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'ac-input-wrap';
        this.container.appendChild(this.inputWrapper);

        // Input element
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control';
        if (this.options.size === 'sm') {
            this.inputElement.className += ' form-control-sm';
        }
        this.inputElement.placeholder = this.options.placeholder;
        this.inputElement.autocomplete = 'off';
        this.inputWrapper.appendChild(this.inputElement);

        // Clear button
        this.clearButton = document.createElement('span');
        this.clearButton.innerHTML = '×';
        this.clearButton.className = 'ac-clear-btn';
        this.clearButton.title = 'Xóa';
        this.clearButton.style.display = 'none';
        this.inputWrapper.appendChild(this.clearButton);

        // Badge MỚI
        this.badgeNew = document.createElement('span');
        this.badgeNew.className = 'ac-badge-new';
        this.badgeNew.textContent = 'MỚI';
        this.badgeNew.style.display = 'none';
        this.inputWrapper.appendChild(this.badgeNew);

        // Dropdown (append to body)
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'ac-dropdown';
        this.dropdown.style.display = 'none';
        document.body.appendChild(this.dropdown);
    }

    attachEvents() {
        // Input events
        this.inputElement.addEventListener('input', () => this.onInput());
        this.inputElement.addEventListener('focus', () => this.onFocus());
        this.inputElement.addEventListener('blur', () => this.onBlur());
        this.inputElement.addEventListener('keydown', (e) => this.onKeydown(e));

        // Clear button
        this.clearButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.clear();
        });

        // Click outside
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        // Scroll & resize
        window.addEventListener('scroll', () => this.updateDropdownPosition(), true);
        window.addEventListener('resize', () => this.updateDropdownPosition());
    }

    onInput() {
        this.searchText = this.inputElement.value;
        this.showDropdown = true;
        this.highlightedIndex = -1;
        this.isNewMode = false;
        this.currentValue = null;
        this.currentItem = null;
        this.updateClearButton();
        this.renderDropdown();
    }

    onFocus() {
        this.showDropdown = true;
        this.highlightedIndex = -1;
        this.updateClearButton();
        this.renderDropdown();
    }

    onBlur() {
        setTimeout(() => {
            this.showDropdown = false;
            this.hideDropdown();

            if (this.options.allowNew) {
                const text = this.searchText.trim();
                if (!text) {
                    this.clear();
                } else {
                    const exactMatch = this.findExactMatch(text);
                    if (exactMatch) {
                        this.selectItem(exactMatch);
                    } else {
                        this.confirmNew();
                    }
                }
            } else {
                const matched = this.findExactMatch(this.searchText);
                if (!matched && this.currentItem) {
                    this.inputElement.value = this.currentItem[this.options.labelField];
                }
            }
        }, 200);
    }

    onKeydown(e) {
        if (!this.showDropdown) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                this.showDropdown = true;
                this.renderDropdown();
            }
            return;
        }

        const pagedItems = this.getPagedItems();
        const totalOptions = pagedItems.length + (this.shouldShowAddNew() ? 1 : 0);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightedIndex = Math.min(this.highlightedIndex + 1, totalOptions - 1);
                this.renderDropdown();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
                this.renderDropdown();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.highlightedIndex === pagedItems.length && this.shouldShowAddNew()) {
                    this.confirmNew();
                } else if (this.highlightedIndex >= 0 && pagedItems[this.highlightedIndex]) {
                    this.selectItem(pagedItems[this.highlightedIndex]);
                } else if (this.shouldShowAddNew() && this.getFilteredItems().length === 0) {
                    this.confirmNew();
                }
                break;
            case 'Escape':
                this.showDropdown = false;
                this.hideDropdown();
                if (this.currentItem) {
                    this.inputElement.value = this.currentItem[this.options.labelField];
                }
                break;
            case 'Tab':
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
        }
    }

    updateClearButton() {
        if (this.inputElement.value) {
            this.clearButton.style.display = 'block';
        } else {
            this.clearButton.style.display = 'none';
        }
    }

    clear() {
        this.inputElement.value = '';
        this.searchText = '';
        this.currentValue = null;
        this.currentItem = null;
        this.isNewMode = false;
        this.clearButton.style.display = 'none';
        this.badgeNew.style.display = 'none';
        this.hideDropdown();
        if (this.options.onClear) {
            this.options.onClear();
        }
    }

    selectItem(item) {
        this.inputElement.value = item[this.options.labelField];
        this.searchText = item[this.options.labelField];
        this.currentValue = item[this.options.valueField];
        this.currentItem = item;
        this.isNewMode = false;
        this.badgeNew.style.display = 'none';
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
        this.isNewMode = true;
        this.currentValue = text;
        this.currentItem = { [this.options.valueField]: text, [this.options.labelField]: text };
        this.badgeNew.style.display = 'block';
        this.showDropdown = false;
        this.hideDropdown();
        this.highlightedIndex = -1;
        if (this.options.onNewItem) {
            this.options.onNewItem({ text });
        }
        if (this.options.onSelect) {
            this.options.onSelect(this.currentItem);
        }
    }

    findExactMatch(text) {
        const keyword = text.toLowerCase().trim();
        return this.options.data.find(item =>
            item[this.options.labelField].toLowerCase() === keyword
        );
    }

    getFilteredItems() {
        const keyword = this.searchText.toLowerCase().trim();
        if (!keyword) return this.options.data;
        return this.options.data.filter(item => {
            const fields = [this.options.labelField, this.options.subTitleField];
            return fields.some(field => {
                if (!field) return false;
                return String(item[field] || '').toLowerCase().includes(keyword);
            });
        });
    }

    getPagedItems() {
        const filtered = this.getFilteredItems();
        if (this.options.rowCount > 0 && filtered.length > this.options.rowCount) {
            return filtered.slice(0, this.options.rowCount);
        }
        return filtered;
    }

    shouldShowAddNew() {
        return this.options.allowNew &&
            this.searchText.trim().length > 0 &&
            !this.findExactMatch(this.searchText);
    }

    renderDropdown() {
        if (!this.showDropdown) {
            this.hideDropdown();
            return;
        }

        const pagedItems = this.getPagedItems();
        const filteredItems = this.getFilteredItems();
        const showAddNew = this.shouldShowAddNew();

        if (pagedItems.length === 0 && !showAddNew) {
            this.dropdown.innerHTML = '<div class="ac-empty">Không có kết quả</div>';
            this.dropdown.style.display = 'block';
            this.updateDropdownPosition();
            return;
        }

        let html = '';

        if (this.options.dropdownMode === 'grid' && this.options.columns.length > 0) {
            html += this.renderGridMode(pagedItems);
        } else {
            html += this.renderListMode(pagedItems);
        }

        // Row count footer
        const hiddenCount = filteredItems.length - pagedItems.length;
        if (hiddenCount > 0) {
            html += `<div class="ac-footer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Hiển thị ${pagedItems.length.toLocaleString()} / ${filteredItems.length.toLocaleString()} kết quả — gõ thêm để thu hẹp
            </div>`;
        }

        // Add new button
        if (showAddNew) {
            const isActive = this.highlightedIndex === pagedItems.length;
            const label = this.options.newItemLabel.replace('{text}', this.searchText.trim());
            html += `<div class="ac-add-new ${isActive ? 'ac-item--active' : ''}" data-action="add-new">
                <span class="ac-add-icon">+</span>
                <span>${label}</span>
            </div>`;
        }

        this.dropdown.innerHTML = html;
        this.dropdown.style.display = 'block';
        this.updateDropdownPosition();
        this.attachDropdownEvents();
    }

    renderListMode(items) {
        let html = '<ul class="ac-list" style="max-height: ' + this.options.maxHeight + '">';
        items.forEach((item, idx) => {
            const isActive = idx === this.highlightedIndex;
            html += `<li class="ac-item ${isActive ? 'ac-item--active' : ''}" data-index="${idx}">`;
            html += `<div class="ac-label">${item[this.options.labelField]}</div>`;
            if (this.options.subTitleField && item[this.options.subTitleField]) {
                html += `<div class="ac-subtitle">${item[this.options.subTitleField]}</div>`;
            }
            html += '</li>';
        });
        html += '</ul>';
        return html;
    }

    renderGridMode(items) {
        let html = '';
        const columns = this.options.columns;

        // Header
        const hasLabels = columns.some(c => c.label);
        if (hasLabels) {
            html += '<div class="ac-grid-header">';
            columns.forEach(col => {
                const style = this.getColumnStyle(col);
                html += `<div class="ac-grid-header-cell" style="${style}">${col.label || ''}</div>`;
            });
            html += '</div>';
        }

        // Body
        html += '<div class="ac-grid-body" style="max-height: ' + this.options.maxHeight + '">';
        items.forEach((item, idx) => {
            const isActive = idx === this.highlightedIndex;
            html += `<div class="ac-item ac-grid-row ${isActive ? 'ac-item--active' : ''}" data-index="${idx}">`;
            columns.forEach(col => {
                const style = this.getColumnStyle(col);
                html += `<div class="ac-grid-cell" style="${style}">`;
                if (col.isMain) {
                    html += `<div class="ac-label">${item[col.field]}</div>`;
                    if (this.options.subTitleField && item[this.options.subTitleField]) {
                        html += `<div class="ac-subtitle">${item[this.options.subTitleField]}</div>`;
                    }
                } else if (!col.isSub) {
                    html += `<span class="ac-cell-text">${item[col.field] || ''}</span>`;
                }
                html += '</div>';
            });
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    getColumnStyle(col) {
        const styles = [];
        if (col.width) styles.push(`width: ${col.width}`);
        if (col.width === 'auto') styles.push('flex: 1');
        if (col.align) styles.push(`text-align: ${col.align}`);
        styles.push('padding: 0 4px');
        return styles.join('; ');
    }

    attachDropdownEvents() {
        const items = this.dropdown.querySelectorAll('.ac-item[data-index]');
        items.forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const idx = parseInt(item.dataset.index);
                const pagedItems = this.getPagedItems();
                if (pagedItems[idx]) {
                    this.selectItem(pagedItems[idx]);
                }
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
                e.preventDefault();
                this.confirmNew();
            });

            addNewBtn.addEventListener('mouseover', () => {
                this.highlightedIndex = this.getPagedItems().length;
                this.renderDropdown();
            });
        }
    }

    updateDropdownPosition() {
        if (!this.showDropdown) return;
        const rect = this.container.getBoundingClientRect();
        this.dropdown.style.position = 'fixed';
        this.dropdown.style.zIndex = '9999';
        this.dropdown.style.top = (rect.bottom) + 'px';
        this.dropdown.style.left = rect.left + 'px';
        this.dropdown.style.width = this.options.dropdownWidth || rect.width + 'px';
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
        const item = this.options.data.find(i => i[this.options.valueField] == value);
        if (item) {
            this.selectItem(item);
        } else if (this.options.allowNew && value) {
            this.inputElement.value = value;
            this.searchText = value;
            this.currentValue = value;
            this.isNewMode = true;
            this.badgeNew.style.display = 'block';
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
    }

    destroy() {
        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
        document.removeEventListener('click', this.handleClickOutside);
        window.removeEventListener('scroll', this.updateDropdownPosition);
        window.removeEventListener('resize', this.updateDropdownPosition);
    }
}

