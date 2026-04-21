(function () {
    const varListEl = document.getElementById('varList');
    const searchInput = document.getElementById('searchInput');
    const keyInput = document.getElementById('keyInput');
    const descTextarea = document.getElementById('descTextarea');
    const valueTextarea = document.getElementById('valueTextarea');
    const statusEl = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const themeToggle = document.getElementById('themeToggle');
    const descToggle = document.getElementById('descToggle');
    const descPanel = document.getElementById('descPanel');
    const descToggleArrow = document.getElementById('descToggleArrow');
    const newVarBtn = document.getElementById('newVarBtn');
    const resizer = document.getElementById('resizer');
    const sidebar = document.querySelector('.sidebar');

    let allVariables = [];
    let filteredVariables = [];
    let activeKey = null;
    let isNewVariable = false;
    let isSaving = false;

    // Snapshot of the form state at the moment the variable was loaded
    let savedSnapshot = null;

    function setStatus(message, kind) {
        statusEl.textContent = message || '';
        statusEl.className = 'status' + (kind ? ' ' + kind : '');
    }

    function apiBase(path) {
        // Мы используем относительные пути. 
        // Если страница открыта по адресу /variable-json/, то ./api/variables -> /variable-json/api/variables
        return './api' + path;
    }

    function applyTheme(theme) {
        const body = document.body;
        const isDark = theme === 'dark';
        body.classList.toggle('dark', isDark);
        themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    }

    function initTheme() {
        const stored = window.localStorage.getItem('varJsonViewerTheme');
        let theme = stored;
        if (!theme) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                theme = 'dark';
            } else {
                theme = 'light';
            }
        }
        applyTheme(theme);
    }

    function makeSnapshot() {
        return {
            key: keyInput.value,
            description: descTextarea.value,
            value: valueTextarea.value,
        };
    }

    function isDirty() {
        if (savedSnapshot === null) return false;
        const current = makeSnapshot();
        return (
            current.key !== savedSnapshot.key ||
            current.description !== savedSnapshot.description ||
            current.value !== savedSnapshot.value
        );
    }

    function confirmLeave() {
        if (!isDirty()) return true;
        return window.confirm('You have unsaved changes. Discard them and continue?');
    }

    async function loadVariables() {
        setStatus('Loading variables...', '');
        try {
            const resp = await fetch(apiBase('/variables'));
            if (!resp.ok) {
                throw new Error('HTTP ' + resp.status);
            }
            const data = await resp.json();
            allVariables = (data || []).map(function (v) {
                return {
                    key: v.key,
                    description: v.description || '',
                    value: v.value || '',
                    is_encrypted: v.is_encrypted === true,
                };
            });
            filteredVariables = allVariables.slice();
            renderVarList();
            setStatus('Variables loaded', 'ok');

            if (filteredVariables.length > 0) {
                if (activeKey) {
                    selectVariable(activeKey);
                } else {
                    selectVariable(filteredVariables[0].key);
                }
            } else {
                showEmptySelection();
            }
        } catch (e) {
            console.error(e);
            setStatus('Failed to load variables: ' + e.message, 'error');
            varListEl.innerHTML = '<div class="empty-state">Error loading variables</div>';
        }
    }

    function renderVarList() {
        if (!filteredVariables.length) {
            varListEl.innerHTML = '<div class="empty-state">No variables (filter?)</div>';
            return;
        }

        const frag = document.createDocumentFragment();

        filteredVariables.forEach(function (v) {
            const item = document.createElement('div');
            item.className = 'var-item' + (v.key === activeKey ? ' active' : '');
            item.dataset.key = v.key;

            const keyDiv = document.createElement('div');
            keyDiv.className = 'var-key';
            keyDiv.textContent = v.key;
            item.appendChild(keyDiv);

            if (v.is_encrypted) {
                const badge = document.createElement('span');
                badge.className = 'badge-encrypted';
                badge.textContent = 'encrypted';
                keyDiv.appendChild(badge);
            }

            item.addEventListener('click', function () {
                if (v.key === activeKey) return;
                if (!confirmLeave()) return;
                selectVariable(v.key);
            });

            frag.appendChild(item);
        });

        varListEl.innerHTML = '';
        varListEl.appendChild(frag);
    }

    function showEmptySelection() {
        keyInput.value = '';
        keyInput.readOnly = true;
        descTextarea.value = '';
        valueTextarea.value = '';
        activeKey = null;
        isNewVariable = false;
        savedSnapshot = null;
        saveBtn.disabled = true;
        deleteBtn.disabled = true;
    }

    function getVariableFromCache(key) {
        return allVariables.find(function (v) { return v.key === key; }) || null;
    }

    async function selectVariable(key) {
        activeKey = key;
        isNewVariable = false;

        Array.prototype.forEach.call(
            varListEl.querySelectorAll('.var-item'),
            function (el) {
                el.classList.toggle('active', el.dataset.key === key);
            }
        );

        const cached = getVariableFromCache(key);
        if (cached) {
            applyVariableToForm(cached);
        } else {
            applyVariableToForm({
                key: key,
                description: '',
                value: '',
                is_encrypted: false,
            });
        }

        try {
            const resp = await fetch(apiBase('/variables/' + encodeURIComponent(key)));
            if (!resp.ok) {
                throw new Error('HTTP ' + resp.status);
            }
            const v = await resp.json();
            const normalized = {
                key: v.key,
                description: v.description || '',
                value: v.value || '',
                is_encrypted: v.is_encrypted === true,
            };

            const idx = allVariables.findIndex(function (x) { return x.key === key; });
            if (idx >= 0) {
                allVariables[idx] = normalized;
            } else {
                allVariables.push(normalized);
            }

            // Если за время запроса мы не переключились на другую переменную
            if (activeKey === key) {
                applyVariableToForm(normalized);
            }
        } catch (e) {
            console.warn('Failed to update variable', key, e);
            setStatus('Error loading variable: ' + e.message, 'error');
        }
    }

    function toPrettyJSON(raw) {
        if (!raw) return '';
        try {
            const parsed = JSON.parse(raw);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return raw;
        }
    }

    function applyVariableToForm(v) {
        keyInput.value = v.key || '';
        keyInput.readOnly = false;
        descTextarea.value = v.description || '';
        valueTextarea.value = toPrettyJSON(v.value || '');

        savedSnapshot = makeSnapshot();

        saveBtn.disabled = false;
        deleteBtn.disabled = isNewVariable;
        if (v.is_encrypted) {
            setStatus('Value is encrypted (stored as cipher in DB, shown as decrypted here)', 'ok');
        } else {
            setStatus('', '');
        }
    }

    async function saveCurrent() {
        if (isSaving) return;

        const newKey = keyInput.value.trim();
        if (!newKey) {
            setStatus('Key cannot be empty', 'error');
            return;
        }

        const description = descTextarea.value || '';
        const value = valueTextarea.value;

        isSaving = true;
        saveBtn.disabled = true;
        setStatus('Saving...', '');

        try {
            let resp;

            if (isNewVariable) {
                // Create new variable via PATCH
                resp = await fetch(
                    apiBase('/variables/' + encodeURIComponent(newKey)),
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description: description, value: value }),
                    }
                );
            } else {
                // Update existing variable (possibly with key rename) via PUT
                resp = await fetch(
                    apiBase('/variables/' + encodeURIComponent(activeKey)),
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ new_key: newKey, description: description, value: value }),
                    }
                );
            }

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.detail || 'HTTP ' + resp.status);
            }
            const v = await resp.json();

            const normalized = {
                key: v.key,
                description: v.description || '',
                value: v.value || '',
                is_encrypted: v.is_encrypted === true,
            };

            // Remove old key from cache if renamed
            if (!isNewVariable && activeKey !== normalized.key) {
                allVariables = allVariables.filter(function (x) { return x.key !== activeKey; });
            }

            const idx = allVariables.findIndex(function (x) { return x.key === normalized.key; });
            if (idx >= 0) {
                allVariables[idx] = normalized;
            } else {
                allVariables.push(normalized);
            }

            isNewVariable = false;
            activeKey = normalized.key;
            applyFilter(searchInput.value);
            applyVariableToForm(normalized);
            setStatus('Saved', 'ok');
        } catch (e) {
            console.error(e);
            setStatus('Error saving: ' + e.message, 'error');
        } finally {
            isSaving = false;
            saveBtn.disabled = false;
        }
    }

    function applyFilter(text) {
        const q = (text || '').toLowerCase();
        if (!q) {
            filteredVariables = allVariables.slice();
        } else {
            filteredVariables = allVariables.filter(function (v) {
                return v.key && v.key.toLowerCase().includes(q);
            });
        }
        renderVarList();
    }

    function createNewVariable() {
        if (!confirmLeave()) return;

        isNewVariable = true;
        activeKey = null;

        // Снимаем выделение со всех элементов списка
        Array.prototype.forEach.call(
            varListEl.querySelectorAll('.var-item'),
            function (el) {
                el.classList.remove('active');
            }
        );

        applyVariableToForm({
            key: '',
            description: '',
            value: '',
            is_encrypted: false,
        });

        keyInput.focus();
        setStatus('Enter key and value for the new variable, then click Save', 'ok');
    }

    function initResizer() {
        let isResizing = false;

        resizer.addEventListener('mousedown', function (e) {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function (e) {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth > 150 && newWidth < 600) {
                sidebar.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', function () {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.localStorage.setItem('varJsonSidebarWidth', sidebar.style.width);
            }
        });

        const storedWidth = window.localStorage.getItem('varJsonSidebarWidth');
        if (storedWidth) {
            sidebar.style.width = storedWidth;
        }
    }

    // События

    searchInput.addEventListener('input', function () {
        applyFilter(searchInput.value);
    });

    saveBtn.addEventListener('click', function () {
        saveCurrent();
    });

    themeToggle.addEventListener('click', function () {
        const isDark = document.body.classList.contains('dark');
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        window.localStorage.setItem('varJsonViewerTheme', next);
    });

    descToggle.addEventListener('click', function () {
        const hidden = descPanel.classList.contains('hidden');
        descPanel.classList.toggle('hidden', !hidden);
        descToggleArrow.textContent = hidden ? '▼' : '▶';
    });

    newVarBtn.addEventListener('click', function () {
        createNewVariable();
    });

    deleteBtn.addEventListener('click', function () {
        if (!activeKey) return;
        const confirmed = window.confirm('Delete variable "' + activeKey + '"? This action cannot be undone.');
        if (!confirmed) return;
        deleteVariable(activeKey);
    });

    async function deleteVariable(key) {
        deleteBtn.disabled = true;
        saveBtn.disabled = true;
        setStatus('Deleting...', '');
        try {
            const resp = await fetch(
                apiBase('/variables/' + encodeURIComponent(key)),
                { method: 'DELETE' }
            );
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.detail || 'HTTP ' + resp.status);
            }
            allVariables = allVariables.filter(function (v) { return v.key !== key; });
            activeKey = null;
            isNewVariable = false;
            savedSnapshot = null;
            applyFilter(searchInput.value);
            if (filteredVariables.length > 0) {
                selectVariable(filteredVariables[0].key);
            } else {
                showEmptySelection();
            }
            setStatus('Variable deleted', 'ok');
        } catch (e) {
            console.error(e);
            setStatus('Error deleting: ' + e.message, 'error');
            deleteBtn.disabled = false;
            saveBtn.disabled = false;
        }
    }

    // Инициализация

    initTheme();
    initResizer();
    loadVariables();

})();
