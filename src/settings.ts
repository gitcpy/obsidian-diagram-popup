import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, Modal } from 'obsidian';
import MermaidPopupPlugin from './main'

class MermaidPopupSettingTab extends PluginSettingTab {
    plugin: MermaidPopupPlugin;

    constructor(app: App, plugin: MermaidPopupPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const tableContainer = containerEl.createDiv({ cls: 'setting-table' });
        const table = tableContainer.createEl('table');
        const tbody = table.createEl('table');
        const row_01_popup_sz_and_dg_h_title = tbody.createEl('tr');
        const row_02_popup_sz_and_dg_h_val = tbody.createEl('tr');

        const td_01_1_popup_sz_title = row_01_popup_sz_and_dg_h_title.createEl('td');
        let popup_sz_title = td_01_1_popup_sz_title.createEl('h2', { text: 'Popup Size Init' });
        popup_sz_title.classList.add('config-text');

        const td_02_1_popup_sz = row_02_popup_sz_and_dg_h_val.createEl('td');
        // 弹窗初始化
        new Setting(td_02_1_popup_sz)
        .setName('Choose the Popup Size')
        .addDropdown(dropdown => {
            let ddPopupSizeInit = this.plugin.settings.kvMapPopupSizeInit;
            for(const key in ddPopupSizeInit){
                dropdown.addOption(key, ddPopupSizeInit[key])
            }
            dropdown
                .setValue(this.plugin.settings.PopupSizeInitValue)
                .onChange(async (value) => {
                    this.plugin.settings.PopupSizeInitValue = value;
                    await this.plugin.saveSettings();
                }
            )
        });  

        let td_01_2_dg_h= row_01_popup_sz_and_dg_h_title.createEl('td');
        let td_02_1_dg_h_title = td_01_2_dg_h.createEl('h2', { text: 'Original Diagram Height' });
        td_02_1_dg_h_title.classList.add('config-text');          
        
        const td_02_2_dg_h_val = row_02_popup_sz_and_dg_h_val.createEl('td');
        td_02_2_dg_h_val.classList.add('ori_diagram_height');
        let dg_h_val = this.plugin.settings.DiagramHeightVal; 
        let dg_h_min = this.plugin.settings.DiagramHeightMin; 
        let dg_h_max = this.plugin.settings.DiagramHeightMax;
        let dg_h_step = this.plugin.settings.DiagramHeightStep;

        let dg_h_val_min = td_02_2_dg_h_val.createEl('p');
        dg_h_val_min.setText(dg_h_min);

        let dg_h_val_input = td_02_2_dg_h_val.createEl('input');
        dg_h_val_input.setAttribute('type','range');
        dg_h_val_input.setAttribute('min',dg_h_min);
        dg_h_val_input.setAttribute('max',dg_h_max);
        dg_h_val_input.setAttribute('step',dg_h_step);
        dg_h_val_input.setAttribute('value',dg_h_val);

        let dg_h_val_max = td_02_2_dg_h_val.createEl('p');
        dg_h_val_max.setText(dg_h_max);
        let dg_h_val_cur_title = td_02_2_dg_h_val.createEl('p',  {text:'current:'});
        dg_h_val_cur_title.classList.add('ori_diagram_height_cur');
        let dg_h_val_cur = td_02_2_dg_h_val.createEl('p');
        dg_h_val_cur.classList.add('ori_diagram_height_val');
        dg_h_val_cur.setText(dg_h_val);

        // 监听 input 事件
        dg_h_val_input.addEventListener('input', (event) => {
            const value = dg_h_val_input.value; // 获取当前值
            dg_h_val_cur.setText(value + ''); // 更新显示
            this.plugin.settings.DiagramHeightVal = value;
            this.plugin.saveSettings();
        });

        this.setInfo(td_02_2_dg_h_val, 'Click for tips on Original Diagram Height Setting.',
            'Original Diagram Height Setting',
            'Under proportional scaling, ' +
                    'adapt to the width of editor, ' + 
                    'and then if the height is still greater than the value of \'Original Diagram Height\',' + 
                    'it will adapt again. '
        )          

        const row_1 = tbody.createEl('tr');
        const row_2 = tbody.createEl('tr');

        const td_1_1 = row_1.createEl('td');
        // 缩放设置标题
        let titleZoomRatio = td_1_1.createEl('h2', { text: 'Zoom Ratio' });
        titleZoomRatio.classList.add('config-text');
        const td_2_1 = row_2.createEl('td');
        // 缩放设置
        new Setting(td_2_1)
        .setName('Choose the ratio for zooming in or out')
        .addDropdown(dropdown => {
            let ddZoomRatio = this.plugin.settings.kvMapZoomRatio;
            for(const key in ddZoomRatio){
                dropdown.addOption(key, ddZoomRatio[key])
            }
            dropdown
                .setValue(this.plugin.settings.ZoomRatioValue)
                .onChange(async (value) => {
                    this.plugin.settings.ZoomRatioValue = value;
                    await this.plugin.saveSettings();
                }
            )
        });  

        const td_1_2 = row_1.createEl('td');
        // 移动步长设置标题
        let titleMoveStep = td_1_2.createEl('h2', { text: 'Move Step' });
        titleMoveStep.classList.add('config-text');
        const td_2_2 = row_2.createEl('td');
        // 移动步长设置
        new Setting(td_2_2)
        .setName('Choose the step for moving')
        .addDropdown(dropdown => {
            let ddZoomRatio = this.plugin.settings.kvMapMoveStep;
            for(const key in ddZoomRatio){
                dropdown.addOption(key, ddZoomRatio[key])
            }
            dropdown
                .setValue(this.plugin.settings.MoveStepValue)
                .onChange(async (value) => {
                    this.plugin.settings.MoveStepValue = value;
                    await this.plugin.saveSettings();
                }
            
            )
        });  

        const row = tbody.createEl('tr');
        const td_title_a = row.createEl('td');
        // bg Alpha title
        let titlePpBgA = td_title_a.createEl('h2', { text: 'Popup Background Alpha Value' });
        titlePpBgA.classList.add('config-text');
        // bg Alpha settign
        new Setting(td_title_a)
        .setName('Choose the alpha value')
        .addDropdown(dropdown => {
            let bgAlphaStep = this.plugin.settings.bgAlphaStep;
            for(const key in bgAlphaStep){
                dropdown.addOption(key, bgAlphaStep[key])
            }
            dropdown
                .setValue(this.plugin.settings.bgAlpha)
                .onChange(async (value) => {
                    this.plugin.settings.bgAlpha = value;
                    await this.plugin.saveSettings();
                }
            )
        });    

        this.addClass(td_title_a, 'setting-item', 'setting-item-on-top-line');

        const td_title_blur = row.createEl('td');
        // bg Alpha title
        let titleBlur = td_title_blur.createEl('h2', { text: 'Popup Background Blur' });
        titleBlur.classList.add('config-text');
        // bg Alpha settign
        new Setting(td_title_blur)
        .setName('Enable blur')
        .addToggle(toggle => 
            toggle
                .setValue(this.plugin.settings.bgIsBlur=='1'?true:false)
                .onChange(async (value) => {
                    this.plugin.settings.bgIsBlur = value?'1':'0';
                    await this.plugin.saveSettings();
                })
        );

        this.addClass(td_title_blur, 'setting-item', 'setting-item-on-top-line');        

        // 开启弹窗按钮位置
        let title_btn_pos = containerEl.createEl('h2', { text: 'Open Popup Button Relative Position Init' });
        title_btn_pos.classList.add('config-text');   
        
        const kvRow_open_btn = containerEl.createDiv({ cls: 'kv-row open_btn_pos' });
        this.slideInput(kvRow_open_btn, "x:", this.plugin.settings.open_btn_pos_x,  (val)=>{this.plugin.settings.open_btn_pos_x=val}, '1', '500', 'px');
        //this.slideInput(kvRow_open_btn, "y:", this.plugin.settings.open_btn_pos_y, (val)=>{this.plugin.settings.open_btn_pos_y=val});
        // this.setInfo(kvRow_open_btn, 'Click for tips on Open Popup Button Relative Position Init Setting.',
        //     'Open Popup Button Relative Position Init Setting',
        //     'The origin of open popup button relative position, is at top left of the diagram container.' +
        //             'In the setting, x represents the width ratio from the origin, and y represents the height ratio from that.'
        // ) 
        this.setInfo(kvRow_open_btn, 'Click for tips on Open Popup Button Relative Position Init Setting.',
            'Open Popup Button Relative Position Init Setting',
            'x represents the pixels to the right edge of the diagram container.'
        )       

        // Add New Diagram
        let title = containerEl.createEl('h2', { text: 'Add New Diagram' });
        title.classList.add('config-text');

        // 添加文本说明
        containerEl.createEl('p', { text: 'This plugin supports customing diagrams from mermaid, plantuml, graphviz and so on. ' });

        // 创建一个 div 来包含输入框和按钮，并使用 Flexbox 布局
        const kvRow = containerEl.createDiv({ cls: 'kv-row' });

        // 创建第一个输入框 (Key)
        const keyInput = kvRow.createEl('input', { type: 'text', placeholder: 'Input Diagram Source please' });

        // 创建第二个输入框 (Value)
        const valueInput = kvRow.createEl('input', { type: 'text', placeholder: 'Input Class Name please' });
        const classname_fmt = 'classanme format: \'A-Za-z0-9\' or \'-\' and not start with number';
        valueInput.setAttr('title', classname_fmt);

        // 是否容器
        const isContainer = kvRow.createEl('input', { type: 'checkbox' });
        isContainer.setAttr('title', 'Please check it if the classname is the container of the object you want to control');
        isContainer.addClass("kv-chk");

        // 创建保存按钮
        const saveButton = kvRow.createEl('button', { text: 'save' });

        // 添加保存按钮的点击事件
        saveButton.onclick = async () => {
            const key = keyInput.value.trim();
            const value = valueInput.value.trim();
            const chk = isContainer.checked
            if (key && value) {
                // 判断 key 是否已存在
                if(this.plugin.settings.kvMapReserved[key] || this.plugin.settings.kvMap[key] || this.plugin.settings.kvMapDefault[key] )
                {
                    new Notice('Diagram Source exists');
                    return;
                }

                if(!this.isValidClassname(value))
                {
                    new Notice(classname_fmt);
                    return;
                }

                this.plugin.settings.kvMap[key] = value+'|'+chk;
                await this.plugin.saveSettings();
                //this.displayKvMap(containerEl);
                this.display();
                new Notice(`Saved Diagram Source And Class Name: ${key} -> ${value}`);

                // 清空输入框
                keyInput.value = '';
                valueInput.value = '';
                isContainer.value = '';
            } else {
                new Notice('Input Diagram Source and Class Name please');
            }
        };

        // 创建复位按钮
        const resetButton = kvRow.createEl('button', { text: 'reset' });        
        // 添加复位按钮的点击事件
        resetButton.onclick = async () => {
            // 弹出确认提示窗口
            const confirmed = resetButton.win.confirm("Confirm to reset? It could not be restored!");
            if (confirmed) {
                // 用户确认，执行删除操作
                this.plugin.settings.kvMap = {};
                this.plugin.saveData(this.plugin.settings);
                new Notice("reset success");

                //this.displayKvMap(containerEl);
                this.display();
            } else {
                // 用户取消，不执行任何操作
                new Notice("reset canceled");
            }
        };     

        // 显示保存后的键值对
        this.displayKvMap(containerEl);

        let titleConnect = containerEl.createEl('h2', { text: 'How to work in other plugins' });
        titleConnect.classList.add('config-text-connect');

        containerEl.createEl('p', { text: '\'.diagram-popup\' is a reserved class for other plugins to work with.' })
        containerEl.createEl('p', { text: 'if you add it to the class list of your target container, it will get the functionality.' });
    }
    
    isValidClassname(classname:string) {
        return /^[A-Za-z0-9-]+$/.test(classname);
    }

    addClass(_container:HTMLElement, _targetElementClass:string, _class:string){
        let dropdownElement = _container.querySelector('.' + _targetElementClass);
        if (dropdownElement) {
            dropdownElement.classList.add(_class);
        }
    }

    setInfo(containerEl: HTMLElement, tip:string, title:string, msg:string){
        const addSettings = new Setting(containerEl);
        addSettings.addExtraButton((extra) => {
            extra.setIcon('info');
            extra.setTooltip(tip);
            extra.onClick(() => {
                let msgModal = new Modal(this.app);
                msgModal.setTitle(title);
                msgModal.setContent(msg);
                msgModal.open();
            });
            extra.extraSettingsEl.closest('.setting-item')?.classList.add('settings-icon');
        });  
    }

    slideInput(containerEl: HTMLElement, title:string, value: string, saveVal:(newVal:string)=>void, step:string='10', max:string='100', unit:string='%'){
        let input_title = containerEl.createEl('p');
        input_title.classList.add('open_btn_pos_slide_title');
        input_title.setText(title);

        let input_val_min = containerEl.createEl('p');
        input_val_min.setText('0');

        let input = containerEl.createEl('input');
        input.classList.add('open_btn_pos_slide_width');
        
        input.setAttribute('type','range');
        input.setAttribute('min','0');
        input.setAttribute('max',max);
        input.setAttribute('step',step);
        input.setAttribute('value',value);  

        let input_val_max = containerEl.createEl('p');
        input_val_max.setText(max + unit);

        let input_val_cur_title = containerEl.createEl('p',  {text:'current:'});
        input_val_cur_title.classList.add('open_btn_pos_cur_title');
        let input_val_cur = containerEl.createEl('p');
        input_val_cur.classList.add('open_btn_pos_cur_val');
        input_val_cur.setText(value);
        let input_val_cur_per = containerEl.createEl('p');
        input_val_cur_per.setText(unit);
        input_val_cur_per.classList.add('open_btn_pos_cur_per');

        // 监听 input 事件
        input.addEventListener('input', (event) => {
            const value = input.value; // 获取当前值
            input_val_cur.setText(value + ''); // 更新显示
            saveVal(value);
            this.plugin.saveSettings();
        });      
    }

    // 在页面下方显示所有保存的键值对（以表格形式）
    displayKvMap(containerEl: HTMLElement) {
        // 清除旧的显示内容
        const existingDisplay = containerEl.querySelector('.kv-display');
        if (existingDisplay) existingDisplay.remove();

        // 创建新的显示容器
        const kvDisplay = containerEl.createDiv({ cls: 'kv-display' });

        // 获取所有键值对

        // 合并两个对象
        let mergedMap = { ...this.plugin.settings.kvMapReserved ,...this.plugin.settings.kvMapDefault, ...this.plugin.settings.kvMap };

        // 转换为二维数组
        let kvEntries = Object.entries(mergedMap);

        if (kvEntries.length > 0) {
            // 创建表格元素
            const table = kvDisplay.createEl('table');

            // 创建标题栏
            const thead = table.createEl('thead');
            const headerRow = thead.createEl('tr');
            headerRow.createEl('th', { text: 'Diagram Source' });
            headerRow.createEl('th', { text: 'Class Name' });
            headerRow.createEl('th', { text: 'Is Container' });
            headerRow.createEl("th", { text: "Actions" }); // 添加 "Actions" 标题列

            // 创建表格主体
            const tbody = table.createEl('tbody');

            // 循环遍历键值对，添加到表格中
            kvEntries.forEach(([key, value]) => {


                const row = tbody.createEl('tr');
                row.createEl('td', { text: key });
                let arrVal = value.split('|');
                let val = arrVal[0].replace('.', '');
                let chk = arrVal[1] == "true" ? 'Y' :'';
                row.createEl('td', { text: val });
                row.createEl('td', { text: chk });
                // 添加删除按钮
                const actionsTd = row.createEl("td");

                if (Object.values(this.plugin.settings.kvMapDefault).includes(value))
                    return;
                
                if (Object.values(this.plugin.settings.kvMapReserved).includes(value))
                    return;

                const deleteButton = actionsTd.createEl("button", { text: "del" });                
                // 绑定删除事件
                deleteButton.addEventListener("click", () => {
                    delete this.plugin.settings.kvMap[key]; // 删除 KV 对
                    //this.displayKvMap(containerEl);
                    this.display();
                    this.plugin.saveData(this.plugin.settings);
                });            
            });
        } else {
            kvDisplay.setText('No Diagram Setting Saved');
        }
    }
}

export default MermaidPopupSettingTab;
