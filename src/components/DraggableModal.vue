<template>
    <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true" data-bs-backdrop="static"
        data-bs-keyboard="false">
        <div class="modal-dialog" :class="['modal-' + size, { 'modal-dialog-scrollable': scrollable }]"
            ref="modalDialogRef">
            <div class="modal-content draggable-modal">
                <!-- HEADER -->
                <div class="modal-header" ref="modalHeaderRef">
                    <h5 class="modal-title d-flex align-items-center">
                        <i v-if="draggable" class="fas fa-arrows-alt modal-icon"></i>
                        {{ title }}
                        <slot name="header-extra"></slot>
                    </h5>

                    <div class="d-flex align-items-center">
                        <small class="drag-indicator me-2" v-if="draggable">
                            <i class="fas fa-grip-horizontal"></i>
                        </small>
                        <button v-if="closable" type="button" class="btn-close" @click="hideModal"
                            aria-label="Close"></button>
                    </div>
                </div>

                <!-- BODY -->
                <div class="modal-body" ref="modalBodyRef">
                    <slot name="body"></slot>
                </div>

                <!-- FOOTER -->
                <div class="modal-footer" v-if="$slots.footer">
                    <slot name="footer"></slot>
                </div>

            </div>
        </div>
    </div>
</template>



<script setup>
import { ref, reactive, nextTick, onMounted, onUnmounted, watch } from "vue";
import * as bootstrap from "bootstrap";


/* ------------ PROPS ------------ */
const props = defineProps({
    show: { type: Boolean, default: false },
    title: { type: String, default: '' },
    size: {
        type: String,
        default: 'md',
        validator: v => ['sm', 'md', 'lg', 'xl', 'xxl'].includes(v)
    },
    draggable: { type: Boolean, default: true },
    closable: { type: Boolean, default: true },
    animation: {
        type: String,
        default: 'slide-up',
        validator: v =>
            [
                'fade', 'scale', 'slide-down', 'slide-up',
                'slide-left', 'slide-right', 'flip', 'zoom',
                'bounce', 'rotate'
            ].includes(v)
    },
    scrollable: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'open']);

const modalRef = ref(null);
const modalDialogRef = ref(null);
const modalHeaderRef = ref(null);
const modalInstance = ref(null);

// Dragging state
const dragState = reactive({
    isDragging: false,
    currentX: 0,
    currentY: 0,
    initialX: 0,
    initialY: 0,
    xOffset: 0,
    yOffset: 0,
    animationId: null,
    lastMoveTime: 0
});

// Modal visibility management
const showModal = () => {
    if (modalRef.value) {
        // Pre-calculate and set z-index before showing modal
        const openCount = document.querySelectorAll('.modal.show').length;
        const baseModal = 1050;
        const step = 20;
        const newZIndex = baseModal + ((openCount + 1) * step);

        // Set z-index immediately to prevent jank
        modalRef.value.style.zIndex = newZIndex;

        // Reset any previous transforms to prevent jank on reopen
        if (modalDialogRef.value) {
            modalDialogRef.value.style.transform = 'translate3d(0px, 0px, 0px)';
        }

        document.body.style.overflow = 'hidden';
        // Lấy hoặc tạo instance modal
        let modal = bootstrap.Modal.getInstance(modalRef.value);
        if (!modal) {
            modal = new bootstrap.Modal(modalRef.value, {
                backdrop: 'static',
                keyboard: true
            });
            modalInstance.value = modal;
        }
        modal.show();
        emit('open');
    }
};

const hideModal = () => {
    if (!modalRef.value) return;
    const modal = bootstrap.Modal.getInstance(modalRef.value);
    if (modal) {
        modal.hide();
    }
    // Restore body overflow when modal closes
    document.body.style.overflow = '';
    emit('close');
};

// Dragging functionality
const initDragging = () => {
    if (!props.draggable || !modalDialogRef.value || !modalHeaderRef.value) return;

    modalDialogRef.value.style.position = 'relative';
    modalDialogRef.value.style.willChange = 'transform';

    modalHeaderRef.value.addEventListener('mousedown', dragStart, { passive: false });
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', dragEnd, { passive: true });
    modalHeaderRef.value.addEventListener('selectstart', (e) => e.preventDefault());
};

const dragStart = (e) => {
    if (e.target.closest('.btn-close') || e.target.closest('.modal-title button')) {
        return;
    }

    e.preventDefault();

    dragState.initialX = e.clientX - dragState.xOffset;
    dragState.initialY = e.clientY - dragState.yOffset;

    if (e.target === modalHeaderRef.value || modalHeaderRef.value.contains(e.target)) {
        dragState.isDragging = true;
        modalDialogRef.value.classList.add('dragging');
        modalHeaderRef.value.classList.add('dragging');

        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';
    }
};

const handleMouseMove = (e) => {
    if (!dragState.isDragging) return;

    const now = Date.now();
    if (now - dragState.lastMoveTime < 16) return;
    dragState.lastMoveTime = now;

    e.preventDefault();

    const newX = e.clientX - dragState.initialX;
    const newY = e.clientY - dragState.initialY;

    if (dragState.animationId) {
        cancelAnimationFrame(dragState.animationId);
    }

    dragState.animationId = requestAnimationFrame(() => {
        updatePosition(newX, newY);
    });
};

const updatePosition = (newX, newY) => {
    const modalRect = modalDialogRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const minVisible = 50;
    const maxX = viewportWidth - minVisible;
    const maxY = viewportHeight - minVisible;
    const minX = -(modalRect.width - minVisible);
    const minY = -50;

    dragState.currentX = Math.max(minX, Math.min(newX, maxX - modalRect.left + dragState.currentX));
    dragState.currentY = Math.max(minY, Math.min(newY, maxY - modalRect.top + dragState.currentY));

    dragState.xOffset = dragState.currentX;
    dragState.yOffset = dragState.currentY;

    setTranslate(dragState.currentX, dragState.currentY);
};

const dragEnd = () => {
    if (!dragState.isDragging) return;

    dragState.initialX = dragState.currentX;
    dragState.initialY = dragState.currentY;

    dragState.isDragging = false;
    modalDialogRef.value.classList.remove('dragging');
    modalHeaderRef.value.classList.remove('dragging');

    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (dragState.animationId) {
        cancelAnimationFrame(dragState.animationId);
        dragState.animationId = null;
    }
};

const setTranslate = (xPos, yPos) => {
    modalDialogRef.value.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
};

const resetPosition = () => {
    // Reset drag state
    dragState.currentX = 0;
    dragState.currentY = 0;
    dragState.initialX = 0;
    dragState.initialY = 0;
    dragState.xOffset = 0;
    dragState.yOffset = 0;

    // Reset transform with smooth transition to prevent jank
    if (modalDialogRef.value) {
        // Add transition temporarily for smooth reset
        modalDialogRef.value.style.transition = 'transform 0.1s ease-out';
        modalDialogRef.value.style.transform = 'translate3d(0px, 0px, 0px)';

        // Remove transition after reset to allow smooth dragging
        setTimeout(() => {
            if (modalDialogRef.value) {
                modalDialogRef.value.style.transition = '';
            }
        }, 100);
    }

    // Clean up dragging state
    if (dragState.isDragging) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        dragState.isDragging = false;
        modalDialogRef.value?.classList.remove('dragging');
        modalHeaderRef.value?.classList.remove('dragging');
    }

    // Cancel any pending animation frames
    if (dragState.animationId) {
        cancelAnimationFrame(dragState.animationId);
        dragState.animationId = null;
    }
};

/* ------------ CLEANUP ------------ */
const cleanup = () => {
    modalHeaderRef.value?.removeEventListener("mousedown", dragStart);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", dragEnd);

    // Dispose modal instance khi component bị unmount
    if (modalInstance.value) {
        modalInstance.value.dispose();
        modalInstance.value = null;
    }
};

// Lifecycle


onMounted(() => {
    if (modalRef.value) {
        // Handle backdrop z-index after modal is shown
        modalRef.value.addEventListener('show.bs.modal', (e) => {
            // Modal z-index is already set in showModal(), just handle backdrop
            const modal = e.target;
            const currentZIndex = parseInt(modal.style.zIndex) || 1050;
            const backdropZIndex = currentZIndex - 10; // Backdrop should be 10 less than modal

            // Use a small delay to ensure backdrop is created by Bootstrap
            setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop:not(.stacked)');
                if (backdrops.length) {
                    const last = backdrops[backdrops.length - 1];
                    last.style.zIndex = backdropZIndex;
                    last.classList.add('stacked');
                }
            }, 70); // Increased delay to ensure backdrop is ready
        });

        modalRef.value.addEventListener('shown.bs.modal', (e) => {
            const modal = e.target;

            // Focus on the modal to ensure ESC key works for this modal only
            modal.focus();

            // Set tabindex to make modal focusable
            modal.setAttribute('tabindex', '-1');

            // Ensure this modal is the active one for keyboard events
            const allModals = document.querySelectorAll('.modal.show');
            allModals.forEach(m => {
                if (m !== modal) {
                    m.setAttribute('tabindex', '-2'); // Lower priority
                }
            });

            // Modal is now fully shown, initialize dragging
            resetPosition();
            if (props.draggable) {
                // Use nextTick to ensure DOM is ready
                nextTick(() => {
                    initDragging();
                });
            }
        });

        modalRef.value.addEventListener('hidden.bs.modal', () => {
            resetPosition();

            // Restore focus to the previous modal if any
            const remainingModals = document.querySelectorAll('.modal.show');
            if (remainingModals.length > 0) {
                const topModal = Array.from(remainingModals).reduce((prev, current) => {
                    const prevZ = parseInt(prev.style.zIndex) || 0;
                    const currentZ = parseInt(current.style.zIndex) || 0;
                    return currentZ > prevZ ? current : prev;
                });
                topModal.focus();
                topModal.setAttribute('tabindex', '-1');
            }
            document.body.style.overflow = '';
            emit('close');
        });

        // Handle ESC key to close only the top modal
        modalRef.value.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Check if this is the top modal
                const allModals = document.querySelectorAll('.modal.show');
                const topModal = Array.from(allModals).reduce((prev, current) => {
                    const prevZ = parseInt(prev.style.zIndex) || 0;
                    const currentZ = parseInt(current.style.zIndex) || 0;
                    return currentZ > prevZ ? current : prev;
                });

                // Only close if this is the top modal
                if (topModal === modalRef.value) {
                    e.preventDefault();
                    e.stopPropagation();
                    hideModal();
                }
            }
        });
    }

    /* Auto-open / close by props.show */
    watch(() => props.show, (v) => {
        v ? showModal() : hideModal();
    }, { immediate: true });
});

onUnmounted(() => {
    cleanup();
});


</script>

<style scoped>
.dragging {
    user-select: none;
    cursor: move !important;
}

.modal-xxl {
    max-width: 1500px;
}
</style>
