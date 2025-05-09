import { Plugin, MarkdownView, setIcon  } from 'obsidian';
import MermaidPopupSettingTab from './settings';

interface MermaidPopupSetting {
    kvMap: Record<string, string>;
    kvMapDefault: Record<string, string>;
    kvMapReserved: Record<string, string>;

    PopupSizeInitValue:string;
    kvMapPopupSizeInit: Record<string, string>;

    DiagramHeightVal:string;
    DiagramHeightMin:string;
    DiagramHeightMax:string;
    DiagramHeightStep:string;

    ZoomRatioValue:string;
    kvMapZoomRatio: Record<string, string>;
    MoveStepValue:string;
    kvMapMoveStep: Record<string, string>;

    open_btn_pos_x:string;
    open_btn_pos_y:string;
    bgColorLight:string;
    bgColorDark:string;
    bgAlpha:string;
    bgAlphaStep:Record<string, string>;
    bgIsBlur:string;
};

const DEFAULT_SETTINGS: MermaidPopupSetting = {
    kvMap: {},
    kvMapDefault: {
        'Mermaid':'.mermaid'
    },
    kvMapReserved:{
        'Reserved': '.diagram-popup'
    },
    PopupSizeInitValue:'1.50',
    kvMapPopupSizeInit:{
        '1.00':'1.00',
        '1.25':'1.25',        
        '1.50':'1.50',
        '1.75':'1.75',
        '2.00':'2.00',
        '2.25':'2.25',        
        '2.50':'2.50',
        '2.75':'2.75',
        '3.00':'3.00'        
    },

    DiagramHeightVal:'600',
    DiagramHeightMin:'50',
    DiagramHeightMax:'1500',
    DiagramHeightStep:'50',

    ZoomRatioValue:'0.2',
    kvMapZoomRatio:{
        '0.1':'0.1',
        '0.2':'0.2',
        '0.3':'0.3',
        '0.4':'0.4'
    },
    MoveStepValue:'30',
    kvMapMoveStep:{
        '20':'20',
        '30':'30',
        '40':'40',
        '50':'60',
        '60':'60',
    },
    open_btn_pos_x:'35',
    open_btn_pos_y:'90',
    bgColorLight:'rgba(255,255,255, 0.5)',
    bgColorDark:'rgba(51,51,51, 0.5)',
    bgAlpha:'0.5',
    bgAlphaStep:{
        '0.0':'0.0',
        '0.1':'0.1',
        '0.2':'0.2',
        '0.3':'0.3',
        '0.4':'0.4',
        '0.5':'0.5',
        '0.6':'0.6',
        '0.7':'0.7',
        '0.8':'0.8',
        '0.9':'0.9',
        '1.0':'1.0'
    },  
    bgIsBlur:'1'
};

export default class MermaidPopupPlugin extends Plugin {
    settings!: MermaidPopupSetting;
    observer_editting!:MutationObserver | null;
    observer_reading!:MutationObserver | null; 

    class_editBlockBtn = 'edit-block-button';
    class_openPopupBtn='mermaid-popup-button';
    class_openPopupBtnReading='mermaid-popup-button-reading';
    class_openPopupBtn_container='mermaid-popup-button-container';
    class_openPopupBtnReading_container='mermaid-popup-button-reading-container';
    async onload() {
        console.log(`Loading ${this.manifest.name} ${this.manifest.version}`);

        // 加载设置
        await this.loadSettings();

        // 添加设置页面
        this.addSettingTab(new MermaidPopupSettingTab(this.app, this));

        // this.registerMarkdownPostProcessor((element, context) => {
        //     console.log('PostProcessor element', element);
        //     console.log('PostProcessor context', context);
        // });

        // // 监听文档切换事件
        // this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
        //         let view = this.app.workspace.getActiveViewOfType(MarkdownView);
        //         //if (leaf && leaf.view && leaf.view.file) {
        //         if (view && view.file) {
        //         // 获取当前打开的文件名
        //             const fileName = view.file.name;
        //             console.log(`打开的文档是: ${fileName}`);
        //             let container = view.containerEl;
        //             let targetArr = this.GetSettingsClassElementAll(container);    
        //             console.log('leaf-change, targetArr.length', targetArr.length)                
        //         }
        //     }
        // ));
      
        // 监听模式切换事件
        this.registerEvent(this.app.workspace.on('layout-change', () => {
            //console.log('layout-change');
            let view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!view){ // 文档编辑全部关闭
                this.RelaseWhenfileClose();
            }
            if (view) {
                // 类型断言为 MarkdownView，以便访问 contentEl
                let container = view.containerEl;
                let targetArr = this.GetSettingsClassElementAll(container);
                //console.log('layout-change targetArr.length', targetArr.length);
                if (targetArr.length == 0)
                {
                    //console.log('layout-change break', targetArr.length);
                    this.RelaseWhenfileClose();
                }

                for(var i=0;i<targetArr.length;i++)
                {
                    this.addPopupButton(targetArr[i] as HTMLElement);
                }

                this.ObserveToAddPopupButton(container);
             }
        }));
    }

    RelaseWhenfileClose()
    {
        this.observer_editting?.disconnect();
        this.observer_editting = null;
        this.observer_reading?.disconnect();
        this.observer_reading = null;  
    }

    onunload() {
        console.log(`Unloading ${this.manifest.name} ${this.manifest.version}`);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }  

    isPreviewMode(){
        let view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view && view.getMode() == "preview";
    }

    getOpenBtnInMd_Mark_ByParam(isPreviewMode:boolean){
        let popupButtonClass = this.class_openPopupBtn;
        let popupButtonClass_container = this.class_openPopupBtn_container;
        if (isPreviewMode){
            popupButtonClass = this.class_openPopupBtnReading;
            popupButtonClass_container = this.class_openPopupBtnReading_container;
        }
        return {popupButtonClass, popupButtonClass_container}
    }

    // 获取 
    getOpenBtnInMd_Mark(){
        let popupButtonClass = this.class_openPopupBtn;
        let popupButtonClass_container = this.class_openPopupBtn_container;
        if (this.isPreviewMode()){
            popupButtonClass = this.class_openPopupBtnReading;
            popupButtonClass_container = this.class_openPopupBtnReading_container;
        }
        return {popupButtonClass, popupButtonClass_container}
    }
    // monitor new element add to edit view 
    ObserveToAddPopupButton(myView: HTMLElement){
        if (this.observer_editting)
            return;
        this.observer_editting = new MutationObserver((mutationsList, observer) => {

            let containerArr = this.GetSettingsClassElementAll(myView);
            for(var i=0;i<containerArr.length;i++){
                let container = containerArr[i] as HTMLElement;
                if(this.IsClassListContains_SettingsDiagramClass(container)){
                    this.addPopupButton(container); 
                }
            }
        });

        this.observer_editting.observe(myView, { childList: true, subtree: true});
    }
    // monitor new element add to read view 
    ObserveToAddPopupButton_Reading(myView: HTMLElement){
        if (this.observer_reading)
            return;
        this.observer_reading = new MutationObserver((mutationsList, observer) => {
            let containerArr = this.GetSettingsClassElementAll(myView);
            for(var i=0;i<containerArr.length;i++){
                let container = containerArr[i] as HTMLElement;
                if(this.IsClassListContains_SettingsDiagramClass(container)){
                    this.addPopupButton(container); 
                }
            }
        });

        this.observer_reading.observe(myView, { childList: true, subtree: true});
    }  

    GetSettingsClassElement(contentEl:HTMLElement){
        let selector = this.GetSettingsDiagramClassNameAll().join(', ');
        return contentEl.querySelector(selector);
    }
    
    GetSettingsClassElementAll(contentEl:HTMLElement){
        let selector = this.GetSettingsDiagramClassNameAll().join(', ');
        return contentEl.querySelectorAll(selector);
    }

    GetSettingsDiagramClassNameAll(){
        let mapDiagramClassAll =  { ...this.settings.kvMapReserved, ...this.settings.kvMapDefault, ...this.settings.kvMap };
        return Object.values(mapDiagramClassAll);
    }

    // Add a button to each Mermaid diagram for triggering the popup
    addPopupButton(target: HTMLElement) {
        let {popupButtonClass} = this.getOpenBtnInMd_Mark();

        let popupButton = target.previousElementSibling as HTMLElement;
        // return if exist
        if (popupButton){
            this.adjustDiagramWidthAndHeight_ToContainer(target);
            return;
        }
        // Create the popup button
        popupButton = target.doc.createElement('div');
        popupButton.classList.add(popupButtonClass);
        popupButton.textContent = 'Open Popup';
        setIcon(popupButton, 'maximize');
        popupButton.title = 'Open Popup';
        target.insertAdjacentElement('beforebegin', popupButton);

        this.adjustDiagramWidthAndHeight_ToContainer(target);
        let container_btn = target.parentElement;
        container_btn = container_btn as HTMLElement;
        if(this.isPreviewMode())
            container_btn.setCssStyles({position:'relative'});
        this.setPopupBtnPos(popupButton, container_btn);

        // bind click to popup
        this.registerDomEvent(target, 'click', this.handleMermaidClick);

        let isDragging = false;

        // Add click event listener for the button to open the popup
        popupButton.addEventListener('click', (evt) => {
            // Only trigger popup if no dragging occurred
            if (!isDragging) {
                evt.stopPropagation(); // Prevent triggering any other click events
                this.openPopup(target);
            }
            // Reset the dragging flag after click
            isDragging = false;
        });

        popupButton.setCssStyles({display:'none'});
        this.makePopupButtonDisplay_WhenHoverOnContainer(popupButton, target.parentElement as HTMLElement);
    }

    makePopupButtonDisplay_WhenHoverOnContainer(button:HTMLElement, container:HTMLElement){
        container.addEventListener('mouseenter', () => {
            button.setCssStyles({display:'block'});
        });
        
        container.addEventListener('mouseleave', () => {
            button.setCssStyles({display:'none'});
        });
    }

    setPopupBtnPos(btn: HTMLElement, target: HTMLElement){

        btn.setCssStyles({
            right: this.settings.open_btn_pos_x + 'px'
        });

        // let w_b = this.getWidth(btn);
        // let w = this.getWidth(target);
        // let x_setting = this.settings.open_btn_pos_x;
        // let left = this.getWidth(target) * parseFloat(x_setting) / 100;
        // left = (left+w_b) > w ? (left-w_b) : left;
        // left = left < 0 ? 0 : left;
        // btn.setCssStyles({
        //     left: this.settings.open_btn_pos_x + '%'
        // });

        // let h_b = this.getHeight(btn);
        // let h = this.getHeight(target);
        // let y_setting = this.settings.open_btn_pos_y;
        // let top = this.getHeight(target) * parseFloat(y_setting) / 100
        // top = (top+h_b) > h ? (top-h_b) : top;
        // top = top < 0 ? 0 : top;
        // btn.setCssStyles({
        //     top: top + 'px'
        // });
    }

    adjustDiagramWidthAndHeight_ToContainer(container: HTMLElement){

        let dig_Ele = this.getDiagramElement(container) as HTMLElement;
        if (!dig_Ele)
            return;

        let des_w = this.getWidth(dig_Ele);
        let des_h = this.getHeight(dig_Ele);

        let container_width = this.getWidth(container);
        let rate_by_width = 1;
        if (des_w > container_width) // 图表宽超容器
        {
            rate_by_width = container_width / des_w;
        }
            
        let rate_by_height = 1;
        let dg_h_val = parseInt(this.settings.DiagramHeightVal);
        if (des_h > dg_h_val) // 图表高超容器
        {
            rate_by_height = dg_h_val / des_h;
        }

        if (rate_by_width == 1 && rate_by_height == 1)
            return;

        let rate = rate_by_width < rate_by_height ? rate_by_width : rate_by_height;

        dig_Ele.setCssStyles({
            height: des_h*rate + 'px',
            width: des_w*rate + 'px'
        });
        container.setCssStyles({
            height: des_h*rate + 'px',
            width: des_w*rate + 'px'
        });        
    }

    getWidth(ele:HTMLElement){
        return parseFloat(ele.getCssPropertyValue('width'));
    }

    getHeight(ele:HTMLElement){
        return parseFloat(ele.getCssPropertyValue('height'));
    }

    getDiagramElement(container: HTMLElement){
        let diagramSvg = Array.from(container.children).find(child => child.tagName.toLowerCase() === 'svg');
        if (diagramSvg){
            return diagramSvg;
        }

        let diagramImg = Array.from(container.children).find(child => child.tagName.toLowerCase() === 'img');
        if (diagramImg)
            return diagramImg;

        return null;
    }

    GetPosButtonToMermaid(eleBtn: HTMLElement, eleDiv: HTMLElement){
        // 获取按钮和 div 的位置信息
        const divRect = eleDiv.getBoundingClientRect();
        const buttonRect = eleBtn.getBoundingClientRect();

        // 计算按钮相对于 div 的位置
        const buttonRelativeTop = buttonRect.top - divRect.top;
        const buttonRelativeLeft = buttonRect.left - divRect.left;
        return { top: buttonRelativeTop, left:buttonRelativeLeft};
    }

    IsClassListContains_SettingsDiagramClass(ele:HTMLElement){
        if (ele.classList == null || ele.classList.length == 0)
            return false;
        let classnameArr = this.GetSettingsDiagramClassNameAll();
        for(var i=0;i<classnameArr.length;i++){
            let name = classnameArr[i];
            name = name.substring(1);
            if (ele.classList.contains(name))
                return true;
        }
        return false;
    }

    GetSettingsClassElementClosest(startElement:HTMLElement){
        
        let _parent = startElement;

        while(_parent){
            if(this.IsClassListContains_SettingsDiagramClass(_parent)){
                return _parent;
            }

            if (_parent.parentElement)
                _parent = _parent.parentElement;
            else 
                break;
        }
        return null
    }

    // 绑定新的事件处理
    handleMermaidClick = (evt: MouseEvent) => {
        if (!evt.ctrlKey) return;
        evt.stopPropagation();

        let targetElement = evt.target as HTMLElement;
        let closestElement = this.GetSettingsClassElementClosest(targetElement);
        if(closestElement)
            this.openPopup(closestElement);
    };

    openPopup(targetElement: HTMLElement) {
        // targetElement.requestFullscreen();
        // return;

        // popup-overlay
        const overlay = targetElement.doc.createElement('div');
        overlay.classList.add('popup-overlay');
        this.setPopupBgAlpha(overlay);
        this.setPopupBgBlur(overlay);
        // copy target
        let targetElementClone = targetElement.cloneNode(true);
        let targetElementInPopup = targetElementClone as HTMLElement;
        let childElement = targetElementInPopup.querySelector('.' + this.class_openPopupBtn); // 获取需要删除的子元素
        if (childElement) {
            targetElementInPopup.removeChild(childElement); // 从父元素中删除子元素
        }
        else{
            childElement = targetElementInPopup.querySelector('.' + this.class_openPopupBtnReading); 
            if (childElement) {
                targetElementInPopup.removeChild(childElement); 
            }
        }
        targetElementInPopup.classList.add('popup-content', 'draggable', 'resizable');

        let _doc = targetElementInPopup.doc;
        // Create a container for the control buttons
        let _buttonContainer = this.createButtonContainer(_doc, targetElementInPopup, overlay);

        // Append popup and button container to the overlay
        overlay.appendChild(targetElementInPopup);
        overlay.appendChild(_buttonContainer);
        _doc.body.appendChild(overlay);

        // Close popup on overlay click
        overlay.addEventListener('click', (evt) => {
            evt.doc.body.removeChild(overlay);
        });

        // Stop propagation to prevent closing when clicking on popup content
        targetElementInPopup.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        // Listen for the Escape key to close the popup
        targetElementInPopup.doc.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape') {
                if(targetElementInPopup.doc.body.contains(overlay))
                    targetElementInPopup.doc.body.removeChild(overlay);
            }
        });    
        
        this.setPopupSize(targetElementInPopup, targetElement);

        // Make the popup draggable
        this.makeDraggable(targetElementInPopup);

        // Make the popup resizable
        targetElementInPopup.classList.add('resizable');

        // Add mouse wheel event for zooming
        targetElementInPopup.addEventListener('wheel', (evt) => {
            evt.preventDefault();

            const userAgent = navigator.userAgent;
            if (/Mac/.test(userAgent) && !evt.metaKey) {
                this.panPopupAtCursor(targetElementInPopup, evt)
            }
            else {
                const isOut = evt.deltaY > 0;
                this.zoomPopupAtCursor(targetElementInPopup, isOut, evt);
            }
        });
    }

    setPopupBgBlur(_popupElement:HTMLElement){
        if (!_popupElement) 
            return;

        let bgIsBlur = this.settings.bgIsBlur;
        let cssBgIsBlur = bgIsBlur=='1'?'blur(10px)':'';
        _popupElement.setCssStyles({
            backdropFilter:cssBgIsBlur
        })        
    }

    setPopupBgAlpha(_popupElement:HTMLElement) {
        if (!_popupElement) 
            return;

        let alpha = this.settings.bgAlpha;
        // 构造新的 rgba 值
        let newBgColor;
        if (this.isThemeLight()) {
            newBgColor = `rgba(255, 255, 255, ${alpha})`;
        } else if (this.isThemeDark()) {
            newBgColor = `rgba(51, 51, 51, ${alpha})`;
        }
        
        // 更新背景颜色和模糊效果
        _popupElement.setCssStyles({
            backgroundColor: newBgColor
        })
    }    

    isThemeLight(){
        return document.body.classList.contains('theme-light');
    }

    isThemeDark(){
        return document.body.classList.contains('theme-dark');
    }

    setPopupSize(_targetElementInPopup:HTMLElement, _targetElement:HTMLElement){
        let multiVal = parseFloat(this.settings.PopupSizeInitValue);
        if (typeof multiVal != "number"){
            return;
        }

        let width_tar_md = this.getWidth(_targetElement);
        let height_tar_md = this.getHeight(_targetElement);   
        let _diag_md = this.getDiagramElement(_targetElement) as HTMLElement;
        let width_diag_md = this.getWidth(_diag_md);
        let height_diag_md = this.getHeight(_diag_md);

        let width_tar_inpopup = this.getWidth(_targetElementInPopup);
        let height_tar_inpopup = this.getHeight(_targetElementInPopup);   
        let _diag_inpopup = this.getDiagramElement(_targetElementInPopup) as HTMLElement;
        let width_diag_inpopup = this.getWidth(_diag_inpopup);
        let height_diag_inpopup = this.getHeight(_diag_inpopup);

        _targetElementInPopup.setCssStyles({
            width: width_tar_md + 'px',
            height: height_tar_md + 'px'
        });

        _diag_inpopup.setCssStyles({
            width: width_diag_md + 'px',
            height: height_diag_md + 'px'
        });

        _targetElementInPopup.setCssStyles({
            transform: `scale(${multiVal})`
        });
    }

    createButtonContainer(_doc:Document, _targetElementInPopup:HTMLElement, _overlay:HTMLElement){
        const buttonContainer = _doc.createElement('div');
        buttonContainer.classList.add('button-container');

        // Create zoom in and zoom out buttons
        const zoomInButton = _doc.createElement('button');
        zoomInButton.classList.add('control-button', 'zoom-in');
        zoomInButton.textContent = '+';

        const zoomOutButton = _doc.createElement('button');
        zoomOutButton.classList.add('control-button', 'zoom-out');
        zoomOutButton.textContent = '-';

        // Create arrow buttons
        const upButton = _doc.createElement('button');
        upButton.classList.add('control-button', 'arrow-up');
        upButton.textContent = '↑';

        const downButton = _doc.doc.createElement('button');
        downButton.classList.add('control-button', 'arrow-down');
        downButton.textContent = '↓';

        const leftButton = _doc.doc.createElement('button');
        leftButton.classList.add('control-button', 'arrow-left');
        leftButton.textContent = '←';

        const rightButton = _doc.doc.createElement('button');
        rightButton.classList.add('control-button', 'arrow-right');
        rightButton.textContent = '→';

        // Create a close button
        const closeButton = _doc.doc.createElement('button');
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


        // Stop propagation to prevent closing when clicking on control buttons and container
        buttonContainer.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        zoomInButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.zoomPopup(_targetElementInPopup, false);
        });

        zoomOutButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.zoomPopup(_targetElementInPopup, true);
        });

        upButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(_targetElementInPopup, 0, -1);
        });

        downButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(_targetElementInPopup, 0, 1);
        });

        leftButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(_targetElementInPopup, -1, 0);
        });

        rightButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.movePopup(_targetElementInPopup, 1, 0);
        });

        closeButton.addEventListener('click', (evt) => {
            evt.stopPropagation();
            evt.doc.body.removeChild(_overlay);
        });        
        return buttonContainer;
    }

    // Helper method to move the popup
    movePopup(popup: HTMLElement, dx: number, dy: number) {
        const style = popup.win.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);

        // Calculate new position
        const newX = matrix.m41 + (dx==0 ? dx : dx * parseInt(this.settings.MoveStepValue));
        const newY = matrix.m42 + (dy==0 ? dy : dy * parseInt(this.settings.MoveStepValue));

        popup.setCssStyles({transform : `translate(${newX}px, ${newY}px) scale(${matrix.a})`});
    }

    // Helper method to zoom the popup and SVG
    zoomPopup(popup: HTMLElement, isOut:boolean) {
        this.zoomPopupCore(popup, isOut, null, 1, 1);
    }

    // Helper method to zoom the popup at the cursor position
    zoomPopupAtCursor(popup: HTMLElement, isOut:boolean, evt: WheelEvent) {

        // Get the current position of the popup. 
        // popup 当前中心坐标 = 相对客户端左上的坐标 + 自身长宽/2
        const popupRect = popup.getBoundingClientRect();
        const popupCenterX = popupRect.left + popupRect.width / 2;
        const popupCenterY = popupRect.top + popupRect.height / 2;

        // Calculate the distance from the popup center to the mouse position
        const offsetX = evt.clientX - popupCenterX;
        const offsetY = evt.clientY - popupCenterY;

        this.zoomPopupCore(popup, isOut, evt, offsetX, offsetY);
    }

    // Helper method to zoom the popup and SVG
    zoomPopupCore(popup: HTMLElement, isOut: boolean, evt: WheelEvent | null, offsetX: number, offsetY: number) {
        const style = popup.win.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);
        const currentScale = matrix.a;

        // isOut, 1.1
        let ratioValue = (isOut ? -1:1) * parseFloat(this.settings.ZoomRatioValue);

        const userAgent = navigator.userAgent;
        if (/Mac/.test(userAgent) && evt != null) {
            ratioValue = -1 * evt.deltaY / 100;
        }

        const newScale = currentScale * (1 + ratioValue);

        // Adjust the translation to keep the popup centered relative to the overlay
        const newX = matrix.m41 - offsetX * ratioValue;
        const newY = matrix.m42 - offsetY * ratioValue;

        popup.setCssStyles({
            transformOrigin : 'center center', // Ensure scaling is centered
            transform : `translate(${newX}px, ${newY}px) scale(${newScale})`
        });
    }

    panPopupAtCursor(popup: HTMLElement, evt: WheelEvent) {
        if (!evt.target)
            return;

        const ele_target = evt.target as HTMLElement;
        const style = ele_target.win.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);

        var startX = matrix.m41;
        var startY = matrix.m42;

        var initialX = startX - evt.deltaX;
        var initialY = startY - evt.deltaY;

        popup.setCssStyles({transform : `translate(${initialX}px, ${initialY}px) scale(${matrix.a})`});
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
            if (!e.target)
                return;
            const ele_target = e.target as HTMLElement;
            const style = ele_target.win.getComputedStyle(element);
            const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);
            startX = e.clientX - matrix.m41;
            startY = e.clientY - matrix.m42;
            e.doc.addEventListener('mousemove', mouseMoveHandler);
            e.doc.addEventListener('mouseup', mouseUpHandler);
            ele_target.closest('.popup-content')?.classList.add('dragging');
        };

        const mouseMoveHandler = (e: MouseEvent) => {
            if (!isDragging) return;
            if (!e.target)
                return;
            const ele_target = e.target as HTMLElement;
            const style = ele_target.win.getComputedStyle(element);
            const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);

            // 直接计算当前鼠标位置与起始位置的差值
            initialX = e.clientX - startX;
            initialY = e.clientY - startY;

            element.setCssStyles({transform : `translate(${initialX}px, ${initialY}px) scale(${matrix.a})`});
        };

        const mouseUpHandler = (e: MouseEvent) => {
            isDragging = false;
            e.doc.removeEventListener('mousemove', mouseMoveHandler);
            e.doc.removeEventListener('mouseup', mouseUpHandler);

            const ele_target = e.target as HTMLElement;
            ele_target.closest('.popup-content')?.classList.remove('dragging');
        };

        element.addEventListener('mousedown', mouseDownHandler);

        let lastScale = 1;
        let initialDistance = 0;
        let t = {scaleX:1, obliqueX:0, obliqueY:0, scaleY:1, translateX:0, translateY:0};

        element.addEventListener('touchstart', (e) => {
            e.stopPropagation(); 
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                initialX = touch.clientX;
                initialY = touch.clientY;
                
            } else if (e.touches.length === 2) {
                t = getTransform(element);
                lastScale = t.scaleX;
                initialX = e.touches[0].clientX;
                initialY = e.touches[0].clientY;                
                initialDistance = getDistance(e.touches[0], e.touches[1]);
            }
        });        
        element.addEventListener('touchmove', (e) => {
            e.stopPropagation(); 
            e.preventDefault();
            if (e.touches.length === 1) {
                t = getTransform(element);
                touch_move(e, t)
            } else if (e.touches.length === 2) {
                const distance = getDistance(e.touches[0], e.touches[1]);
                lastScale = (distance / initialDistance) * lastScale;
                initialDistance = distance;
                t = getTransform(element);
                t.scaleX = lastScale;
                t.scaleY = lastScale;
                touch_move(e, t)
            }
        });

        const touch_move = (e:TouchEvent, t:any) => {
            const touch = e.touches[0];
            const deltaX = touch.clientX - initialX;
            const deltaY = touch.clientY - initialY;

            initialX = touch.clientX;
            initialY = touch.clientY;
            let tx = t.translateX + deltaX;
            let ty = t.translateY + deltaY;
            setTransform(element, tx, ty, t.scaleX);

        }

        const getTransform = (touchArea:HTMLElement) => {
            const transform:string = window.getComputedStyle(touchArea).getPropertyValue('transform');
            if (transform && transform !== 'none') {
                // 使用正则表达式提取矩阵值
                const match = transform.match(/matrix\((.+)\)/);
                if (match) {
                    const values = match[1].split(', ').map(parseFloat);
        
                    // 确保 values 长度足够
                    if (values.length >= 6) {
                        const scaleX = values[0]; // zoom
                        const obliqueX = values[1]; // oblique
                        const obliqueY = values[2];
                        const scaleY = values[3]; // 修正为 values[3]
                        const translateX = values[4]; // 第5个值为平移x
                        const translateY = values[5]; // 第6个值为平移y

                        return { scaleX, obliqueX, obliqueY, scaleY, translateX, translateY };
                    }
                }
            }
            return {scaleX:1, obliqueX:0, obliqueY:0, scaleY:1, translateX:0, translateY:0};
        }
        
        const setTransform = (touchArea:HTMLElement, _translateX:number, _translateY:number, _scale:number) => {
            let transform = `translate(${_translateX}px, ${_translateY}px) scale(${_scale})`;
            touchArea.setCssStyles({
                transform: transform
            })  
        }

        const getDistance = (touch1:Touch, touch2:Touch) => {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        const getNumber = (_str:string) => {
            let num = parseFloat(_str);
            return isNaN(num) ? 0 : num;
        }        
    }    
}
