class SpinnerLibrary {
    constructor() {
        this.isVisible = false;
        this.hideTimeout = null;
        this.currentSpinnerType = null;
        this.currentSpinnerColor = 'primary';
        this.overlayId = 'fullpage-spinner-overlay-' + Date.now();

        // Tự động tạo và append overlay vào body
        this.createOverlayElement();

        // Lấy references sau khi tạo elements
        this.overlay = document.getElementById(this.overlayId);
        this.spinnerContainer = this.overlay.querySelector('.dynamic-spinner-container');
        this.textElement = this.overlay.querySelector('.spinner-text');

        // Dynamic HTML templates cho các loại spinner khác nhau
        this.spinnerTemplates = {
            border: (color, size = '3rem') => `
                        <div class="spinner-border text-${color}" role="status" style="width: ${size}; height: ${size};">
                            <strong class="visually-hidden">Loading...</strong>
                        </div>
                    `,

            grow: (color, size = '3rem') => `
                        <div class="spinner-grow text-${color}" role="status" style="width: ${size}; height: ${size};">
                            <strong class="visually-hidden">Loading...</strong>
                        </div>
                    `,

            dots: (color) => `
                        <div class="d-flex justify-content-center align-items-center">
                            <div class="spinner-grow text-${color} me-2" style="width: 1rem; height: 1rem;"></div>
                            <div class="spinner-grow text-${color} me-2" style="width: 1rem; height: 1rem; animation-delay: 0.1s;"></div>
                            <div class="spinner-grow text-${color}" style="width: 1rem; height: 1rem; animation-delay: 0.2s;"></div>
                        </div>
                    `,

            pulse: (color) => `
                        <div class="d-flex justify-content-center align-items-center">
                            <div class="spinner-grow text-${color}" style="width: 2rem; height: 2rem; animation-duration: 1s;">
                                <strong class="visually-hidden">Loading...</strong>
                            </div>
                        </div>
                    `,

            bars: (color) => `
                        <div class="d-flex justify-content-center align-items-center">
                            <div class="bg-${color} me-1" style="width: 4px; height: 30px; animation: bars-animation 1s infinite; animation-delay: 0s;"></div>
                            <div class="bg-${color} me-1" style="width: 4px; height: 30px; animation: bars-animation 1s infinite; animation-delay: 0.1s;"></div>
                            <div class="bg-${color} me-1" style="width: 4px; height: 30px; animation: bars-animation 1s infinite; animation-delay: 0.2s;"></div>
                            <div class="bg-${color} me-1" style="width: 4px; height: 30px; animation: bars-animation 1s infinite; animation-delay: 0.3s;"></div>
                            <div class="bg-${color}" style="width: 4px; height: 30px; animation: bars-animation 1s infinite; animation-delay: 0.4s;"></div>
                        </div>
                    `,

            circles: (color) => `
                        <div class="position-relative" style="width: 60px; height: 60px;">
                            <div class="position-absolute border border-${color} rounded-circle" 
                                 style="width: 60px; height: 60px; animation: circles-animation 2s infinite linear; border-width: 4px; border-top-color: transparent !important;"></div>
                            <div class="position-absolute border border-${color} rounded-circle" 
                                 style="width: 40px; height: 40px; top: 10px; left: 10px; animation: circles-animation 1.5s infinite linear reverse; border-width: 3px; border-bottom-color: transparent !important;"></div>
                        </div>
                    `,

            wave: (color) => `
                        <div class="d-flex justify-content-center align-items-end" style="height: 40px;">
                            <div class="bg-${color} me-1" style="width: 6px; height: 10px; animation: wave-animation 1s infinite; animation-delay: 0s;"></div>
                            <div class="bg-${color} me-1" style="width: 6px; height: 20px; animation: wave-animation 1s infinite; animation-delay: 0.1s;"></div>
                            <div class="bg-${color} me-1" style="width: 6px; height: 30px; animation: wave-animation 1s infinite; animation-delay: 0.2s;"></div>
                            <div class="bg-${color} me-1" style="width: 6px; height: 20px; animation: wave-animation 1s infinite; animation-delay: 0.3s;"></div>
                            <div class="bg-${color}" style="width: 6px; height: 10px; animation: wave-animation 1s infinite; animation-delay: 0.4s;"></div>
                        </div>
                    `,

            heart: (color) => `
                        <div class="text-${color}" style="font-size: 2rem; animation: heart-animation 1s infinite;">
                            <i class="fas fa-heart" style="animation: heartbeat 1s infinite;">💖</i>
                        </div>
                    `,

            loading: (color) => `
                        <div class="text-center">
                            <div class="text-${color} fw-bold" style="font-size: 1.2rem; letter-spacing: 2px; animation: loading-animation 1.5s infinite;">
                                LOADING
                            </div>
                        </div>
                    `
        };

        // Inject CSS animations
        this.injectCustomCSS();

        console.log('✅ FullpageSpinner overlay auto-appended to body with ID:', this.overlayId);
    }

    createOverlayElement() {
        // Kiểm tra xem overlay đã tồn tại chưa
        const existingOverlay = document.getElementById(this.overlayId);
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Tạo overlay element
        const overlay = document.createElement('div');
        overlay.id = this.overlayId;
        overlay.className = 'fullpage-spinner-overlay';

        // Tạo inner HTML
        overlay.innerHTML = `
                    <div class="spinner-container">
                        <!-- Dynamic spinner content will be inserted here -->
                        <div class="dynamic-spinner-container"></div>
                        <div class="spinner-text">Đang tải...</div>
                    </div>
                `;

        // Append vào body
        document.body.appendChild(overlay);

    }

    injectCustomCSS() {
        // Kiểm tra xem style đã tồn tại chưa
        const existingStyle = document.getElementById('fullpage-spinner-styles');
        if (existingStyle) {
            return; // Đã có rồi, không cần inject lại
        }

        const style = document.createElement('style');
        style.id = 'fullpage-spinner-styles';
        style.textContent = `
                    /* Fullpage Spinner Overlay Styles */
                    .fullpage-spinner-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(255, 255, 255, 0.9);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 5500;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.3s ease, visibility 0.3s ease;
                    }

                    .fullpage-spinner-overlay.show {
                        opacity: 1;
                        visibility: visible;
                    }

                    .fullpage-spinner-overlay.dark {
                        background-color: rgba(0, 0, 0, 0.8);
                    }

                    .spinner-container {
                        text-align: center;
                        padding: 20px;
                    }

                    .spinner-text {
                      margin-top: 15px;
                    font-size: 16px;
                    color: #00182d;
                    font-weight: 600;
                    }

                    .dark .spinner-text {
                        color: #ffffff;
                    }
                    
                    @keyframes bars-animation {
                        0%, 40%, 100% { transform: scaleY(0.4); }
                        20% { transform: scaleY(1); }
                    }
                    
                    @keyframes circles-animation {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes wave-animation {
                        0%, 40%, 100% { transform: scaleY(1); }
                        20% { transform: scaleY(1.5); }
                    }
                    
                    @keyframes heart-animation {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                    }
                    
                    @keyframes loading-animation {
                        0% { opacity: 0.3; }
                        50% { opacity: 1; }
                        100% { opacity: 0.3; }
                    }
                    
                    @keyframes heartbeat {
                        0% { transform: scale(1); }
                        14% { transform: scale(1.2); }
                        28% { transform: scale(1); }
                        42% { transform: scale(1.2); }
                        70% { transform: scale(1); }
                    }
                    
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `;
        document.head.appendChild(style);

        console.log(' Injected custom CSS styles for spinner');
    }

    show(text = 'Đang tải...', options = {}) {
        // Clear any existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Set options
        const theme = options.theme || 'light';
        const spinnerType = options.spinnerType || 'border';
        const color = options.color || 'primary';
        const size = options.size || '3rem';

        // Update text
        this.textElement.textContent = text;

        // Update theme
        this.overlay.classList.remove('dark');
        if (theme === 'dark') {
            this.overlay.classList.add('dark');
        }

        // Generate và insert dynamic HTML cho spinner
        this.insertDynamicSpinner(spinnerType, color, size);

        // Lưu trạng thái hiện tại
        this.currentSpinnerType = spinnerType;
        this.currentSpinnerColor = color;

        // Show overlay
        this.overlay.classList.add('show');
        this.isVisible = true;

        // Prevent body scroll
        document.body.style.overflow = 'auto !important;';
        document.body.style.paddingRight = ' 0 !important';
    }

    insertDynamicSpinner(type, color, size) {
        // Clear container trước
        this.spinnerContainer.innerHTML = '';

        // Kiểm tra xem template có tồn tại không
        if (this.spinnerTemplates[type]) {
            // Generate HTML từ template function
            const spinnerHTML = this.spinnerTemplates[type](color, size);

            // Insert vào container
            this.spinnerContainer.innerHTML = spinnerHTML;

            console.log(`🔄 Inserted dynamic spinner: ${type} (${color})`);
        } else {
            // Fallback về border spinner nếu type không tồn tại
            console.warn(`⚠️ Spinner type "${type}" không tồn tại, fallback về "border"`);
            const fallbackHTML = this.spinnerTemplates['border'](color, size);
            this.spinnerContainer.innerHTML = fallbackHTML;
        }
    }

    hide(restoreOriginal = false) {
        this.overlay.classList.remove('show');
        this.isVisible = false;

        // Restore body scroll
        document.body.style.overflow = '';

        // Clear timeout if exists
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Restore về spinner gốc nếu được yêu cầu
        if (restoreOriginal) {
            this.restoreOriginalSpinner();
        }
    }

    showTimed(duration, text = 'Đang tải...', options = {}) {
        this.show(text, options);

        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, duration);
    }

    updateSpinnerType(type, color) {
        // Lưu lại current state trước khi thay đổi
        const currentState = {
            html: this.spinnerElement.innerHTML,
            className: this.spinnerElement.className,
            width: this.spinnerElement.style.width,
            height: this.spinnerElement.style.height
        };

        // Reset về trạng thái mặc định
        this.resetSpinnerElement();

        switch (type) {
            case 'grow':
                this.applySpinnerStyle('grow', color);
                break;
            case 'dots':
                this.applyDotsSpinner(color);
                break;
            default: // border
                this.applySpinnerStyle('border', color);
                break;
        }

        // Lưu template cho lần sử dụng sau
        this.cacheSpinnerTemplate(type, color);
    }

    resetSpinnerElement() {
        this.spinnerElement.className = '';
        this.spinnerElement.innerHTML = '';
        this.spinnerElement.style.width = '';
        this.spinnerElement.style.height = '';
        this.spinnerElement.removeAttribute('role');
    }

    applySpinnerStyle(type, color) {
        const template = this.spinnerTemplates[type];
        this.spinnerElement.className = `${template.baseClass} text-${color}`;
        this.spinnerElement.innerHTML = template.html;
        this.spinnerElement.style.width = '3rem';
        this.spinnerElement.style.height = '3rem';
        this.spinnerElement.setAttribute('role', 'status');
    }

    applyDotsSpinner(color) {
        this.spinnerElement.className = 'd-flex justify-content-center';
        this.spinnerElement.innerHTML = `
                    <div class="spinner-grow text-${color} me-1" style="width: 1rem; height: 1rem;"></div>
                    <div class="spinner-grow text-${color} me-1" style="width: 1rem; height: 1rem; animation-delay: 0.1s;"></div>
                    <div class="spinner-grow text-${color}" style="width: 1rem; height: 1rem; animation-delay: 0.2s;"></div>
                `;
        this.spinnerElement.setAttribute('role', 'status');
    }

    cacheSpinnerTemplate(type, color) {
        if (type === 'dots') {
            this.spinnerTemplates.dots.html = this.spinnerElement.innerHTML;
            this.spinnerTemplates.dots.baseClass = this.spinnerElement.className;
        }
    }

    restoreOriginalSpinner() {
        this.spinnerElement.className = this.originalClasses;
        this.spinnerElement.innerHTML = this.originalHTML;
        this.spinnerElement.style.width = this.originalStyles.width;
        this.spinnerElement.style.height = this.originalStyles.height;
        this.spinnerElement.setAttribute('role', 'status');
    }

    isSpinnerVisible() {
        return this.isVisible;
    }

    getCurrentSpinnerHTML() {
        return this.spinnerElement.innerHTML;
    }

    getCurrentSpinnerClasses() {
        return this.spinnerElement.className;
    }

    getSpinnerInfo() {
        return {
            isVisible: this.isVisible,
            currentHTML: this.spinnerElement.innerHTML,
            currentClasses: this.spinnerElement.className,
            originalHTML: this.originalHTML,
            originalClasses: this.originalClasses
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the library

    const pageSpinner = new SpinnerLibrary();

    window.showLoading = () => {
        return pageSpinner.show("Đang xử lý. Xin đợi");
    };
    window.hideLoading = () => {
        return pageSpinner.hide();
    };

    // Export cho module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = pageSpinner;
    }
});
