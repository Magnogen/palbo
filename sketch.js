// jshint esversion: 11, loopfunc: true
(async () => {

    const loadData = () => {
        let data = JSON.parse(localStorage.getItem('data')) ?? {
            palettes: [],
            data: {}
        };
        let parsed = { palettes: [...data.palettes], data: {} };
        for (const palette of data.palettes) {
            parsed.data[palette] = [];
            for (const hexCode of data.data[palette]) {
                parsed.data[palette].push(chroma(hexCode));
            }
        }
        return parsed;
    };

    const saveData = (data) => {
        const parsed = { data: {} };
        parsed.palettes = [...data.palettes];

        for (const palette of data.palettes) {
            parsed.data[palette] = [];
            for (const colour of data.data[palette]) {
                parsed.data[palette].push(colour.hex());
            }
        }
        localStorage.setItem('data', JSON.stringify(parsed));
    };

    data = loadData();

    let addPaletteBtn = $('#add-palette');
    let addColourBtn = $('#add-colour');
    let allColours = $('main');
    let editor = $('#editor');
    let editingColour = $('#editing');
    let originalColour = $('#editing-original');
    editor.style.pointerEvents = 'none';
    editor.style.opacity = '0';

    let selectedPalette;

    addPaletteBtn.style.width = getComputedStyle(addPaletteBtn).getPropertyValue('height');

    const makePalette = (name) => {
        data.palettes.push(name);
        data.data[name] = [];
        saveData(data);
    };

    const createPaletteElement = (name) => {
        let element = document.createElement('div');
        element.classList.add('palette');
        element.innerText = name;
        element.on('click', () => selectPalette(element));
        addPaletteBtn.insertAdjacentElement('beforebegin', element);
        return element;
    };

    const renamePalette = (oldName, newName) => {
        if (newName == oldName) return;
        data.palettes[data.palettes.indexOf(oldName)] = newName;

        data.data[newName] = [...data.data[oldName]];
        delete data.data[oldName];
    };

    const getWidthOfInput = (input) => {
        const tmp = document.createElement("span");
        tmp.className = "input-element tmp-element";
        tmp.innerHTML = input.value.replaceAll(/[^A-Za-z0-9_\-]/g, '_');
        document.body.appendChild(tmp);
        const theWidth = tmp.getBoundingClientRect().width;
        document.body.removeChild(tmp);
        return theWidth;
    }

    const selectPalette = (element) => {
        if (!element) return;
        if (selectedPalette == element) return;
        if (selectedPalette) {
            selectedPalette.classList.remove('selected');
            selectedPalette.innerHTML = selectedPalette.firstChild.value;
        }

        const input = document.createElement('input');
        let original = input.value = element.textContent;

        input.on('input', (event) => input.trigger('keydown', event));
        input.on('keydown', (event) => {
            if (event.key == 'Enter') input.blur();
            input.value = input.value.replaceAll(/[^A-Za-z0-9_\-]/g, '_');
            input.style.width = getWidthOfInput(input) + "px";
        }); input.trigger('keydown');
        input.on('blur', (event) => {
            if (input.value == '') {
                data.palettes.splice(data.palettes.indexOf(original), 1);
                delete data.data[original];
                selectPalette(element.previousElementSibling);
                element.remove();
                saveData(data);
                return;
            }
            if (input.value == original) return;
            if (data.palettes.includes(input.value)) {
                let number = 1, newValue;
                do {
                    newValue = `${input.value}_${++number}`;
                    if (newValue == original) break;
                } while (data.palettes.includes(newValue));
                input.value = newValue;
                input.trigger('keydown');
            }
            renamePalette(original, input.value);
            original = input.value;
            saveData(data);
        });

        element.replaceChildren(input);
        element.classList.add('selected');
        selectedPalette = element;
        // input.select();

        allColours.replaceChildren(addColourBtn);
        for (const colour of data.data[element.firstChild.value]) {
            createColourElement(colour);
        }
    };

    const makeColour = (colour, paletteElement) => {
        let palette = paletteElement.innerText;
        if (paletteElement == selectedPalette) palette = paletteElement.firstChild.value;
        data.data[palette].push(colour);
        saveData(data);
    };

    const createColourElement = (colour) => {
        let element = document.createElement('div');
        element.classList.add('colour');
        element.style.background = colour.css();
        element.style.color = colour.luminance() > 0.178 ? '#000' : '#fff';
        element.innerText = colour.hex().substring(1);
        element.on('click', () => editColour(element));
        addColourBtn.insertAdjacentElement('beforebegin', element);
        return element;
    };

    const editColour = (element) => {

        editingColour.replaceChildren(originalColour);
        editor.replaceChildren(editingColour);
        editor.style.pointerEvents = 'auto';
        editor.style.opacity = '1';
        originalColour.style.background = editingColour.style.background = element.style.background;

        const input = document.createElement('input');
        let original = input.value = element.textContent;
        const copy = document.createElement('i');
        copy.id = 'copy-colour'
        copy.classList.add('fa', 'fa-copy');
        const save = document.createElement('div');
        save.id = 'save';
        save.innerHTML = 'save';
        const burn = document.createElement('div');
        burn.id = 'burn';
        burn.innerHTML = 'burn it';

        input.style.fontWeight = '400';

        input.on('input', (event) => input.trigger('keydown', event));
        input.on('keydown', (event) => {
            if (event.key == 'Enter') input.blur();
            input.value = input.value.toLowerCase().replaceAll(/[^0-9a-f]/g, '');
            input.style.width = getWidthOfInput(input) + "px";
            if (input.value.length != 6) return;
            editingColour.style.background = chroma(input.value).css();
            if (input.value == original) return;
            save.classList.add('changed');
        }); input.trigger('keydown');
        input.on('blur', (event) => {
            if (input.value == '') input.value = original;
            if (input.value == original) return;
        });
        copy.on('click', (event) => {
            navigator.clipboard.writeText(original).then(
                () => {
                    copy.classList.remove('fa-copy');
                    copy.classList.add('fa-check');
                },
                () => {
                    /* clipboard write failed */
                },
            );
        });
        save.on('click', (event) => {
            const currentPalette = selectedPalette.firstChild.value;
            data.data[currentPalette][[].indexOf.call(element.parentNode.children, element)] = chroma(input.value);
            saveData(data);

            element.style.background = originalColour.style.background = '#' + input.value;
            element.textContent = input.value;

            editor.style.opacity = '0';
            editor.style.pointerEvents = 'none';
        });
        burn.on('click', (event) => {
            const currentPalette = selectedPalette.firstChild.value;
            data.data[currentPalette].splice([].indexOf.call(element.parentNode.children, element), 1);
            saveData(data);

            element.remove();

            editor.style.opacity = '0';
            editor.style.pointerEvents = 'none';
        });

        editingColour.appendChild(copy);
        editor.appendChild(input);
        editor.appendChild(save);
        editor.appendChild(burn);
    };

    addPaletteBtn.on('click', () => {
        let id = '';
        for (let i = 0; i < 4; i++) {
            id += choose([...'qwrtypsdfghjklzxcvbnm']);
            id += choose([...'euioa']);
        }
        makePalette(id);
        selectPalette(createPaletteElement(id));
    });

    addColourBtn.on('click', () => {
        const colour = chroma.random();
        makeColour(colour, selectedPalette);
        createColourElement(colour);
    });

    let first = true;
    for (const name of data.palettes) {
        const elem = createPaletteElement(name);
        if (first) selectPalette(elem);
        first = false;
    }


})();