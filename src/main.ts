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
    class_md_containerRead = 'markdown-reading-view';
    class_md_containerEdit = 'markdown-source-view';
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
                let targetArr = this.GetSettingsClassElementAll(container) as Array<[HTMLElement, string]>;
                
                //console.log('layout-change targetArr.length', targetArr.length);
                if (targetArr == null || targetArr.length == 0)
                {
                    //console.log('layout-change break', targetArr.length);
                    this.RelaseWhenfileClose();
                }

                for(var i=0;i<targetArr.length;i++)
                {
                    this.addPopupButton(targetArr[i]);
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

    getOpenBtnInMd_Mark_editMode(){
        let popupButtonClass_edit = this.class_openPopupBtn;
        let popupButtonClass_container_edit = this.class_openPopupBtn_container;
        return {popupButtonClass_edit, popupButtonClass_container_edit}
    }

    getOpenBtnInMd_Mark_readMode(){
        let popupButtonClass_read = this.class_openPopupBtnReading;
        let  popupButtonClass_container_read = this.class_openPopupBtnReading_container;
        return {popupButtonClass_read, popupButtonClass_container_read}
    }    

    // monitor new element add to edit view 
    ObserveToAddPopupButton(myView: HTMLElement){
        if (this.observer_editting)
            return;
        this.observer_editting = new MutationObserver((mutationsList, observer) => {

            let containerArr = this.GetSettingsClassElementAll(myView) as Array<[HTMLElement, string]>;                
            for(var i=0;i<containerArr.length;i++){
                let container = containerArr[i] as [HTMLElement, string];
                let isTarget = this.IsClassListContains_SettingsDiagramClass(container[0]);

                if(isTarget){
                    this.addPopupButton(container, true); 
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
            let containerArr = this.GetSettingsClassElementAll(myView) as Array<[HTMLElement, string]>;;
            for(var i=0;i<containerArr.length;i++){
                let container = containerArr[i] as [HTMLElement, string];
                if(this.IsClassListContains_SettingsDiagramClass(container[0])){
                    this.addPopupButton(container); 
                }
            }
        });

        this.observer_reading.observe(myView, { childList: true, subtree: true});
    } 
  
    /**
     * 获取数组 目标元素 和 是否容器标志
     * @param {HTMLElement} contentEl - MD容器
     * @return {Array<[HTMLElement, string]>} - 返回数组 目标元素 和 是否容器标志）
     */
    GetSettingsClassElementAll(contentEl:HTMLElement){
        let selectors = this.GetSelectorAll(true);
        selectors = selectors as string[][];
        if (selectors == null || selectors.length ==0)
        {
            return null;
        }

        let targetArr: Array<[HTMLElement, string]> = [];
        for (var i=0;i<selectors.length;i++)
        {
            let item = selectors[i];
            let target = contentEl.querySelectorAll(item[0]);
            if (target != null && target.length > 0)
            {
                for(var j=0;j<target.length;j++)
                {
                    targetArr.push([target[j] as HTMLElement, item[1]])
                }
            }
        }

        return targetArr;
    }

    GetSelectorAll(isWithCheck:boolean=false)
    {
        let classnameArr = this.GetSettingsDiagramClassNameAll();
        let arrSelector = [];
        for(var i=0;i<classnameArr.length;i++)
        {
            var name = '';
            var chk = '';
            if (classnameArr[i].contains('|'))
            {
                var arr = classnameArr[i].split('|');
                name = arr[0];
                chk = arr[1];            
            }
            else{
                name = classnameArr[i];
            }

            // 0.2.63 之前保存classname 需要带 '.', 之后保存不需要
            // 所以这里为了兼容先清理，在添加上
            name = '.' + name.replace('.', '');
            if (isWithCheck)
            {
                arrSelector.push([name, chk]); 
            }   
            else{
                arrSelector.push(name); 
            }
                
        }
        return arrSelector;
    }

    /**
     * 转义数字开头的 class 名称
     * @param {string} className - 要检查的 class 名称
     * @return {string} - 转义后的 class（如果需要）
     */
    escapeClassName(className:string) {
        // 如果 class 以数字开头，进行转义
        if (/^\d/.test(className)) {
            // 获取第一个字符的 Unicode 转义（如 "1" -> "\31"）
            const firstChar = className.charCodeAt(0).toString(16);
            return `\\3${firstChar} ${className.slice(1)}`;
        }
        return className; // 否则直接返回
    }    

    GetSettingsDiagramClassNameAll(){
        let mapDiagramClassAll =  { ...this.settings.kvMapReserved, ...this.settings.kvMapDefault, ...this.settings.kvMap };
        return Object.values(mapDiagramClassAll);
    }

    // Add a button to each Mermaid diagram for triggering the popup
    addPopupButton(target_and_flagContainer: [HTMLElement, string], isDebug:boolean=false) {
        let target = target_and_flagContainer[0];

        // 切换模式时，如判断原模式的目标，则退出当前方法        
        if(this.isPreviewMode() && this.isParentEditting(target))
            return;

        if(!this.isPreviewMode() && this.isParentReading(target))
            return;

        let {popupButtonClass} = this.getOpenBtnInMd_Mark();

        let popupButton;   
        let flagContainer = target_and_flagContainer[1] == 'true';

        let targetContainer = flagContainer? target:target.parentElement as HTMLElement;
        popupButton = targetContainer.querySelector('.'+popupButtonClass);

        // return if exist
        if (popupButton){
            this.adjustDiagramWidthAndHeight_ToContainer(targetContainer);
            return;
        } 

        this.create_open_button(target_and_flagContainer, isDebug);
    }

    create_open_button(target_and_flagContainer: [HTMLElement, string], isDebug:boolean=false){

        let {popupButtonClass} = this.getOpenBtnInMd_Mark();
        let target = target_and_flagContainer[0];
        let flagContainer = target_and_flagContainer[1] == 'true';
        let targetContainer = flagContainer? target:target.parentElement as HTMLElement;

        // Create the popup button
        let popupButton = targetContainer.doc.createElement('div');
        popupButton.classList.add(popupButtonClass);
        popupButton.textContent = 'Open Popup';
        setIcon(popupButton, 'maximize');
        popupButton.title = 'Open Popup';

        // 插入位置
        targetContainer.insertAdjacentElement('afterbegin', popupButton);

        this.adjustDiagramWidthAndHeight_ToContainer(targetContainer);

        if(this.isPreviewMode())
            targetContainer.setCssStyles({position:'relative'});

        if (flagContainer)
        {
            targetContainer.setCssStyles({
                display: 'inline-block',
                position: 'relative'
            });     
        }

        this.setPopupBtnPos(popupButton);

        // bind click to popup
        this.registerDomEvent(target, 'click', this.handleMermaidClick);

        let isDragging = false;

        // Add click event listener for the button to open the popup
        popupButton.addEventListener('click', (evt) => {
            // Only trigger popup if no dragging occurred
            if (!isDragging) {
                evt.stopPropagation(); // Prevent triggering any other click events
                this.openPopup(targetContainer);
            }
            // Reset the dragging flag after click
            isDragging = false;
        });

        popupButton.setCssStyles({display:'none'});
        
        this.makePopupButtonDisplay_WhenHoverOnContainer(popupButton, targetContainer);
    }

    isParentReading(ele:HTMLElement){
        let parentClass = 'markdown-reading-view';
        return this.isParent(ele, this.class_md_containerRead)
    }

    isParentEditting(ele:HTMLElement){
        
        return this.isParent(ele, this.class_md_containerEdit)
    }

    isParent(ele:HTMLElement, parentClass:string){
        return ele.closest(`.${parentClass}`) !== null
    }

    makePopupButtonDisplay_WhenHoverOnContainer(button:HTMLElement, container:HTMLElement){
        container.addEventListener('mouseenter', () => {
            button.setCssStyles({display:'block'});
        });
        
        container.addEventListener('mouseleave', () => {
            button.setCssStyles({display:'none'});
        });
    }

    getAppContainerRect(ele:HTMLElement){
        return ele.doc.getElementsByClassName('app-container')[0].getBoundingClientRect();
    }

    setPopupBtnPos(btn: HTMLElement){
        let x = this.settings.open_btn_pos_x;
        let y = this.settings.open_btn_pos_y;

        btn.setCssStyles({
            right: x + 'px',
            top: y + 'px'
        });
    }

    adjustDiagramWidthAndHeight_ToContainer(container: HTMLElement, isInPopup:boolean=false){
        let coreDeepEle = this.getCoreDeepElement(container) as HTMLElement;

        // coreDeepEle 为空，则说明是容器类型
        if (!coreDeepEle)
        {
            let coreEle = this.getCoreElement(container) as HTMLElement;
            if(!coreEle)
                return;
            let dg_h_val = parseInt(this.settings.DiagramHeightVal);
            if (dg_h_val < this.getHeight(coreEle))
                this.setHeight(coreEle, dg_h_val.toString());
            return;
        }

        let coreDeep_w = this.getWidth(coreDeepEle);
        let coreDeep_h = this.getHeight(coreDeepEle);

        // 容器宽度
        let container_w_o = this.getWidth(container);

        let rate_by_width = 1;
        if (coreDeep_w > container_w_o) // 图表宽超容器
        {
            rate_by_width = container_w_o / coreDeep_w;
        }
            
        let rate_by_height = 1;
        // 设置最大高度
        let dg_h_val = parseInt(this.settings.DiagramHeightVal);
        if (coreDeep_h > dg_h_val) // 图表高超容器
        {
            rate_by_height = dg_h_val / coreDeep_h;
        }

        if (rate_by_width == 1 && rate_by_height == 1)
            return;

        let rate = rate_by_width < rate_by_height ? rate_by_width : rate_by_height;

        // 按比例缩放后的宽高
        let container_w = coreDeep_w*rate;
        let container_h = coreDeep_h*rate;
        let w = container_w;
        let h = container_h;
        if (!isInPopup)
        {
            container_w = (container_w < container_w_o) ? container_w_o : container_w;
        }

        coreDeepEle.setCssStyles({
            height: h + 'px',
            width: w + 'px'
        });
        container.setCssStyles({
            height: container_h + 'px',
            width: container_w + 'px'
        }); 
     
    }

    getWidth(ele:HTMLElement){
        return parseFloat(ele.getCssPropertyValue('width'));
    }

    getHeight(ele:HTMLElement){
        return parseFloat(ele.getCssPropertyValue('height'));
    }

    setWidth(ele:HTMLElement, w:string){
        ele.setCssStyles({width: w + 'px'});
    }

    setHeight(ele:HTMLElement, h:string){
        ele.setCssStyles({height: h + 'px'});
    }    

    /**
     * 获取容器下的目标元素
     * @param {HTMLElement} container - 目标容器
     * @return {Element | null} - 返回 容器下的目标元素 ）
     */
    getCoreElement(container: HTMLElement){
        let {popupButtonClass} = this.getOpenBtnInMd_Mark()
        let diagramSvg = container.querySelector('.' + popupButtonClass);
        if(diagramSvg)
            return diagramSvg.nextElementSibling;
        return null;
    }

    /**
     * 获取目标元素里深度内核，即svg或img等元素
     * @param {HTMLElement} container - 目标容器
     * @return {HTMLElement | null} - 返回 目标元素里深度内核 ）
     */
    getCoreDeepElement(container: HTMLElement){
        let core = this.getCoreElement(container);
        if (core == null)
            return null;
        let coreEle = core as HTMLElement;
        if (coreEle.children.length < 1)
            return null;
        return coreEle.children[0];
    }

    getCoreElement_old_before_nextSibling(container: HTMLElement){
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
        if (ele == null || ele.classList == null || ele.classList.length == 0)
            return false;
        let classnameArr = this.GetSelectorAll() as string[];
        for(var i=0;i<classnameArr.length;i++){
            let name = classnameArr[i];
            name = name.substring(1);
            if (ele.classList.contains(name))
                return true;
        }
        return false;
    }

    IsClassListContains(ele:HTMLElement, name:string){
        if (ele == null || ele.classList == null || ele.classList.length == 0)
            return false;
        if (ele.classList.contains(name))
            return true;
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

    openPopup(containerElement: HTMLElement) {
        // targetElement.requestFullscreen();
        // return;

        let _doc = containerElement.doc;
        // popup-overlay
        const overlay = _doc.createElement('div');
        overlay.classList.add('popup-overlay');
        this.setPopupBgAlpha(overlay);
        this.setPopupBgBlur(overlay);
        // copy target
        let containerElementClone = containerElement.cloneNode(true);
        let containerElementInPopup = containerElementClone as HTMLElement;
        let {popupButtonClass} = this.getOpenBtnInMd_Mark();
        let childElementArr = containerElementInPopup.querySelectorAll('.' + popupButtonClass); // 获取需要隐藏的子元素
        if (childElementArr){
            childElementArr.forEach(child => {
                let childEle = child as HTMLElement;
                this.hideElement(childEle);
            });
        }

        containerElementInPopup.classList.add('popup-content', 'draggable', 'resizable');

        // Create a container for the control buttons
        let _buttonContainer = this.createButtonContainer(containerElementInPopup, overlay);

        // Append popup and button container to the overlay
        overlay.appendChild(containerElementInPopup);
        overlay.appendChild(_buttonContainer);
        _doc.body.appendChild(overlay);
        this.adjustInPopup(containerElementInPopup);

        // Close popup on overlay click
        overlay.addEventListener('click', (evt) => {
            evt.doc.body.removeChild(overlay);
        });

        // Stop propagation to prevent closing when clicking on popup content
        containerElementInPopup.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        // Listen for the Escape key to close the popup
        containerElementInPopup.doc.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape') {
                if(containerElementInPopup.doc.body.contains(overlay))
                    containerElementInPopup.doc.body.removeChild(overlay);
            }
        });    
        
        this.setPopupSize(containerElementInPopup, containerElement);

        // Make the popup draggable
        this.makeDraggable(containerElementInPopup);

        // Make the popup resizable
        containerElementInPopup.classList.add('resizable');

        // Add mouse wheel event for zooming
        containerElementInPopup.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            const isOut = evt.deltaY > 0;
            this.zoomPopupAtCursor(containerElementInPopup, isOut, evt);
        });
    }

    hideElement(ele:HTMLElement)
    {
        ele.setCssStyles({display:'none'});   
    }

    /**
     * 隐藏弹窗中的编辑按钮等
     * @param {HTMLElement} containerInPopupEle - 弹窗容器
     */
    adjustInPopup(containerInPopupEle:HTMLElement)
    {
        let mark = this.getOpenBtnInMd_Mark();
        let btn_in_p = containerInPopupEle.querySelector('.'+mark.popupButtonClass) as HTMLElement;
        if (btn_in_p == null)
            return;
        let coreEle_in_p = btn_in_p.nextElementSibling as HTMLElement;
        if (coreEle_in_p == null)
            return; 
        
        // 隐藏无关按钮
        let btnAfterCore = coreEle_in_p.nextElementSibling as HTMLElement;
        if (btnAfterCore)
        {
            this.hideElement(btnAfterCore);
        }
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
 
    /**
     * 调整弹窗中元素的尺寸以及居中
     * @param {HTMLElement} containerInPopupEle - 弹窗容器
     * @param {HTMLElement} container - MD容器
     */    
    setPopupSize(containerInPopup:HTMLElement, container:HTMLElement){
        let multiVal = parseFloat(this.settings.PopupSizeInitValue);
        if (typeof multiVal != "number"){
            return;
        }

        let width_tar_md = this.getWidth(container);
        let height_tar_md = this.getHeight(container);   
        let core = this.getCoreElement(container) as HTMLElement;
        let core_w = this.getWidth(core);
        let core_h = this.getHeight(core);
 
        let core_in_p = this.getCoreElement(containerInPopup) as HTMLElement;

        containerInPopup.setCssStyles({
            width: width_tar_md + 'px',
            height: height_tar_md + 'px',
            transform: `scale(${multiVal})`
        });

        core_in_p.setCssStyles({
            width: core_w + 'px',
            height: core_h + 'px'
        });

        // md中， core deep 的宽度如果比 core 小，则自动左对齐
        // popin 中， core deep 的宽度如果比 core 小，则居中
        let coreDeep_in_p = this.getCoreDeepElement(containerInPopup) as HTMLElement;
        // 若 coreDeep_in_p， 则该 目标元素 是容器，目前的目标元素 只有 core 元素， 没有 coreDeep 元素
        if (coreDeep_in_p == null)
            return;
        let coreDeep_in_p_w = this.getWidth(coreDeep_in_p);
        if (coreDeep_in_p_w < core_w)
        {
            core_in_p.setCssStyles({textAlign: 'center'});
        }

    }

    createButtonContainer(_targetElementInPopup:HTMLElement, _overlay:HTMLElement){
        let _doc = _targetElementInPopup.doc;

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
        this.zoomPopupCore(popup, isOut, 1, 1);
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

        this.zoomPopupCore(popup, isOut, offsetX, offsetY);
    }

    // Helper method to zoom the popup and SVG
    zoomPopupCore(popup: HTMLElement, isOut:boolean, offsetX: number, offsetY: number) {
        const style = popup.win.getComputedStyle(popup);
        const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrixReadOnly(style.transform);
        const currentScale = matrix.a;

        // isOut, 1.1
        let symbol:number = isOut ? -1:1;
        const newScale = currentScale * (1+ symbol * parseFloat(this.settings.ZoomRatioValue));

        // Adjust the translation to keep the popup centered relative to the overlay
        const newX = matrix.m41 - offsetX * symbol * parseFloat(this.settings.ZoomRatioValue);
        const newY = matrix.m42 - offsetY * symbol * parseFloat(this.settings.ZoomRatioValue);

        popup.setCssStyles({
            transformOrigin : 'center center', // Ensure scaling is centered
            transform : `translate(${newX}px, ${newY}px) scale(${newScale})`
        });
    }    

    // Helper method to make the popup draggable
    makeDraggable(element: HTMLElement) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        const mouseDownHandler = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

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
