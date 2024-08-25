import { Plugin } from 'obsidian';

export default class MermaidPopupPlugin extends Plugin {
    async onload() {
        console.log('Loading Mermaid Popup Plugin');
        this.registerMermaidPopup();
    }

    onunload() {
        console.log('Unloading Mermaid Popup Plugin');
    }

    registerMermaidPopup() {
        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            const target = evt.target as HTMLElement;
            const mermaidDiv = target.closest('.mermaid') as HTMLElement;
            if (mermaidDiv) {
                const svg = mermaidDiv.querySelector('svg');
                if (svg) {
                    this.openPopup(svg as SVGSVGElement);
                }
            }
        });
    }

    openPopup(svgElement: SVGSVGElement) {
        const svgContent = svgElement.outerHTML;
        const svgWidth = svgElement.viewBox.baseVal.width;
        const svgHeight = svgElement.viewBox.baseVal.height;

        const overlay = document.createElement('div');
        overlay.classList.add('popup-overlay');

        const popup = document.createElement('div');
        popup.classList.add('popup-content', 'draggable', 'resizable');
        popup.innerHTML = svgContent;

        // Create a container for the control buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        // Create zoom in and zoom out buttons
        const zoomInButton = document.createElement('button');
        zoomInButton.classList.add('control-button', 'zoom-in');
        zoomInButton.textContent = '+';

        const zoomOutButton = document.createElement('button');
        zoomOutButton.classList.add('control-button', 'zoom-out');
        zoomOutButton.textContent = '-';

        // Create arrow buttons
        const upButton = document.createElement('button');
        upButton.classList.add('control-button', 'arrow-up');
        upButton.textContent = '↑';

        const downButton = document.createElement('button');
        downButton.classList.add('control-button', 'arrow-down');
        downButton.textContent = '↓';

        const leftButton = document.createElement('button');
        leftButton.classList.add('control-button', 'arrow-left');
        leftButton.textContent = '←';

        const rightButton = document.createElement('button');
        rightButton.classList.add('control-button', 'arrow-right');
        rightButton.textContent = '→';

        // Create a close button
        const closeButton = document.createElement('button');
        closeButton.classList.add('control-button', 'close-popup');
        closeButton.textContent = 'X';

        // Append buttons to the button container
        buttonContainer.appendChild(zoomInButton);
        buttonContainer.appendChild(zoomOutButton);
        buttonContainer.appendChild(upButton);
        buttonContainer.appendChild(downButton);
        buttonContainer.appendChild(leftButton);
        buttonContainer.appendChild(rightButton);
        buttonContainer.appendChild(closeButton);

        // Append popup and button container to the overlay
        overlay.appendChild(popup);
        overlay.appendChild(buttonContainer);
        document.body.appendChild(overlay);

        // Adjust SVG size to fit the popup-content
        this.adjustSvgSize(popup.querySelector('svg') as SVGSVGElement, popup);

        // Close popup on overlay click
        overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Stop propagation to prevent closing when clicking on popup content
        popup.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        // Stop propagation to prevent closing when clicking on control buttons and container
        buttonContainer.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        zoomInButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.zoomPopup(popup, 1.1, overlay);
        });

        zoomOutButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.zoomPopup(popup, 0.9, overlay);
        });

        upButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(popup, 0, -20);
        });

        downButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(popup, 0, 20);
        });

        leftButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(popup, -20, 0);
        });

        rightButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(popup, 20, 0);
        });

        closeButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            document.body.removeChild(overlay);
        });

        // Make the popup draggable
        this.makeDraggable(popup);

        // Make the popup resizable
        popup.classList.add('resizable');

        // Initialize popup position if not already set
        if (!popup.style.transform) {
            popup.style.transform = 'translate(0px, 0px)';
        }

        // Add mouse wheel event for zooming
        popup.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            const scale = evt.deltaY < 0 ? 1.1 : 0.9;
            this.zoomPopupAtCursor(popup, scale, overlay, evt);
        });
    }

    // Helper method to move the popup
    movePopup(popup: HTMLElement, dx: number, dy: number) {
        const style = window.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);

        // Calculate new position
        const newX = matrix.m41 + dx;
        const newY = matrix.m42 + dy;

        popup.style.transform = `translate(${newX}px, ${newY}px) scale(${matrix.a})`;
    }

    // Helper method to zoom the popup and SVG
    zoomPopup(popup: HTMLElement, scale: number, overlay: HTMLElement) {
        const style = window.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);
        const currentScale = matrix.a;
        const newScale = currentScale * scale;

        // Get the center point of the overlay
        const overlayRect = overlay.getBoundingClientRect();
        const overlayCenterX = overlayRect.left + overlayRect.width / 2;
        const overlayCenterY = overlayRect.top + overlayRect.height / 2;

        // Get the current position of the popup
        const popupRect = popup.getBoundingClientRect();
        const popupCenterX = popupRect.left + popupRect.width / 2;
        const popupCenterY = popupRect.top + popupRect.height / 2;

        // Calculate the distance from the popup center to the overlay center
        const offsetX = overlayCenterX - popupCenterX;
        const offsetY = overlayCenterY - popupCenterY;

        // Adjust the translation to keep the popup centered relative to the overlay
        const newX = matrix.m41 + offsetX * (1 - scale);
        const newY = matrix.m42 + offsetY * (1 - scale);

        popup.style.transformOrigin = 'center center'; // Ensure scaling is centered
        popup.style.transform = `translate(${newX}px, ${newY}px) scale(${newScale})`;
    }

    // Helper method to zoom the popup at the cursor position
    zoomPopupAtCursor(popup: HTMLElement, scale: number, overlay: HTMLElement, evt: WheelEvent) {
        const style = window.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);
        const currentScale = matrix.a;
        const newScale = currentScale * scale;

        // Get the mouse position relative to the overlay
        const overlayRect = overlay.getBoundingClientRect();
        const mouseX = evt.clientX - overlayRect.left;
        const mouseY = evt.clientY - overlayRect.top;

        // Get the current position of the popup
        const popupRect = popup.getBoundingClientRect();
        const popupCenterX = popupRect.left + popupRect.width / 2;
        const popupCenterY = popupRect.top + popupRect.height / 2;

        // Calculate the distance from the popup center to the mouse position
        const offsetX = mouseX - popupCenterX;
        const offsetY = mouseY - popupCenterY;

        // Adjust the translation to zoom at the mouse position
        const newX = matrix.m41 - offsetX * (scale - 1);
        const newY = matrix.m42 - offsetY * (scale - 1);

        popup.style.transformOrigin = 'center center'; // Ensure scaling is centered
        popup.style.transform = `translate(${newX}px, ${newY}px) scale(${newScale})`;
    }

    // Helper method to adjust SVG size to fit the popup
    adjustSvgSize(svgElement: SVGSVGElement, popup: HTMLElement) {
        const svgRect = svgElement.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();

        const svgWidth = svgRect.width;
        const svgHeight = svgRect.height;
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;

        let scaleX = popupWidth / svgWidth;
        let scaleY = popupHeight / svgHeight;
        let scale = Math.min(scaleX, scaleY);

        if (scale < 1) {
            svgElement.style.width = `${svgWidth * scale}px`;
            svgElement.style.height = `${svgHeight * scale}px`;
        } else {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
        }

        svgElement.style.transformOrigin = 'center center'; // Center transform origin
        svgElement.style.position = 'absolute';
        svgElement.style.top = '50%';
        svgElement.style.left = '50%';
        svgElement.style.transform = 'translate(-50%, -50%)';
    }

    // Helper method to make the popup draggable
    makeDraggable(element: HTMLElement) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        const mouseDownHandler = (e: MouseEvent) => {
            isDragging = true;
            const style = window.getComputedStyle(element);
            const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);
            startX = e.clientX - matrix.m41;
            startY = e.clientY - matrix.m42;
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        };

        const mouseMoveHandler = (e: MouseEvent) => {
            if (!isDragging) return;

            const style = window.getComputedStyle(element);
            const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);

            // 直接计算当前鼠标位置与起始位置的差值
            initialX = e.clientX - startX;
            initialY = e.clientY - startY;

            element.style.transform = `translate(${initialX}px, ${initialY}px) scale(${matrix.a})`;
        };

        const mouseUpHandler = () => {
            isDragging = false;
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };

        element.addEventListener('mousedown', mouseDownHandler);
    }
}