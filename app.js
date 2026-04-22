document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Sécurité et Utilitaires ---
    
    // Anti-XSS : Échapper tout contenu utilisateur avant insertion HTML
    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Validation de fichier (taille max 10 Mo, types image uniquement)
    function validateFile(file) {
        const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' };
        if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: 'Type non supporté. Utilisez JPG, PNG ou WebP.' };
        if (file.size > MAX_SIZE) return { valid: false, error: 'Fichier trop volumineux (max 10 Mo).' };
        return { valid: true };
    }

    // Protection légère : désactiver le clic droit sur les images uniquement
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Charger les données persistées depuis localStorage
    const savedInspectorName = localStorage.getItem('inspectpro_inspector_name') || '';
    let savedClientNames = [];
    try { savedClientNames = JSON.parse(localStorage.getItem('inspectpro_client_names')) || []; } catch(e) { savedClientNames = []; }
    if (!Array.isArray(savedClientNames) || savedClientNames.length === 0) savedClientNames = [''];
    const savedClientAddress = localStorage.getItem('inspectpro_client_address') || '';
    inspectionData.clientInfo.inspectorName = savedInspectorName;
    inspectionData.clientInfo.names = savedClientNames;
    inspectionData.clientInfo.name = savedClientNames.filter(n => n).join(' & ');
    inspectionData.clientInfo.address = savedClientAddress;

    // Initialiser les objets de commentaires si absents
    if (!inspectionData.comments) inspectionData.comments = {};
    if (!inspectionData.sectionComments) inspectionData.sectionComments = {};

    // --- Configuration Entreprise Dynamique ---
    window.AppCompanyProfile = {
        name: localStorage.getItem('kzo_company_name') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.name : 'KZO InspectPro'),
        address: localStorage.getItem('kzo_company_address') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.address : 'Québec, Canada'),
        phone: localStorage.getItem('kzo_company_phone') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.phone : '438-378-6703'),
        email: localStorage.getItem('kzo_company_email') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.email : 'kzoinspectpro@gmail.com'),
        tps: localStorage.getItem('kzo_company_tps') || '',
        tvq: localStorage.getItem('kzo_company_tvq') || ''
    };

    // Pré-remplir le nom de l'inspecteur depuis KZO_OWNER_PROFILE
    if (!localStorage.getItem('inspectpro_inspector_name') && typeof KZO_OWNER_PROFILE !== 'undefined') {
        inspectionData.clientInfo.inspectorName = KZO_OWNER_PROFILE.inspectorName || 'Jean Eveillard Cazeau';
        localStorage.setItem('inspectpro_inspector_name', inspectionData.clientInfo.inspectorName);
    }

    // Modal Profil Entreprise
    const cpBtn = document.getElementById('companyProfileBtn');
    const cpModal = document.getElementById('companyProfileModal');
    const cpClose = document.getElementById('closeCompanyProfile');
    const cpSave = document.getElementById('saveCompanyProfile');
    
    if (cpBtn && cpModal) {
        cpBtn.addEventListener('click', () => {
            document.getElementById('cp_company_name').value = window.AppCompanyProfile.name === 'NOM DE L\'ENTREPRISE' ? '' : window.AppCompanyProfile.name;
            document.getElementById('cp_company_address').value = window.AppCompanyProfile.address === 'Adresse à spécifier, Ville, Province' ? '' : window.AppCompanyProfile.address;
            document.getElementById('cp_company_phone').value = window.AppCompanyProfile.phone === '(000) 000-0000' ? '' : window.AppCompanyProfile.phone;
            document.getElementById('cp_company_email').value = window.AppCompanyProfile.email === 'email@entreprise.com' ? '' : window.AppCompanyProfile.email;
            document.getElementById('cp_company_tps').value = window.AppCompanyProfile.tps === '[No TPS]' ? '' : window.AppCompanyProfile.tps;
            document.getElementById('cp_company_tvq').value = window.AppCompanyProfile.tvq === '[No TVQ]' ? '' : window.AppCompanyProfile.tvq;
            cpModal.style.display = 'flex';
        });
        
        cpClose.addEventListener('click', () => cpModal.style.display = 'none');
        
        cpSave.addEventListener('click', () => {
            const n = document.getElementById('cp_company_name').value.trim();
            const a = document.getElementById('cp_company_address').value.trim();
            const p = document.getElementById('cp_company_phone').value.trim();
            const e = document.getElementById('cp_company_email').value.trim();
            const tp = document.getElementById('cp_company_tps').value.trim();
            const tv = document.getElementById('cp_company_tvq').value.trim();
            
            if (n) localStorage.setItem('kzo_company_name', n);
            if (a) localStorage.setItem('kzo_company_address', a);
            if (p) localStorage.setItem('kzo_company_phone', p);
            if (e) localStorage.setItem('kzo_company_email', e);
            if (tp) localStorage.setItem('kzo_company_tps', tp);
            if (tv) localStorage.setItem('kzo_company_tvq', tv);

            window.AppCompanyProfile.name = n || 'NOM DE L\'ENTREPRISE';
            window.AppCompanyProfile.address = a || 'Adresse à spécifier, Ville, Province';
            window.AppCompanyProfile.phone = p || '(000) 000-0000';
            window.AppCompanyProfile.email = e || 'email@entreprise.com';
            window.AppCompanyProfile.tps = tp || '[No TPS]';
            window.AppCompanyProfile.tvq = tv || '[No TVQ]';
            
            cpModal.style.display = 'none';
            alert("Profil d'entreprise enregistré avec succès !");
            
            // Update Cover branding if visible
            const coverAppNames = document.querySelectorAll('.cover-app-name');
            coverAppNames.forEach(el => el.textContent = window.AppCompanyProfile.name);
        });
    }

    // Utilitaire : obtenir le nom d'affichage des clients
    function getClientDisplayName() {
        const names = (inspectionData.clientInfo.names || []).filter(n => n.trim());
        return names.length > 0 ? names.join(' & ') : '';
    }

    // Utilitaire : mettre à jour partout quand les noms changent
    function propagateClientNames() {
        const displayName = getClientDisplayName();
        inspectionData.clientInfo.name = displayName;
        localStorage.setItem('inspectpro_client_names', JSON.stringify(inspectionData.clientInfo.names));

        // Sidebar
        const stitle = document.getElementById('sidebarTitle');
        if (stitle) {
            stitle.textContent = '';
            const nameLine = document.createElement('strong');
            nameLine.textContent = displayName || 'Client inconnu';
            const addrLine = document.createElement('span');
            addrLine.style.color = '#94a3b8';
            addrLine.style.fontSize = '0.8rem';
            addrLine.textContent = inspectionData.clientInfo.address || '';
            stitle.appendChild(nameLine);
            stitle.appendChild(document.createElement('br'));
            stitle.appendChild(addrLine);
        }

        // Cover page
        const coverClient = document.getElementById('coverClientName');
        if (coverClient) coverClient.textContent = displayName || 'Client à définir';
    }

    // --- 1. Rendu Dynamique de la Navigation ---
    const navLinks = document.getElementById('navLinks');
    let currentSectionIndex = 0;
    
    function renderNavigation() {
        navLinks.innerHTML = '';
        inspectionData.sections.forEach((section, index) => {
            const li = document.createElement('li');
            const iconSpan = document.createElement('span');
            iconSpan.textContent = section.icon;
            const titleSpan = document.createElement('span');
            titleSpan.textContent = section.title;
            li.appendChild(iconSpan);
            li.appendChild(document.createTextNode(' '));
            li.appendChild(titleSpan);
            if (index === currentSectionIndex) li.classList.add('active');
            
            li.addEventListener('click', () => {
                currentSectionIndex = index;
                renderNavigation();
                renderSection(index);
                if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
            });
            navLinks.appendChild(li);
        });
    }

    // --- 2. Rendu de la Section Courante ---
    const dynamicContent = document.getElementById('dynamicContent');
    const currentSectionTitle = document.getElementById('currentSectionTitle');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    function renderSection(index) {
        const section = inspectionData.sections[index];
        currentSectionTitle.textContent = section.title;
        dynamicContent.innerHTML = '';

        // --- Special Cover Page Rendering ---
        if (section.isCoverPage) {
            const coverDiv = document.createElement('div');
            coverDiv.className = 'cover-page-container';
            coverDiv.innerHTML = `
                <div class="cover-hero">
                    <!-- Inspector Name -->
                    <div class="cover-inspector-name">
                        <span class="cover-inspector-label">Inspecteur</span>
                        <span class="cover-inspector-value" id="coverInspectorName">${sanitizeHTML(inspectionData.clientInfo.inspectorName) || 'À définir'}</span>
                    </div>

                    <!-- App Branding -->
                    <h1 class="cover-app-name" style="word-wrap: anywhere; text-align: center;">${sanitizeHTML(window.AppCompanyProfile ? window.AppCompanyProfile.name : "InspectPro")}</h1>
                    <div class="cover-app-tagline">
                        <span class="cover-tagline-line"></span>
                        <span>Expertise & Intelligence en Inspection</span>
                        <span class="cover-tagline-line"></span>
                    </div>

                    <!-- Photo Upload -->
                    <label class="cover-upload-zone" id="coverDropZone">
                        <input type="file" accept="image/*" id="coverPhotoInput" style="display:none;">
                        <div class="cover-upload-content" id="coverUploadContent">
                            <div class="cover-upload-icon">🏠</div>
                            <span class="cover-upload-text">Appuyez ici pour sélectionner la photo de façade</span>
                            <span class="cover-upload-hint">JPG, PNG — Photo principale du bâtiment</span>
                        </div>
                        <img id="coverPreviewImg" class="cover-preview-img" style="display:none;">
                    </label>
                    
                    <div id="coverPhotoActions" style="display:none; margin-top: 12px;">
                        <button class="btn secondary" id="coverChangeBtn">🔄 Changer la photo</button>
                    </div>

                    <!-- Client Name -->
                    <div class="cover-client-section">
                        <span class="cover-client-label">Préparé pour</span>
                        <span class="cover-client-value" id="coverClientName">${sanitizeHTML(inspectionData.clientInfo.name) || 'Client à définir'}</span>
                        <span class="cover-client-address" id="coverClientAddress">${sanitizeHTML(inspectionData.clientInfo.address) || ''}</span>
                    </div>
                </div>
            `;
            dynamicContent.appendChild(coverDiv);

            // Wire up the cover photo input
            const coverInput = document.getElementById('coverPhotoInput');
            const coverPreview = document.getElementById('coverPreviewImg');
            const coverUploadContent = document.getElementById('coverUploadContent');
            const coverActions = document.getElementById('coverPhotoActions');
            const coverDropZone = document.getElementById('coverDropZone');

            coverInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const check = validateFile(file);
                if (!check.valid) {
                    alert('⚠️ ' + check.error);
                    coverInput.value = '';
                    return;
                }
                if (file && file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    coverPreview.src = url;
                    coverPreview.alt = 'Photo de façade du bâtiment';
                    coverPreview.style.display = 'block';
                    coverUploadContent.style.display = 'none';
                    coverActions.style.display = 'block';
                    coverDropZone.classList.add('has-photo');

                    // Update sidebar preview + data
                    document.getElementById('sidebarPhotoPreview').src = url;
                    document.getElementById('sidebarPhotoPreview').style.display = 'block';
                    document.getElementById('pinnedHeader').style.display = 'block';
                    inspectionData.clientInfo.coverPhotoUrl = url;
                }
            });

            // Restore existing photo if already uploaded
            if (inspectionData.clientInfo.coverPhotoUrl) {
                coverPreview.src = inspectionData.clientInfo.coverPhotoUrl;
                coverPreview.style.display = 'block';
                coverUploadContent.style.display = 'none';
                coverActions.style.display = 'block';
                coverDropZone.classList.add('has-photo');
            }

            document.getElementById('coverChangeBtn').addEventListener('click', (e) => {
                e.preventDefault();
                coverInput.click();
            });

            // Update nav buttons
            prevBtn.disabled = true;
            nextBtn.textContent = "Commencer l'inspection →";
            return;
        }

        // --- Standard Section Rendering ---
        section.subSections.forEach(sub => {
            const div = document.createElement('div');
            div.className = 'sub-section';
            
            const h3 = document.createElement('h3');
            h3.textContent = sub.title;
            div.appendChild(h3);

            sub.fields.forEach(field => {
                const fieldGroup = document.createElement('div');
                fieldGroup.className = 'field-group';

                if (field.type === 'checkbox') {
                    // Custom Checkbox
                    const label = document.createElement('label');
                    label.className = 'checkbox-btn';
                    
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.id = field.id;
                    
                    const content = document.createElement('div');
                    content.className = 'checkbox-content';
                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = field.label;
                    content.appendChild(labelSpan);
                    
                    // Vision Button
                    const visionBtn = document.createElement('button');
                    visionBtn.className = 'vision-ai-btn';
                    visionBtn.innerHTML = '📷 Analyser Photo';
                    visionBtn.onclick = (e) => {
                        e.preventDefault();
                        openPhotoModal(field);
                    };

                    content.appendChild(document.createElement('br'));
                    content.appendChild(visionBtn);

                    label.appendChild(input);
                    label.appendChild(content);

                    // AI Generation on Click
                    input.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            label.classList.add('checked');
                            generateAIContext(field, fieldGroup);
                        } else {
                            label.classList.remove('checked');
                            const aiBox = fieldGroup.querySelector('.ai-box');
                            if(aiBox) aiBox.remove();
                        }
                    });

                    fieldGroup.appendChild(label);

                // --- Multi-Client Names Field ---
                } else if (field.type === 'clients') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    fieldGroup.appendChild(label);

                    const clientsContainer = document.createElement('div');
                    clientsContainer.id = 'clientsContainer';
                    clientsContainer.style.display = 'flex';
                    clientsContainer.style.flexDirection = 'column';
                    clientsContainer.style.gap = '8px';

                    function renderClientInputs() {
                        clientsContainer.innerHTML = '';
                        inspectionData.clientInfo.names.forEach((name, i) => {
                            const row = document.createElement('div');
                            row.style.display = 'flex';
                            row.style.alignItems = 'center';
                            row.style.gap = '8px';

                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = name;
                            input.placeholder = i === 0 ? 'Nom du client principal...' : 'Nom du co-acheteur / client(e)...';
                            input.style.flex = '1';
                            input.addEventListener('input', () => {
                                inspectionData.clientInfo.names[i] = input.value;
                                propagateClientNames();
                            });
                            row.appendChild(input);

                            // Bouton supprimer (seulement si plus d'un client)
                            if (inspectionData.clientInfo.names.length > 1) {
                                const removeBtn = document.createElement('button');
                                removeBtn.type = 'button';
                                removeBtn.textContent = '✕';
                                removeBtn.title = 'Retirer ce client';
                                removeBtn.style.cssText = 'width:36px;height:36px;border-radius:8px;border:1px solid #e2e8f0;background:#fef2f2;color:#dc2626;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;';
                                removeBtn.addEventListener('mouseenter', () => { removeBtn.style.background = '#fee2e2'; removeBtn.style.borderColor = '#fca5a5'; });
                                removeBtn.addEventListener('mouseleave', () => { removeBtn.style.background = '#fef2f2'; removeBtn.style.borderColor = '#e2e8f0'; });
                                removeBtn.addEventListener('click', () => {
                                    inspectionData.clientInfo.names.splice(i, 1);
                                    propagateClientNames();
                                    renderClientInputs();
                                });
                                row.appendChild(removeBtn);
                            }

                            clientsContainer.appendChild(row);
                        });
                    }

                    renderClientInputs();
                    fieldGroup.appendChild(clientsContainer);

                    // Bouton "Ajouter un(e) client(e)"
                    const addBtn = document.createElement('button');
                    addBtn.type = 'button';
                    addBtn.textContent = '＋ Ajouter un(e) client(e)';
                    addBtn.style.cssText = 'margin-top:8px;padding:10px 16px;border-radius:8px;border:2px dashed #cbd5e1;background:#f8fafc;color:#3b82f6;font-weight:600;font-size:0.9rem;cursor:pointer;transition:all 0.2s;width:100%;';
                    addBtn.addEventListener('mouseenter', () => { addBtn.style.borderColor = '#3b82f6'; addBtn.style.background = '#eef2ff'; });
                    addBtn.addEventListener('mouseleave', () => { addBtn.style.borderColor = '#cbd5e1'; addBtn.style.background = '#f8fafc'; });
                    addBtn.addEventListener('click', () => {
                        inspectionData.clientInfo.names.push('');
                        propagateClientNames();
                        renderClientInputs();
                        // Focus le dernier input ajouté
                        const inputs = clientsContainer.querySelectorAll('input');
                        if (inputs.length > 0) inputs[inputs.length - 1].focus();
                    });
                    fieldGroup.appendChild(addBtn);

                } else if (field.type === 'date') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const input = document.createElement('input');
                    input.type = 'date';
                    input.id = field.id;
                    input.style.cssText = 'width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:8px; font-size:1rem;';
                    // Restore saved value
                    if (inspectionData[field.id]) input.value = inspectionData[field.id];
                    input.addEventListener('change', () => { inspectionData[field.id] = input.value; saveAppState(); });
                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(input);

                } else if (field.type === 'number' || field.type === 'text') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const input = document.createElement('input');
                    input.type = field.type;
                    input.id = field.id;
                    input.placeholder = field.placeholder || '';
                    
                    if (field.id === 'inspector_name') input.value = inspectionData.clientInfo.inspectorName || '';
                    if (field.id === 'prop_address') input.value = inspectionData.clientInfo.address || '';
                    
                    // Persistance du nom inspecteur
                    if (field.id === 'inspector_name') {
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.inspectorName = input.value;
                            localStorage.setItem('inspectpro_inspector_name', input.value);
                            const coverName = document.getElementById('coverInspectorName');
                            if (coverName) coverName.textContent = input.value || 'À définir';
                        });
                    }
                    
                    // Persistance de l'adresse
                    if (field.id === 'prop_address') {
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.address = input.value;
                            localStorage.setItem('inspectpro_client_address', input.value);
                            propagateClientNames(); // Met à jour sidebar + cover
                            const coverAddr = document.getElementById('coverClientAddress');
                            if (coverAddr) coverAddr.textContent = input.value || '';
                        });
                    }
                    
                    // Converter logic for Area
                    if (field.id === 'prop_area') {
                        const hint = document.createElement('span');
                        hint.style.fontSize = "0.85rem";
                        hint.style.color = "#64748b";
                        hint.style.marginLeft = "8px";
                        
                        input.addEventListener('input', (e) => {
                            let m2 = parseFloat(e.target.value);
                            if(!isNaN(m2)){
                                let sqft = Math.round(m2 * 10.7639);
                                hint.textContent = `(${sqft} pi²)`;
                            } else {
                                hint.textContent = '';
                            }
                        });
                        label.appendChild(hint);
                    }
                    
                    // Alerte de vigilance pour l'année de construction (Santé / Matériaux)
                    if (field.id === 'prop_year') {
                        const alertBox = document.createElement('div');
                        alertBox.style.marginTop = "8px";
                        alertBox.style.padding = "10px 12px";
                        alertBox.style.borderRadius = "6px";
                        alertBox.style.fontSize = "0.85rem";
                        alertBox.style.display = "none";
                        alertBox.style.lineHeight = "1.5";
                        
                        input.addEventListener('input', (e) => {
                            const year = parseInt(e.target.value);
                            if(isNaN(year) || e.target.value.length < 4) {
                                alertBox.style.display = "none";
                                return;
                            }
                            
                            let warnings = [];
                            if (year < 1990) {
                                warnings.push("☢️ <strong>Amiante :</strong> Fort risque dans l'isolation (Vermiculite/Zonolite), le plâtre, le stucco ou les tuiles de plancher.");
                            }
                            if (year <= 1980) {
                                warnings.push("☣️ <strong>Plomb :</strong> Possibilité de tuyauterie en plomb ou de peinture au plomb.");
                            }
                            if (year >= 1998 && year <= 2014) {
                                warnings.push("🧱 <strong>Pyrrhotite :</strong> Surveillez de près les fissures en toile d'araignée sur les fondations.");
                            }
                            if (year < 1999) {
                                warnings.push("🪨 <strong>Pyrite :</strong> Soyez attentif aux soulèvements ou fissures étoilées de la dalle de béton (Sous-sol/Garage).");
                            }
                            if (year >= 1989 && year <= 1998) {
                                warnings.push("💧 <strong>Plomberie Poly-B :</strong> Risque élevé de trouver des conduits d'eau gris problématiques.");
                            }
                            
                            if (warnings.length > 0) {
                                alertBox.innerHTML = "<strong style='color:#b91c1c; font-size: 0.9rem;'>VIGILANCE REQUISE (Maison de " + year + ") :</strong><br>" + warnings.join("<br>");
                                alertBox.style.backgroundColor = "#fef2f2";
                                alertBox.style.border = "1px solid #fecaca";
                                alertBox.style.color = "#7f1d1d";
                                alertBox.style.display = "block";
                            } else {
                                alertBox.style.display = "none";
                            }
                        });
                        // Append after the input
                        setTimeout(() => fieldGroup.appendChild(alertBox), 0);
                    }

                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(input);
                } else if (field.type === 'select') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const select = document.createElement('select');
                    select.id = field.id;

                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        select.appendChild(option);
                    });

                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(select);
                } else if (field.type === 'file') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const input = document.createElement('input');
                    input.type = field.type;
                    
                    const previewContainer = document.createElement('div');
                    previewContainer.style.marginTop = "12px";
                    previewContainer.style.display = "none";
                    
                    const imgPreview = document.createElement('img');
                    imgPreview.style.maxWidth = "100%";
                    imgPreview.style.maxHeight = "300px";
                    imgPreview.style.borderRadius = "8px";
                    imgPreview.style.boxShadow = "var(--shadow)";
                    imgPreview.style.objectFit = "cover";
                    previewContainer.appendChild(imgPreview);

                    input.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        const check = validateFile(file);
                        if (!check.valid) {
                            alert('⚠️ ' + check.error);
                            input.value = '';
                            return;
                        }
                        if (file && file.type.startsWith('image/')) {
                            const url = URL.createObjectURL(file);
                            imgPreview.src = url;
                            imgPreview.alt = field.label;
                            previewContainer.style.display = "block";
                            
                            // Mettre à jour la photo dans la barre latérale si c'est la photo de couverture
                            if (field.id === 'cover_photo') {
                                document.getElementById('sidebarPhotoPreview').src = url;
                                document.getElementById('sidebarPhotoPreview').style.display = "block";
                                document.getElementById('pinnedHeader').style.display = "block";
                                inspectionData.clientInfo.coverPhotoUrl = url;
                            } else if (field.id === 'inspector_signature') {
                                inspectionData.clientInfo.signatureUrl = url;
                            } else if (field.id === 'inspector_seal') {
                                inspectionData.clientInfo.sealUrl = url;
                            }
                        } else {
                            previewContainer.style.display = "none";
                            imgPreview.src = "";
                        }
                    });

                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(input);
                    fieldGroup.appendChild(previewContainer);
                } else if (field.type === 'info') {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'info-block';
                    infoDiv.innerHTML = field.content;
                    fieldGroup.appendChild(infoDiv);
                } else if (field.type === 'action') {
                    const btn = document.createElement('button');
                    btn.className = 'btn primary';
                    btn.style.width = '100%';
                    btn.style.padding = '16px';
                    btn.style.fontSize = '1.1rem';
                    btn.style.marginTop = '12px';
                    btn.textContent = field.label;
                    btn.addEventListener('click', () => {
                        if (field.id === 'rap_generate') generateFinalReport();
                    });
                    fieldGroup.appendChild(btn);
                }

                div.appendChild(fieldGroup);
            });

            // --- Multi-Photo Gallery for each sub-section ---
            if (!inspectionData.sectionPhotos[sub.id]) {
                inspectionData.sectionPhotos[sub.id] = [];
            }

            const galleryContainer = document.createElement('div');
            galleryContainer.className = 'sub-gallery-container';
            galleryContainer.style.cssText = 'margin-top: 20px; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc;';
            
            const galleryTitle = document.createElement('h4');
            galleryTitle.textContent = '📸 Photos additionnelles (' + sub.title + ')';
            galleryTitle.style.cssText = 'margin-top: 0; margin-bottom: 12px; font-size: 0.95rem; color: #475569;';
            galleryContainer.appendChild(galleryTitle);

            const grid = document.createElement('div');
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-bottom: 12px;';
            
            const renderGallery = () => {
                grid.innerHTML = '';
                inspectionData.sectionPhotos[sub.id].forEach((photoObj, i) => {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                    
                    const img = document.createElement('img');
                    img.src = photoObj.url;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                    
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Supprimer cette photo';
                    delBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(220, 38, 38, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                    delBtn.onclick = () => {
                        inspectionData.sectionPhotos[sub.id].splice(i, 1);
                        renderGallery();
                    };
                    
                    wrap.appendChild(img);
                    wrap.appendChild(delBtn);
                    grid.appendChild(wrap);
                });
            };

            renderGallery();
            
            const uploadBtnWrap = document.createElement('div');
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.style.display = 'none';
            
            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = '＋ Ajouter des photos';
            uploadBtn.type = 'button';
            uploadBtn.className = 'btn secondary';
            uploadBtn.style.cssText = 'font-size: 0.85rem; padding: 6px 12px;';
            
            uploadBtn.onclick = () => fileInput.click();
            
            fileInput.onchange = (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    const check = validateFile(file);
                    if (check.valid) {
                        const url = URL.createObjectURL(file);
                        inspectionData.sectionPhotos[sub.id].push({ url: url });
                    } else {
                        alert('⚠️ ' + check.error);
                    }
                });
                renderGallery();
                fileInput.value = '';
            };

            uploadBtnWrap.appendChild(uploadBtn);
            uploadBtnWrap.appendChild(fileInput);
            
            galleryContainer.appendChild(grid);
            galleryContainer.appendChild(uploadBtnWrap);
            
            div.appendChild(galleryContainer);

            // --- Champ Commentaire + Sévérité (sous-section) ---
            const subCommentBlock = document.createElement('div');
            subCommentBlock.style.cssText = 'margin-top: 16px; padding: 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;';
            subCommentBlock.innerHTML = `
                <div style="font-weight: 600; font-size: 0.9rem; color: #92400e; margin-bottom: 10px;">📝 Commentaires — ${sub.title}</div>
                <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                    <button type="button" class="sev-btn" data-sev="urgent" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #ef4444; background: white; color: #ef4444; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        🔴 Urgent
                    </button>
                    <button type="button" class="sev-btn" data-sev="majeur" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #f59e0b; background: white; color: #b45309; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        🟠 Majeur
                    </button>
                    <button type="button" class="sev-btn" data-sev="mineur" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #eab308; background: white; color: #854d0e; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        🟡 Mineur
                    </button>
                    <button type="button" class="sev-btn" data-sev="ok" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #10b981; background: white; color: #065f46; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        ✅ Conforme
                    </button>
                    <input type="hidden" id="comment_sev_${sub.id}" value="">
                </div>
                <textarea id="comment_txt_${sub.id}" placeholder="Observations de l'inspecteur pour cette sous-section..."
                    style="width:100%; min-height:80px; padding:10px; border:1px solid #fed7aa; border-radius:6px; font-size:0.9rem; font-family:inherit; resize:vertical; background:white;">${(inspectionData.comments && inspectionData.comments[sub.id]) ? inspectionData.comments[sub.id].text : ''}</textarea>
            `;
            div.appendChild(subCommentBlock);

            // Wire severity buttons for sub-section
            subCommentBlock.querySelectorAll('.sev-btn').forEach(btn => {
                const targetId = btn.dataset.target;
                const sevInput = subCommentBlock.querySelector('#' + targetId);
                // Restore saved state
                if (inspectionData.comments && inspectionData.comments[sub.id] && inspectionData.comments[sub.id].severity === btn.dataset.sev) {
                    btn.style.color = 'white';
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    sevInput.value = btn.dataset.sev;
                }
                btn.addEventListener('click', () => {
                    // Reset all
                    subCommentBlock.querySelectorAll('.sev-btn').forEach(b => {
                        b.style.background = 'white';
                        const colorsReset = { urgent: '#ef4444', majeur: '#b45309', mineur: '#854d0e', ok: '#065f46' };
                        b.style.color = colorsReset[b.dataset.sev] || '#64748b';
                    });
                    // Activate selected
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    btn.style.color = 'white';
                    sevInput.value = btn.dataset.sev;
                    // Save
                    if (!inspectionData.comments) inspectionData.comments = {};
                    if (!inspectionData.comments[sub.id]) inspectionData.comments[sub.id] = {};
                    inspectionData.comments[sub.id].severity = btn.dataset.sev;
                });
            });

            // Save text comment on input
            const subTxtArea = subCommentBlock.querySelector('#comment_txt_' + sub.id);
            subTxtArea.addEventListener('input', () => {
                if (!inspectionData.comments) inspectionData.comments = {};
                if (!inspectionData.comments[sub.id]) inspectionData.comments[sub.id] = {};
                inspectionData.comments[sub.id].text = subTxtArea.value;
            });

            dynamicContent.appendChild(div);
        });

        // --- Champ Commentaire + Sévérité (section principale) ---
        if (!section.isCoverPage) {
            const secCommentBlock = document.createElement('div');
            secCommentBlock.style.cssText = 'margin-top: 8px; margin-bottom: 24px; padding: 18px; background: #eff6ff; border: 2px solid #93c5fd; border-radius: 10px;';
            const secId = 'section_' + index;
            secCommentBlock.innerHTML = `
                <div style="font-weight: 700; font-size: 1rem; color: #1e40af; margin-bottom: 12px;">🗂️ Commentaire global — ${section.title}</div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <button type="button" class="sev-btn-sec" data-sev="urgent"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #ef4444; background: white; color: #ef4444; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        🔴 Urgent
                    </button>
                    <button type="button" class="sev-btn-sec" data-sev="majeur"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #f59e0b; background: white; color: #b45309; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        🟠 Majeur
                    </button>
                    <button type="button" class="sev-btn-sec" data-sev="mineur"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #eab308; background: white; color: #854d0e; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        🟡 Mineur
                    </button>
                    <button type="button" class="sev-btn-sec" data-sev="ok"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #10b981; background: white; color: #065f46; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        ✅ Conforme
                    </button>
                    <input type="hidden" id="sec_sev_${secId}" value="">
                </div>
                <textarea id="sec_txt_${secId}" placeholder="Résumé global de l'inspecteur pour cette section..."
                    style="width:100%; min-height:90px; padding:12px; border:1px solid #93c5fd; border-radius:6px; font-size:0.95rem; font-family:inherit; resize:vertical; background:white;">${(inspectionData.sectionComments && inspectionData.sectionComments[secId]) ? inspectionData.sectionComments[secId].text : ''}</textarea>
            `;
            dynamicContent.appendChild(secCommentBlock);

            // Wire section severity buttons
            secCommentBlock.querySelectorAll('.sev-btn-sec').forEach(btn => {
                const sevInput = secCommentBlock.querySelector('#sec_sev_' + secId);
                if (inspectionData.sectionComments && inspectionData.sectionComments[secId] && inspectionData.sectionComments[secId].severity === btn.dataset.sev) {
                    btn.style.color = 'white';
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    sevInput.value = btn.dataset.sev;
                }
                btn.addEventListener('click', () => {
                    secCommentBlock.querySelectorAll('.sev-btn-sec').forEach(b => {
                        b.style.background = 'white';
                        const colorsReset = { urgent: '#ef4444', majeur: '#b45309', mineur: '#854d0e', ok: '#065f46' };
                        b.style.color = colorsReset[b.dataset.sev] || '#64748b';
                    });
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    btn.style.color = 'white';
                    sevInput.value = btn.dataset.sev;
                    if (!inspectionData.sectionComments) inspectionData.sectionComments = {};
                    if (!inspectionData.sectionComments[secId]) inspectionData.sectionComments[secId] = {};
                    inspectionData.sectionComments[secId].severity = btn.dataset.sev;
                });
            });

            const secTxtArea = secCommentBlock.querySelector('#sec_txt_' + secId);
            secTxtArea.addEventListener('input', () => {
                if (!inspectionData.sectionComments) inspectionData.sectionComments = {};
                if (!inspectionData.sectionComments[secId]) inspectionData.sectionComments[secId] = {};
                inspectionData.sectionComments[secId].text = secTxtArea.value;
            });
        }

        // Update nav buttons
        prevBtn.disabled = index === 0;
        if(index === inspectionData.sections.length - 1) {
            nextBtn.textContent = "Générer Rapport (PDF)";
        } else {
            nextBtn.textContent = "Suivant";
        }
    }

    prevBtn.addEventListener('click', () => {
        if(currentSectionIndex > 0) { currentSectionIndex--; renderSection(currentSectionIndex); renderNavigation(); }
    });

    nextBtn.addEventListener('click', () => {
        if(currentSectionIndex < inspectionData.sections.length - 1) { 
            currentSectionIndex++; renderSection(currentSectionIndex); renderNavigation(); 
        } else {
            generateFinalReport();
        }
    });

    // --- 3. Intelligence Artificielle (Simulation Claude) ---
    function generateAIContext(field, container) {
        // Prevent duplicate boxes
        if(container.querySelector('.ai-box')) return;

        const aiBox = document.createElement('div');
        aiBox.className = 'ai-box';
        aiBox.innerHTML = `<em>IA réfléchit...</em>`;
        container.appendChild(aiBox);

        setTimeout(() => {
            const severity = AIAgents.determineSeverity(field.label);
            const narrative = AIAgents.analyzeCheckbox(field.label);
            const compliance = AIAgents.checkCompliance(field.label);
            const reco = AIAgents.getRecommendation(field.label);

            let semColorClass = severity === "URGENT" ? "urgent" : severity === "MAJEUR" ? "major" : "minor";
            
            let html = `
                <span class="ai-badge ${semColorClass}">${severity}</span>
                <p style="margin-top:8px">${narrative}</p>
                <div style="margin-top:8px; font-weight:600; color:#3b82f6;">💡 Reco: ${reco}</div>
            `;
            
            if(compliance.length > 0) {
                html += `<div style="margin-top:8px; padding:8px; background:#fee2e2; color:#b91c1c; border-radius:4px; font-size:0.85rem;">
                    <strong>⚠️ Alerte Conformité:</strong> ${compliance.join('<br>')}
                </div>`;
            }

            aiBox.innerHTML = html;
        }, 600);
    }

    // --- 4. Photo Vision Modal & Drawing ---
    const modal = document.getElementById('photoModal');
    const photoArea = document.getElementById('photoArea');
    const photoText = document.getElementById('photoText');
    const simulatedImg = document.getElementById('simulatedImg');
    const drawCanvas = document.getElementById('drawCanvas');
    const drawToolbar = document.getElementById('drawToolbar');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const aiResultArea = document.getElementById('aiResultArea');
    const applyAiBtn = document.getElementById('applyAiBtn');
    let currentVisionField = null;

    // Drawing context
    let ctx = null;
    let isDrawing = false;
    let currentTool = 'circle'; 
    let startX = 0, startY = 0;
    let snapshot = null; // Save state for shape preview

    function initCanvas() {
        // Obtenir la taille réelle affichée
        const rect = photoArea.getBoundingClientRect();
        drawCanvas.width = rect.width;
        drawCanvas.height = rect.height;
        ctx = drawCanvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function openPhotoModal(field) {
        currentVisionField = field;
        modal.classList.add('open');
        
        // Reset states
        photoArea.classList.remove('taken');
        photoText.style.display = 'block';
        photoText.innerHTML = 'Appuyez pour prendre une photo du défaut';
        simulatedImg.style.display = 'none';
        drawCanvas.style.display = 'none';
        drawToolbar.style.display = 'none';
        
        aiResultArea.style.display = 'none';
        applyAiBtn.style.display = 'none';
        takePhotoBtn.style.display = 'block';
    }

    document.getElementById('closeModal').addEventListener('click', () => { modal.classList.remove('open'); });

    takePhotoBtn.addEventListener('click', async () => {
        photoArea.classList.add('taken');
        photoText.innerHTML = '📸 Photo capturée...<br><br>Traitement par Claude Vision...';
        takePhotoBtn.style.display = 'none';
        
        // Simuler la photo en chargeant une image générique de défaut
        // Pour les fondations, utilisons un mur en exemple.
        simulatedImg.src = "https://images.unsplash.com/photo-1518640166946-86927918a3ce?auto=format&fit=crop&q=80&w=500";
        
        const result = await AIAgents.analyzePhoto();
        
        // Afficher l'image et l'outil de dessin
        photoText.style.display = 'none';
        simulatedImg.style.display = 'block';
        drawCanvas.style.display = 'block';
        drawToolbar.style.display = 'flex';
        
        initCanvas();

        document.getElementById('analysisText').textContent = result.description;
        document.getElementById('recommendationText').textContent = result.recommendation;
        aiResultArea.style.display = 'block';
        applyAiBtn.style.display = 'block';
    });

    // --- Drawing Logic ---
    const drawBtns = document.querySelectorAll('.draw-btn');
    drawBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            drawBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    document.getElementById('clearDrawBtn').addEventListener('click', () => {
        if(ctx) ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });

    function getMousePos(e) {
        const rect = drawCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startDraw = (e) => {
        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.strokeStyle = document.getElementById('drawColor').value;
        ctx.lineWidth = 4;
        snapshot = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
        e.preventDefault(); // prevent scrolling on touch
    };

    const drawing = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        ctx.putImageData(snapshot, 0, 0); // Restore to preview current shape

        if (currentTool === 'freehand') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            snapshot = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height); // save continuously
        } else if (currentTool === 'circle') {
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (currentTool === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            // Arrowhead
            const angle = Math.atan2(pos.y - startY, pos.x - startX);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x - 15 * Math.cos(angle - Math.PI / 6), pos.y - 15 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(pos.x - 15 * Math.cos(angle + Math.PI / 6), pos.y - 15 * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(pos.x, pos.y);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }
        e.preventDefault();
    };

    const stopDraw = () => { isDrawing = false; };

    drawCanvas.addEventListener('mousedown', startDraw);
    drawCanvas.addEventListener('mousemove', drawing);
    drawCanvas.addEventListener('mouseup', stopDraw);
    drawCanvas.addEventListener('mouseout', stopDraw);
    
    // Support tactil pour iPad/Tablette
    drawCanvas.addEventListener('touchstart', startDraw, {passive: false});
    drawCanvas.addEventListener('touchmove', drawing, {passive: false});
    drawCanvas.addEventListener('touchend', stopDraw);

    applyAiBtn.addEventListener('click', () => {
        // Auto check the box and trigger narrative
        const checkbox = document.getElementById(currentVisionField.id);
        if(checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
        }
        modal.classList.remove('open');
    });

    // --- 5. Assistant Chatbot ---
    const assistantBtn = document.getElementById('assistantBtn');
    const sidebar = document.getElementById('assistantSidebar');
    const closeAssistant = document.getElementById('closeAssistant');
    const expandAssistantBtn = document.getElementById('expandAssistantBtn');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatHistory = document.getElementById('chatHistory');

    // UI Configuration API
    const aiSettingsBtn = document.getElementById('aiSettingsBtn');
    const aiConfigPanel = document.getElementById('aiConfigPanel');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const apiProvider = document.getElementById('apiProvider');
    const saveApiBtn = document.getElementById('saveApiBtn');

    if (aiSettingsBtn) {
        aiSettingsBtn.addEventListener('click', () => {
            aiConfigPanel.style.display = aiConfigPanel.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (saveApiBtn) {
        const savedKey = localStorage.getItem('inspectpro_api_key');
        const savedProvider = localStorage.getItem('inspectpro_api_provider');
        if (savedKey) geminiApiKey.value = savedKey;
        if (savedProvider && apiProvider) apiProvider.value = savedProvider;
        
        saveApiBtn.addEventListener('click', () => {
            const key = geminiApiKey.value.trim();
            const provider = apiProvider ? apiProvider.value : 'gemini';
            if (key) {
                localStorage.setItem('inspectpro_api_key', key);
                localStorage.setItem('inspectpro_api_provider', provider);
                aiConfigPanel.style.display = 'none';
                
                // Add system message
                const sysMsg = document.createElement('div');
                sysMsg.className = 'message ai';
                sysMsg.style.backgroundColor = '#064e3b';
                sysMsg.style.color = '#a7f3d0';
                
                let providerName = provider === 'openai' ? 'ChatGPT (OpenAI)' : provider === 'anthropic' ? 'Claude (Anthropic)' : 'Gemini (Google)';
                sysMsg.textContent = `Système: Clé enregistrée pour ${providerName}. Je suis connecté au réseau et prêt à vous aider.`;
                chatHistory.appendChild(sysMsg);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            } else {
                localStorage.removeItem('inspectpro_api_key');
                localStorage.removeItem('inspectpro_api_provider');
            }
        });

        // Bouton Effacer la clé
        const clearApiBtn = document.getElementById('clearApiBtn');
        if (clearApiBtn) {
            clearApiBtn.addEventListener('click', () => {
                localStorage.removeItem('inspectpro_api_key');
                localStorage.removeItem('inspectpro_api_provider');
                geminiApiKey.value = '';
                const sysMsg = document.createElement('div');
                sysMsg.className = 'message ai';
                sysMsg.style.backgroundColor = '#7f1d1d';
                sysMsg.style.color = '#fecaca';
                sysMsg.textContent = 'Clé API effacée. Je suis en mode démo hors-ligne.';
                chatHistory.appendChild(sysMsg);
                chatHistory.scrollTop = chatHistory.scrollHeight;
                aiConfigPanel.style.display = 'none';
            });
        }
    }

    // --- Mobile Menu Toggle (Bug fix: handler was missing) ---
    const menuToggle = document.getElementById('menuToggle');
    const navSidebar = document.getElementById('sidebar');
    if (menuToggle && navSidebar) {
        menuToggle.addEventListener('click', () => navSidebar.classList.toggle('open'));
    }

    const assistantSidebarEl = document.getElementById('assistantSidebar');
    assistantBtn.addEventListener('click', () => assistantSidebarEl.classList.toggle('open'));
    closeAssistant.addEventListener('click', () => {
        assistantSidebarEl.classList.remove('open');
        assistantSidebarEl.classList.remove('expanded');
    });
    if (expandAssistantBtn) {
        expandAssistantBtn.addEventListener('click', () => assistantSidebarEl.classList.toggle('expanded'));
    }

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        // User message
        const uMsg = document.createElement('div');
        uMsg.className = 'message user';
        uMsg.textContent = text;
        chatHistory.appendChild(uMsg);
        chatInput.value = '';

        // IA Typing
        const aiMsg = document.createElement('div');
        aiMsg.className = 'message ai';
        aiMsg.innerHTML = '<em>Recherche dans les normes...</em>';
        chatHistory.appendChild(aiMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Get Answer
        const answer = await AIAgents.askAssistant(text);
        aiMsg.innerHTML = answer;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });

    // --- 6. Génération du Rapport Final ---
    function generateFinalReport() {
        if (typeof BOILERPLATE === 'undefined') {
            alert("Erreur: Impossible de charger le contenu légal (boilerplate.js manquant).");
            return;
        }

        const reportModal = document.getElementById('reportModal');
        const reportContent = document.getElementById('reportContent');
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || 'Client inconnu';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || 'Adresse à spécifier';
        const prixElement = document.getElementById('prix_inspection');
        const prix = prixElement ? prixElement.value : "500"; // fallback
        const normeElement = document.getElementById('norme_pratique');
        const norme = (normeElement && normeElement.value) ? normeElement.value : "Réseau IBC (Inspecteurs en Bâtiment Certifiés)";
        const signatureUrl = inspectionData.clientInfo.signatureUrl || null;
        const sealUrl = inspectionData.clientInfo.sealUrl || null;
        
        let html = `
            <!-- COUVERTURE -->
            <div class="page-break" style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 800px;">
                <h1 style="font-size: 3rem; color: #0f172a; margin-bottom: 20px; font-weight: 800;">RAPPORT D'INSPECTION DE BÂTIMENT</h1>
                <p style="color: #64748b; font-size: 1.5rem; margin-bottom: 50px;">KZO InspectPro — Service d'expertise professionnelle</p>
                
                ${inspectionData.clientInfo.coverPhotoUrl ? `<img src="${inspectionData.clientInfo.coverPhotoUrl}" style="width: 80%; max-height: 500px; object-fit: cover; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 50px;">` : '<div style="width: 80%; height: 400px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #94a3b8; border-radius: 12px; margin-bottom: 50px;">[Photo de façade non disponible]</div>'}
                
                <div style="font-size: 1.4rem; color: #334155; line-height: 1.8;">
                    <p><strong>Préparé pour :</strong> ${clientName}</p>
                    <p><strong>Propriété inspectée :</strong> ${address}</p>
                    <p><strong>Date de l'inspection :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>
                </div>
            </div>
        `;
        
        // 1. FACTURE
        html += BOILERPLATE.facture(clientName, address, prix, inspectionData.id);
        
        // 2. LETTRE D'INTRO
        const inspectorName = inspectionData.clientInfo.inspectorName || 'Inspecteur';
        html += BOILERPLATE.lettreIntro(clientName, norme, inspectorName, signatureUrl, sealUrl);
        
        // 2.5 COMMENT LIRE CE RAPPORT
        if (BOILERPLATE.commentLire) html += BOILERPLATE.commentLire;
        
        // 2.8 LOCALISATION (GOOGLE MAPS)
        if (BOILERPLATE.localisation) html += BOILERPLATE.localisation(address);
        
        // 3. CONVENTIONS LÉGALES ET LIMITATIONS
        html += BOILERPLATE.conventions;

        // 4. SOMMAIRE EXÉCUTIF
        html += `
            <div class="page-break" style="padding-top: 50px;">
                <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; font-size: 2rem;">Sommaire Exécutif</h2>
                <p style="color: #475569; margin-bottom: 25px; line-height: 1.6;">Ce sommaire présente une vue rapide de l'état du bâtiment et répertorie les travaux qui nécessitent une intervention rapide. Il ne remplace en aucun cas la lecture attentive du rapport complet. L'acheteur doit prendre connaissance de tout le document.</p>
                
                <div style="padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px;">
                    <p style="margin-bottom: 20px; font-size: 1.15rem;"><strong>État général au moment de l'inspection :</strong> <br><br><span style="background: #eef2ff; color: #4338ca; padding: 6px 14px; border-radius: 4px; font-weight: bold; border: 1px solid #c7d2fe;">${document.getElementById('rap_etat_general')?.value || 'Non évalué'}</span></p>
                    <p style="margin-bottom: 20px; font-size: 1.1rem; line-height: 1.6;"><strong>Travaux prioritaires :</strong><br>${document.getElementById('rap_priorite')?.value || 'Aucun documenté.'}</p>
                    <p style="font-size: 1.1rem; line-height: 1.6;"><strong>Notes structurelles et générales de l'inspecteur :</strong><br>${document.getElementById('rap_notes')?.value || 'Aucune observation supplémentaire globale.'}</p>
                    <p style="font-size: 1.1rem; line-height: 1.6; margin-top:16px;"><strong>Recommandations d'entretien préventif :</strong><br>${document.getElementById('rap_entretien')?.value || 'Aucune recommandation supplémentaire.'}</p>
                </div>
            </div>
        `;
        
        // 5. CORPS DU RAPPORT (TOUTES LES 8 SECTIONS)
        let defectCount = 0;
        
        inspectionData.sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport') return;
            
            // Each section forces a new page break to generate volume.
            html += `<div class="page-break" style="padding-top: 50px;">
                     <h2 style="color: #3b82f6; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 1.8rem;">Section Spécifique : ${section.title}</h2>
                     <p style="margin-bottom: 30px; font-style: italic; color: #64748b; line-height: 1.6;">Cette section documente l'état des composants apparents et fournit des détails sur la fonctionnalité de base au moment de l'examen. Les éléments non mentionnés n'ont pu être inspectés de façon visuelle libre en raison de finitions ou d'encombrement.</p>`;
                     
            let sectionHasDefects = false;
            let defectsHtml = "";
            let infoHtml = "<div style='margin-bottom: 40px;'><h3 style='font-size: 1.3rem; margin-bottom: 20px;'>Méthode et matériaux observés</h3><ul style='list-style-type: none; padding: 0;'>";
            
            section.subSections.forEach(sub => {
                sub.fields.forEach(field => {
                    // Technical descriptions
                    if (field.type === 'select' || field.type === 'text' || field.type === 'number') {
                        const val = document.getElementById(field.id)?.value;
                        if(val) {
                            infoHtml += `<li style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 1.05rem;"><strong style="color: #334155;">${field.label} :</strong> <span style="color: #0f172a;">${val}</span></li>`;
                        }
                    }
                    
                    // Defects
                    if (field.type === 'checkbox') {
                        const cb = document.getElementById(field.id);
                        if (cb && cb.checked) {
                            sectionHasDefects = true;
                            defectCount++;
                            const severity = AIAgents.determineSeverity(field.label);
                            const reco = AIAgents.getRecommendation(field.label);
                            const narrative = AIAgents.analyzeCheckbox(field.label);
                            
                            let color = severity === "URGENT" ? "#dc2626" : severity === "MAJEUR" ? "#d97706" : "#475569";
                            let bgClass = severity === "URGENT" ? "#fef2f2" : severity === "MAJEUR" ? "#fffbeb" : "#f8fafc";
                            let borderClass = severity === "URGENT" ? "#fecaca" : severity === "MAJEUR" ? "#fde68a" : "#e2e8f0";
                            
                            defectsHtml += `
                                <div style="margin-bottom: 25px; padding: 25px; background: ${bgClass}; border: 1px solid ${borderClass}; border-left: 6px solid ${color}; border-radius: 8px; page-break-inside: avoid;">
                                    <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px;">
                                        <span style="background: ${color}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; margin-top: 2px;">${severity}</span>
                                        <strong style="font-size: 1.15rem; color: #0f172a;">${field.label}</strong>
                                    </div>
                                    <p style="color: #334155; font-size: 1rem; line-height: 1.6; margin-bottom: 15px; white-space: pre-line;">${narrative}</p>
                                    <div style="color: #0f172a; font-size: 1rem; background: rgba(0,0,0,0.03); padding: 15px; border-radius: 6px;"><strong>💡 Recommandation de l'expert :</strong><br>${reco}</div>
                                </div>
                            `;
                        }
                    }
                });

                // Photos addionnelles pour la sous-section dans le rapport
                const subPhotos = inspectionData.sectionPhotos[sub.id] || [];
                if (subPhotos.length > 0) {
                    infoHtml += `</ul>`; // Fermer la liste des champs
                    infoHtml += `<div style="margin: 20px 0; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">`;
                    infoHtml += `<strong style="color: #475569; font-size: 1.05rem;">Photos associées (${sub.title}) :</strong>`;
                    infoHtml += `<div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px;">`;
                    subPhotos.forEach(photo => {
                        infoHtml += `<img src="${photo.url}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">`;
                    });
                    infoHtml += `</div></div>`;
                    infoHtml += `<ul style='list-style-type: none; padding: 0;'>`; // Réouvrir pour la prochaine sous-section
                }
            });
            infoHtml += "</ul></div>";
            
            // Print the info gathered
            html += infoHtml;
            
            // Print anomalies
            html += `<h3 style='font-size: 1.3rem; margin-bottom: 20px; color: ${sectionHasDefects ? '#dc2626' : '#10b981'};'>Anomalies documentées</h3>`;
            if (sectionHasDefects) {
                html += defectsHtml;
            } else {
                html += `<div style="padding: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46;"><p style="font-size: 1.05rem;">✔ L'inspection visuelle et non-destructive des éléments apparents de cette section n'a révélé aucun défaut d'importance immédiate nécessitant une intervention. Se référer au guide d'entretien pour prolonger la durée de vie des matériaux.</p></div>`;
            }

            // Commentaires des sous-sections
            let hasSubComments = false;
            section.subSections.forEach(sub => {
                const sc = inspectionData.comments && inspectionData.comments[sub.id];
                if (sc && (sc.text || sc.severity)) hasSubComments = true;
            });
            if (hasSubComments) {
                html += `<h3 style='font-size: 1.2rem; margin-top: 30px; margin-bottom: 16px; color: #92400e;'>📝 Commentaires par sous-section</h3>`;
                section.subSections.forEach(sub => {
                    const sc = inspectionData.comments && inspectionData.comments[sub.id];
                    if (!sc || (!sc.text && !sc.severity)) return;
                    const sevColors = { urgent: '#dc2626', majeur: '#d97706', mineur: '#ca8a04', ok: '#059669' };
                    const sevLabels = { urgent: '🔴 URGENT', majeur: '🟠 MAJEUR', mineur: '🟡 MINEUR', ok: '✅ CONFORME' };
                    const sevColor = sevColors[sc.severity] || '#64748b';
                    html += `<div style="margin-bottom: 16px; padding: 16px; background: #fff7ed; border-left: 5px solid ${sevColor}; border-radius: 6px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                            <strong style="color:#1e293b; font-size:1rem;">${sub.title}</strong>
                            ${sc.severity ? `<span style="background:${sevColor}; color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem; font-weight:700;">${sevLabels[sc.severity] || sc.severity}</span>` : ''}
                        </div>
                        ${sc.text ? `<p style="color:#334155; font-size:0.95rem; line-height:1.6; margin:0; white-space:pre-wrap;">${sc.text}</p>` : ''}
                    </div>`;
                });
            }

            // Commentaire global de la section
            const secId = 'section_' + inspectionData.sections.indexOf(section);
            const secC = inspectionData.sectionComments && inspectionData.sectionComments[secId];
            if (secC && (secC.text || secC.severity)) {
                const sevColors = { urgent: '#dc2626', majeur: '#d97706', mineur: '#ca8a04', ok: '#059669' };
                const sevLabels = { urgent: '🔴 URGENT', majeur: '🟠 MAJEUR', mineur: '🟡 MINEUR', ok: '✅ CONFORME' };
                html += `<div style="margin-top: 24px; padding: 20px; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                        <strong style="color:#1e40af; font-size:1.05rem;">🗂️ Commentaire global de l'inspecteur</strong>
                        ${secC.severity ? `<span style="background:${sevColors[secC.severity] || '#64748b'}; color:white; padding:4px 12px; border-radius:12px; font-size:0.85rem; font-weight:700;">${sevLabels[secC.severity] || secC.severity}</span>` : ''}
                    </div>
                    ${secC.text ? `<p style="color:#1e293b; font-size:1rem; line-height:1.7; margin:0; white-space:pre-wrap;">${secC.text}</p>` : ''}
                </div>`;
            }
            
            html += "</div>";
        });
        
        // 5.5 ATTESTATION ET SIGNATURE
        if (BOILERPLATE.attestation) html += BOILERPLATE.attestation(clientName, inspectorName, signatureUrl, sealUrl);
        
        // 6. GUIDE D'ENTRETIEN 
        html += BOILERPLATE.guideEntretien;
        
        // 7. L'ANNEXE MAJEURE (NORMES DE PRATIQUES - 25+ PAGES POUR ATTEINDRE LES 40 PAGES)
        html += BOILERPLATE.normesPratique(norme);
        
        reportContent.innerHTML = html;
        reportModal.style.display = 'flex';
        
        // --- GOOGLE SHEETS WEBHOOK (Tâche de fond) ---
        // L'utilisateur devra coller l'URL fournie par son script Google ici :
        const GOOGLE_WEBHOOK_URL = ""; 

        if (GOOGLE_WEBHOOK_URL && clientName !== "Client inconnu") {
            try {
                fetch(GOOGLE_WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Requis pour éviter les blocages CORS de Google
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: new Date().toLocaleDateString('fr-CA'),
                        facture_id: inspectionData.id,
                        client: clientName,
                        montant: prix
                    })
                });
                console.log("Synchronisation Google Sheets lancée en arrière-plan.");
            } catch(e) {
                console.error("Erreur Webhook Google Sheets :", e);
            }
        }
        
        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
        document.getElementById('printReportBtn').onclick = () => { 
            // On laisse un petit délai (500ms) pour s'assurer que l'iframe Google Maps a le temps de charger avant d'afficher la fenêtre système d'impression.
            setTimeout(() => window.print(), 500); 
        };
    }

    // --- Persistence Globale (Offline Support) ---
    function saveAppState() {
        localStorage.setItem('kzo_inspection_data', JSON.stringify(inspectionData));
    }

    function loadAppState() {
        const saved = localStorage.getItem('kzo_inspection_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Fusionner les données (on garde la structure mais on remplit ce qui existe)
                Object.assign(inspectionData, parsed);
                return true;
            } catch(e) { console.error("Erreur de chargement local", e); }
        }
        return false;
    }

    // Capture de tous les changements du formulaire
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.id && (target.type === 'text' || target.type === 'number' || target.type === 'checkbox' || target.tagName === 'SELECT')) {
            saveAppState();
        }
    });
    // Sauvegarder aussi les textarea (commentaires) en temps réel
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
            saveAppState();
        }
    });

    // Bouton de sauvegarde manuelle
    const forceSync = () => {
        saveAppState();
        alert("✅ Données sauvegardées localement dans votre iPad.");
    };



    // Initialize the app
    loadAppState();
    renderNavigation();
    renderSection(0);

    // Patch for the manual sync button in the UI
    document.addEventListener('click', (e) => {
        if (e.target.textContent && e.target.textContent.includes('Forcer la sauvegarde locale')) {
            forceSync();
        }
    });
});



