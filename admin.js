// ==========================================
// SISTEMA DE AUTENTICACIÓN Y ADMIN PANEL
// ==========================================

const ADMIN_USERS = {
    eva: { password: 'Eva123', role: 'ceo', name: 'Eva' },
    cruz: { password: 'Cruz123', role: 'ceo', name: 'Cruz' },
    admin: { password: 'Admin123', role: 'ceo', name: 'Admin' },
    toxica: { password: 'Toxica123', role: 'host_xtreme', name: 'Toxica' },
    michi: { password: 'Michi123', role: 'host_isla_exterminio', name: 'Michi' },
    luz: { password: 'Luz123', role: 'host_zguerra', name: 'Luz' }
};

const ROLE_PERMISSIONS = {
    ceo: {
        tabs: ['clanes', 'asistencia', 'contactos', 'medallas', 'top3', 'semanal', 'sanciones', 'formulario'],
        features: ['all']
    },
    host_xtreme: {
        tabs: ['contactos', 'semanal'],
        salas: ['zxtreme'],
        features: ['show_contactos', 'show_semanal_xtreme']
    },
    host_isla_exterminio: {
        tabs: ['contactos', 'semanal'],
        salas: ['isla-devastacion'],
        features: ['show_contactos', 'show_semanal_isla_dev']
    },
    host_zguerra: {
        tabs: ['semanal'],
        salas: ['zguerra'],
        features: ['show_semanal_zguerra']
    }
};

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Panel Iniciando...');
    console.log('📝 Estado: Verificando login...');
    
    // Pequeño delay para asegurar que todos los elementos estén cargados
    setTimeout(() => {
        console.log('🔧 Inicializando listeners después de DOM ready...');
        initEventListeners();
        checkLogin();
    }, 100);
});

function checkLogin() {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            console.log('📝 Usuario recuperado de localStorage:', currentUser);
            showDashboard();
            loadDashboardData();
        } catch (e) {
            console.error('❌ Error recuperando usuario:', e);
            localStorage.removeItem('adminUser');
            showLogin();
        }
    } else {
        console.log('📋 No hay usuario guardado - mostrando login');
        showLogin();
    }
}

function initEventListeners() {
    console.log('🔧 Inicializando event listeners...');
    
    // LOGIN FORM - CRÍTICO
    const loginForm = document.getElementById('loginForm');
    console.log('🔍 Buscando #loginForm:', loginForm ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');
    
    if (loginForm) {
        // Remover listeners antiguos si existen
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        // Agregar listener al nuevo elemento
        const newLoginForm = document.getElementById('loginForm');
        newLoginForm.addEventListener('submit', handleLogin);
        console.log('✅ Submit listener agregado a #loginForm');
    } else {
        console.error('❌ CRÍTICO: No se encontró #loginForm');
        console.log('   Buscando alternativas...');
        
        // Intentar encontrar el formulario por clase
        const altForm = document.querySelector('form.login-form');
        if (altForm) {
            console.log('   Encontrado form.login-form, usando este');
            altForm.addEventListener('submit', handleLogin);
        } else {
            console.error('   ❌ No hay formulario disponible');
        }
    }

    // LOGOUT BUTTON
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('✅ Logout button listener agregado');
    } else {
        console.warn('⚠️ No se encontró #logoutBtn');
    }

    // TAB BUTTONS
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });
    console.log(`✅ ${tabButtons.length} tab buttons inicializados`);

    // REFRESH BUTTONS
    const refreshClanes = document.getElementById('refreshClanes');
    if (refreshClanes) refreshClanes.addEventListener('click', loadClanesTab);
    
    const refreshRankings = document.getElementById('refreshRankings');
    if (refreshRankings) refreshRankings.addEventListener('click', loadRankingsTab);
    
    const refreshAsistencia = document.getElementById('refreshAsistencia');
    if (refreshAsistencia) refreshAsistencia.addEventListener('click', loadAsistenciaTab);
    
    const refreshSanciones = document.getElementById('refreshSanciones');
    if (refreshSanciones) refreshSanciones.addEventListener('click', loadSancionesTab);
    
    // SALA SELECTORS
    const rankingsSala = document.getElementById('rankingsSala');
    if (rankingsSala) rankingsSala.addEventListener('change', loadRankingsTab);
    
    const sancionesSala = document.getElementById('sancionesSala');
    if (sancionesSala) sancionesSala.addEventListener('change', loadSancionesTab);

    // PERFIL BUTTON
    const btnPerfil = document.getElementById('btnPerfil');
    if (btnPerfil) {
        btnPerfil.addEventListener('click', showPerfilModal);
    }

    // CERRAR PERFIL
    const btnCerrarPerfil = document.getElementById('btnCerrarPerfil');
    const btnCerrarPerfilFooter = document.getElementById('btnCerrarPerfilFooter');
    if (btnCerrarPerfil) {
        btnCerrarPerfil.addEventListener('click', closePerfilModal);
    }
    if (btnCerrarPerfilFooter) {
        btnCerrarPerfilFooter.addEventListener('click', closePerfilModal);
    }

    // REFRESH GENÉRICO
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => loadClanesTab());
    }

    // SEMANAL SUBTABS
    const semanalSubtabs = document.querySelectorAll('.semanal-subtab');
    semanalSubtabs.forEach(btn => {
        btn.addEventListener('click', handleSemanalSubtabClick);
    });
    
    console.log('✅ Event listeners inicializados completamente');
}

function handleLogin(e) {
    e.preventDefault();
    
    console.log('🔐 === INICIO LOGIN ===');
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    
    if (!usernameInput || !passwordInput) {
        console.error('❌ CRÍTICO: Inputs no encontrados');
        console.log('   username:', usernameInput ? '✅' : '❌');
        console.log('   password:', passwordInput ? '✅' : '❌');
        return;
    }
    
    const username = usernameInput.value.toLowerCase().trim();
    const password = passwordInput.value;
    
    console.log('📝 Credenciales ingresadas:');
    console.log('   Usuario:', username);
    console.log('   Password length:', password.length);
    console.log('   Usuario existe?', !!ADMIN_USERS[username]);

    if (ADMIN_USERS[username]) {
        console.log('   Password guardada:', ADMIN_USERS[username].password);
        console.log('   ¿Coincide?', ADMIN_USERS[username].password === password);
    }

    if (ADMIN_USERS[username] && ADMIN_USERS[username].password === password) {
        console.log('✅ LOGIN EXITOSO para:', username);
        currentUser = {
            username: username,
            name: ADMIN_USERS[username].name,
            role: ADMIN_USERS[username].role
        };
        console.log('💾 Guardando en localStorage:', currentUser);
        localStorage.setItem('adminUser', JSON.stringify(currentUser));
        
        usernameInput.value = '';
        passwordInput.value = '';
        
        if (loginError) loginError.style.display = 'none';
        
        console.log('📊 Mostrando dashboard...');
        showDashboard();
        loadDashboardData();
    } else {
        console.error('❌ LOGIN FALLIDO');
        if (loginError) {
            loginError.textContent = '⚠️ Usuario o contraseña incorrectos';
            loginError.style.display = 'block';
            console.log('⏱️ Ocultando error en 3 segundos...');
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    }
    console.log('🔐 === FIN LOGIN ===\n');
}

function handleLogout() {
    if (confirm('¿Estás seguro?')) {
        localStorage.removeItem('adminUser');
        currentUser = null;
        console.log('👋 Sesión cerrada');
        showLogin();
    }
}

function showLogin() {
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
    
    console.log('📋 Mostrando login');
}

function showDashboard() {
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginSection) loginSection.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    
    const userRole = document.getElementById('userRole');
    if (userRole && currentUser) {
        const rolEmoji = currentUser.role === 'ceo' ? '👑' : '📊';
        userRole.textContent = rolEmoji + ' ' + currentUser.name;
    }

    console.log('📊 Dashboard visible - Aplicando permisos');
    applyRoleBasedVisibility();
}

function applyRoleBasedVisibility() {
    if (!currentUser) {
        console.error('❌ No hay usuario actual');
        return;
    }

    const permissions = ROLE_PERMISSIONS[currentUser.role];
    if (!permissions) {
        console.error('❌ No hay permisos para rol:', currentUser.role);
        return;
    }

    console.log('🔐 Permisos:', permissions);
    
    const allTabs = document.querySelectorAll('.admin-tab-btn');
    console.log('📑 Tabs encontradas:', allTabs.length);

    allTabs.forEach(tab => {
        const tabName = tab.getAttribute('data-tab');
        const isAllowed = permissions.tabs.includes(tabName);
        tab.style.display = isAllowed ? 'block' : 'none';
        console.log(`  - ${tabName}: ${isAllowed ? '✅' : '❌'}`);
    });

    const onlyMasterElements = document.querySelectorAll('.only-master-tab');
    const isCEO = currentUser.role === 'ceo';
    onlyMasterElements.forEach(el => {
        el.style.display = isCEO ? 'block' : 'none';
    });

    if (permissions.salas) {
        const semanalSubtabs = document.querySelectorAll('.semanal-subtab');
        semanalSubtabs.forEach(btn => {
            const sala = btn.getAttribute('data-sala');
            btn.style.display = permissions.salas.includes(sala) ? 'inline-block' : 'none';
        });
    }

    const firstVisibleTab = Array.from(allTabs).find(tab => tab.style.display !== 'none');
    if (firstVisibleTab) {
        console.log('📌 Abriendo primer tab:', firstVisibleTab.getAttribute('data-tab'));
        firstVisibleTab.click();
    }
}

function handleTabClick(e) {
    const tabName = e.target.getAttribute('data-tab');
    console.log('📑 Click en tab:', tabName);
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.style.display = 'none';
    });

    const panel = document.getElementById('tab-' + tabName);
    if (panel) {
        console.log('✅ Panel encontrado y visible:', tabName);
        panel.style.display = 'block';
        
        // Load data for the selected tab
        if (tabName === 'clanes') loadClanesTab();
        else if (tabName === 'rankings') loadRankingsTab();
        else if (tabName === 'top3') loadTop3Tab();
        else if (tabName === 'asistencia') loadAsistenciaTab();
        else if (tabName === 'contactos') loadContactosTab();
        else if (tabName === 'sanciones') loadSancionesTab();
    } else {
        console.error('❌ Panel no encontrado:', 'tab-' + tabName);
    }
}

function loadDashboardData() {
    document.getElementById('totalClanes').textContent = '0';
    document.getElementById('clanesActivos').textContent = '0';
    document.getElementById('totalJugadores').textContent = '0';
    document.getElementById('totalTrofeos').textContent = '0';
    if (document.getElementById('totalSanciones')) {
        document.getElementById('totalSanciones').textContent = '0';
    }
}

async function loadClanesTab() {
    console.log('📋 Cargando tab: Clanes');
    try {
        const rows = await fetchSheetData(CONFIG.CLANES_URL);
        
        const tbody = document.getElementById('clanesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        let count = 0;
        
        rows.forEach(row => {
            if (row.length < 3) return;
            const nombre = row[CONFIG.CLANES_COLUMNS.NOMBRE_DE_CLAN];
            const tag = row[CONFIG.CLANES_COLUMNS.TAG_DEL_CLAN];
            const logo = row[CONFIG.CLANES_COLUMNS.LOGO];
            const lider = row[CONFIG.CLANES_COLUMNS.NOMBRE_LIDER];
            const id = row[CONFIG.CLANES_COLUMNS.ID];
            const oro = row[CONFIG.CLANES_COLUMNS.ORO];
            
            if (!nombre || nombre.toLowerCase() === 'nombre') return;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${getLogoUrl(id, logo)}" alt="${tag}" style="height:32px; border-radius:4px;" onerror="this.src='logo de sala/logo de pagina.jpeg'"></td>
                <td><strong>${nombre}</strong></td>
                <td>${tag}</td>
                <td>${lider || 'N/A'}</td>
                <td>${oro || '0'}</td>
                <td><span style="background:#28a745; color:white; padding:4px 8px; border-radius:4px; font-size:0.85rem;">Activo</span></td>
            `;
            tbody.appendChild(tr);
            count++;
        });
        
        if (count === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted);">No hay datos disponibles</td></tr>';
        }
        
        console.log(`✅ Cargados ${count} clanes`);
    } catch (err) {
        console.error('❌ Error cargando clanes:', err);
        console.error('   Stack:', err.stack);
        document.getElementById('clanesTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;">Error: ' + err.message + '</td></tr>';
    }
}

async function loadAsistenciaTab() {
    console.log('📋 Cargando tab: Asistencia');
    try {
        const rows = await fetchSheetData(CONFIG.ASISTENCIA_URL);
        
        const container = document.getElementById('asistenciaContainer');
        if (!container) return;
        
        let html = '<div style="overflow-x: auto;"><table class="admin-table"><thead><tr><th>Clan</th>';
        for (let i = 1; i <= 31; i++) {
            html += `<th style="font-size:0.8rem;">${i}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        rows.slice(0, 50).forEach(row => {
            if (row.length < 2 || row[0].toLowerCase() === 'clan') return;
            html += '<tr><td><strong>' + row[0] + '</strong></td>';
            for (let i = 1; i < Math.min(32, row.length); i++) {
                const val = row[i] || '-';
                const bg = val === 'A' ? 'rgba(40,167,69,0.2)' : val === 'P' ? 'rgba(255,193,7,0.2)' : 'rgba(220,53,69,0.2)';
                html += `<td style="background:${bg}; text-align:center; font-size:0.8rem;">${val}</td>`;
            }
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        console.log(`✅ Asistencia cargada`);
    } catch (err) {
        console.error('❌ Error cargando asistencia:', err);
        const container = document.getElementById('asistenciaContainer');
        if (container) {
            container.innerHTML = '<div style="text-align:center; color:red;">⚠️ Error: ' + err.message + '</div>';
        }
    }
}

async function loadContactosTab() {
    console.log('📞 Cargando tab: Contactos');
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_URL);
        
        const container = document.getElementById('contactosContainer');
        if (!container) return;
        
        const html = rows
            .filter(row => row.length >= 6 && row[0].toLowerCase() !== 'nombre')
            .map(row => `
                <div style="background:rgba(255,215,0,0.05); border:1px solid rgba(255,215,0,0.2); padding:1rem; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <h3 style="margin:0; color:var(--gold);">${row[0]}</h3>
                        <span style="background:var(--gold); color:#000; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">${row[1]}</span>
                    </div>
                    <p style="margin:0.3rem 0; font-size:0.9rem;"><strong>👤 Líder:</strong> ${row[3] || 'N/A'}</p>
                    <p style="margin:0.3rem 0; font-size:0.9rem;"><strong>📞 Teléfono:</strong> ${row[5] || 'N/A'}</p>
                </div>
            `).join('');
        
        container.innerHTML = html || '<div style="text-align:center; color:var(--muted);">No hay contactos disponibles</div>';
        console.log(`✅ Contactos cargados`);
    } catch (err) {
        console.error('❌ Error cargando contactos:', err);
        const container = document.getElementById('contactosContainer');
        if (container) {
            container.innerHTML = '<div style="text-align:center; color:red;">⚠️ Error: ' + err.message + '</div>';
        }
    }
}

function loadMedallasTab() {
    console.log('📋 Cargando tab: Medallas');
}

async function loadRankingsTab() {
    console.log('📊 Cargando tab: Rankings');
    try {
        const sala = document.getElementById('rankingsSala')?.value || 'zguerra';
        console.log('⚔️ Sala seleccionada:', sala);
        
        let url = CONFIG.SEMANAL_ZGUERRA_URL;
        if (sala === 'zletal') url = CONFIG.SEMANAL_ZLETAL_URL || CONFIG.SEMANAL_ZGUERRA_URL;
        if (sala === 'zxtreme') url = CONFIG.SEMANAL_ZXTREME_URL || CONFIG.SEMANAL_ZGUERRA_URL;
        
        console.log('🔗 URL:', url);
        
        const rows = await fetchSheetData(url);
        console.log('📥 Filas recibidas:', rows.length);
        
        const tbody = document.getElementById('rankingsTableBody');
        if (!tbody) {
            console.error('❌ No se encontró rankingsTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        let position = 1;
        
        rows.forEach(row => {
            if (row.length < 2) return;
            
            const clan = row[0];
            const puntos = row[1];
            
            // Saltar encabezado
            if (clan && clan.toLowerCase().includes('clan')) return;
            if (!clan || clan.trim() === '') return;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${position}°</td>
                <td>${clan}</td>
                <td><strong>${puntos || '0'}</strong></td>
            `;
            tbody.appendChild(tr);
            position++;
        });
        
        if (position === 1) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay datos disponibles</td></tr>';
        }
        
        console.log(`✅ Cargados ${position - 1} rankings`);
    } catch (err) {
        console.error('❌ Error cargando rankings:', err);
        console.error('   URL:', CONFIG.SEMANAL_ZGUERRA_URL);
        const tbody = document.getElementById('rankingsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">⚠️ Error: ' + err.message + '</td></tr>';
        }
    }
}

async function loadTop3Tab() {
    console.log('🏆 Cargando tab: Top 3');
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_URL);
        
        const container = document.getElementById('top3Container');
        if (!container) return;
        
        const clans = rows
            .filter(row => row.length >= 5 && row[0].toLowerCase() !== 'nombre')
            .map(row => ({ name: row[0], points: parseInt(row[4]) || 0 }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 3);
        
        const medals = ['🥇', '🥈', '🥉'];
        container.innerHTML = clans.map((clan, idx) => `
            <div style="text-align:center; padding:1.5rem; border:1px solid rgba(255,215,0,0.3); border-radius:8px; background:rgba(255,215,0,0.05);">
                <div style="font-size:2rem; margin-bottom:0.5rem;">${medals[idx]}</div>
                <div style="font-weight:bold; color:var(--gold); margin-bottom:0.3rem;">${clan.name}</div>
                <div style="color:var(--muted); font-size:0.9rem;">${clan.points.toLocaleString('es-ES')} pts</div>
            </div>
        `).join('');
        
        console.log(`✅ Top 3 cargado`);
    } catch (err) {
        console.error('❌ Error cargando Top 3:', err);
        const container = document.getElementById('top3Container');
        if (container) {
            container.innerHTML = '<div style="text-align:center; color:red;">⚠️ Error: ' + err.message + '</div>';
        }
    }
}

function loadSemanalTab() {
    console.log('📋 Cargando tab: Semanal');
    loadRankingsTab();
}

async function loadSancionesTab() {
    console.log('🚨 Cargando tab: Sanciones');
    try {
        const sala = document.getElementById('sancionesSala')?.value || 'all';
        const url = sala === 'zguerra' ? CONFIG.SANCIONES_ZGUERRA_URL : CONFIG.SHEET_URL;
        
        const rows = await fetchSheetData(url);
        
        const tbody = document.getElementById('sancionesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = rows
            .filter(row => row.length >= 5 && row[0].toLowerCase() !== 'clan')
            .map(row => `
                <tr>
                    <td>${row[0]}</td>
                    <td>${row[1] || 'General'}</td>
                    <td>${row[2] || '0'}</td>
                    <td>${row[3] || 'N/A'}</td>
                    <td>${row[4] || new Date().toLocaleDateString('es-ES')}</td>
                </tr>
            `).join('');
        
        if (tbody.innerHTML === '') {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Sin sanciones activas</td></tr>';
        }
        
        console.log(`✅ Sanciones cargadas`);
    } catch (err) {
        console.error('❌ Error cargando sanciones:', err);
        const tbody = document.getElementById('sancionesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">⚠️ Error: ' + err.message + '</td></tr>';
        }
    }
}

function handleSemanalSubtabClick(e) {
    console.log('🎮 Sala seleccionada:', e.target.getAttribute('data-sala'));
}

function showPerfilModal() {
    const modal = document.getElementById('perfilModal');
    if (modal) {
        document.getElementById('perfilUsuario').textContent = (currentUser.username || 'N/A').toUpperCase();
        document.getElementById('perfilRol').textContent = currentUser.role === 'ceo' ? 'CEO / Administrador' : 'Host de Sala';
        document.getElementById('perfilTipo').textContent = currentUser.role === 'ceo' ? 'Acceso Total' : 'Acceso Restringido';
        modal.style.display = 'flex';
    }
}

function closePerfilModal() {
    const modal = document.getElementById('perfilModal');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('click', function(e) {
    const modal = document.getElementById('perfilModal');
    if (modal && e.target === modal) {
        closePerfilModal();
    }
});

console.log('✅ admin.js cargado correctamente');
