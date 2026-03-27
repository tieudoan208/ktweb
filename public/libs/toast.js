
class ToastSystem {
    constructor() {
        this.toasts = [];
        this.idCounter = 0;
        this.toastStats = { info: 0, success: 0, warning: 0, danger: 0 };
        this.initialized = false;
    }

    // Khởi tạo hệ thống toast
    init() {
        if (this.initialized) return;

        this.injectCSS();
        this.createToastContainer();
        this.initialized = true;
    }

    // Inject CSS vào head
    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .toast-enter {
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeInDown 0.4s ease-out forwards;
      }

      .toast-leave {
        animation: fadeOutUp 0.4s ease-in forwards;
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeOutUp {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }

      .toast {
        min-width: 300px; 
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: none !important;
        margin-bottom: 0.5rem !important;
      }

      .toast-progress {
        height: 4px;
        transform-origin: left center;
        animation: progressReverse 8s linear forwards;
      }

      @keyframes progressReverse {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
       
      .toast-body.info-bg {
        background-color: #e7f1fa;
      }
      .toast-body.success-bg {
        background-color: #e6f4ea;
      }
      .toast-body.warning-bg {
        background-color: #fff3cd;
      }
      .toast-body.danger-bg {
        background-color: #f8d7da;
      }
    `;
        document.head.appendChild(style);
    }

    // Tạo container cho toast
    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Hiển thị toast
    showToast(title, message, type = 'info', duration = 8000) {
        if (!this.initialized) {
            console.warn('ToastSystem chưa được khởi tạo. Vui lòng gọi ToastSystem.init() trước.');
            return;
        }

        const id = this.idCounter++;
        const toast = { id, title, message, type };

        // Add to beginning of array
        this.toasts.unshift(toast);

        // Update statistics
        this.updateStats(type);

        // Create and insert DOM element
        this.createToastElement(toast);

        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(id);
        }, duration);

        return id; // Return ID để có thể remove manually
    }

    // Cập nhật thống kê
    updateStats(type, increment = true) {
        if (increment) {
            this.toastStats[type]++;
        } else {
            this.toastStats[type] = Math.max(0, this.toastStats[type] - 1);
        }

        // Dispatch event để UI có thể update
        const event = new CustomEvent('toastStatsUpdated', {
            detail: { type, count: this.toastStats[type], allStats: this.toastStats }
        });
        document.dispatchEvent(event);
    }

    // Tạo element toast
    createToastElement(toast) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // Create toast element
        const toastElement = document.createElement('div');
        toastElement.className = `toast show shadow mt-0 border-${toast.type} toast-enter`;
        toastElement.setAttribute('data-id', toast.id);

        // Determine text color class for body
        let textColorClass;
        if (toast.type === 'warning' || toast.type === 'danger') {
            textColorClass = 'text-dark';
        } else {
            textColorClass = `text-${toast.type}`;
        }

        // Get icon for toast type
        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            danger: 'fas fa-times-circle'
        };

        // Create toast HTML structure
        toastElement.innerHTML = `
      <div class="toast-header bg-${toast.type} text-white">
        <i class="${icons[toast.type]} me-2"></i>
        <strong class="me-auto">${toast.title}</strong>
        <button type="button" class="btn-close btn-close-white ms-2 mb-1" onclick="window.toastSystem.removeToast(${toast.id})"></button>
      </div>
      <div class="toast-body ${toast.type}-bg ${textColorClass}">
        ${toast.message}
      </div>
      <div class="toast-progress bg-${toast.type}"></div>
    `;

        // Insert at the beginning of container
        container.insertBefore(toastElement, container.firstChild);

        // Remove the enter animation class after animation completes
        setTimeout(() => {
            toastElement.classList.remove('toast-enter');
        }, 400);
    }

    // Remove toast
    removeToast(id) {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index !== -1) {
            // Update statistics
            this.updateStats(this.toasts[index].type, false);

            // Remove from array
            this.toasts.splice(index, 1);

            // Find and animate out DOM element
            const toastElement = document.querySelector(`[data-id="${id}"]`);
            if (toastElement) {
                // Add leave animation
                toastElement.classList.add('toast-leave');

                // Remove from DOM after animation completes
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        toastElement.parentNode.removeChild(toastElement);
                    }
                }, 400);
            }
        }
    }

    // Xóa tất cả toast
    clearAllToasts() {
        // Add leave animation to all toasts
        const toastElements = document.querySelectorAll('.toast');
        toastElements.forEach(element => {
            element.classList.add('toast-leave');
        });

        // Clear arrays and DOM after animation
        setTimeout(() => {
            this.toasts = [];
            const container = document.getElementById('toast-container');
            if (container) {
                container.innerHTML = '';
            }

            // Reset statistics
            Object.keys(this.toastStats).forEach(type => {
                this.toastStats[type] = 0;
                this.updateStats(type, false);
            });
        }, 400);
    }

    // Get current stats
    getStats() {
        return { ...this.toastStats };
    }

    // Get current toasts
    getToasts() {
        return [...this.toasts];
    }
}


// Tạo instance global
window.toastSystem = new ToastSystem();

// Shorthand functions cho dễ sử dụng
window.showToast = (title, message, type, duration) => {
    return window.toastSystem.showToast(title, message, type, duration);
};

window.showInfo = (message, title = "Thông báo", duration) => {
    return window.showToast(title, message, 'info', duration);
};

window.showSuccess = (message, title = "Thông báo", duration) => {
    return window.showToast(title, message, 'success', duration);
};

window.showWarning = (message, title = "Cảnh báo", duration) => {
    return window.showToast(title, message, 'warning', duration);
};

window.showError = (message, title = "Cảnh báo", duration) => {
    return window.showToast(title, message, 'danger', duration);
};

// Auto init khi DOM ready
document.addEventListener('DOMContentLoaded', function () {
    window.toastSystem.init();
});

// Export cho module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastSystem;
}