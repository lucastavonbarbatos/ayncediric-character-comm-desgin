const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1495076190908715153/wO7nsf0wGDzvTpv3wwJnNPVRpSI2pdbQbWrBA0hyQXEN50EvLq1I4pbWaleZE71SfIr3";
const STORAGE_KEY = "comm_form_progress";

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // 2. Toggle Brief Section (Câu 2)
    // ============================================================
    const methodDetailed    = document.getElementById('method-detailed');
    const methodSkip        = document.getElementById('method-skip');
    const detailedQuestions = document.getElementById('detailed-questions');
    const driveLinkSection  = document.getElementById('drive-link-section');

    // BUG FIX: Lưu lại danh sách các required inputs trong detailed-questions
    // để có thể remove/restore attribute 'required' khi ẩn/hiện section
    const detailedRequiredInputs = detailedQuestions
        ? detailedQuestions.querySelectorAll('input[required], textarea[required]')
        : [];

    function toggleBriefSections() {
        if (methodDetailed && methodDetailed.checked) {
            // Hiện detailed questions → restore required
            detailedQuestions.classList.remove('hidden');
            detailedRequiredInputs.forEach(inp => inp.setAttribute('required', ''));

            // Ẩn drive link → remove required
            driveLinkSection.classList.add('hidden');
            const driveInput = driveLinkSection.querySelector('input');
            if (driveInput) driveInput.removeAttribute('required');

        } else if (methodSkip && methodSkip.checked) {
            // Ẩn detailed questions → remove required để browser không chặn submit
            detailedQuestions.classList.add('hidden');
            detailedRequiredInputs.forEach(inp => inp.removeAttribute('required'));

            // Hiện drive link → restore required
            driveLinkSection.classList.remove('hidden');
            const driveInput = driveLinkSection.querySelector('input');
            if (driveInput) driveInput.setAttribute('required', '');
        }
    }
    methodDetailed?.addEventListener('change', toggleBriefSections);
    methodSkip?.addEventListener('change', toggleBriefSections);

    // Chạy ngay khi load để đảm bảo trạng thái ban đầu nhất quán
    // (cả 2 section đang hidden → remove required của drive input để tránh browser validation)
    if (driveLinkSection) {
        const driveInput = driveLinkSection.querySelector('input');
        if (driveInput && driveLinkSection.classList.contains('hidden')) {
            driveInput.removeAttribute('required');
        }
    }

    // ============================================================
    // 3. Toggle Delivery Method (Câu 10)
    // ============================================================
    const gmailCheck     = document.getElementById('gmail-check');
    const driveCheck     = document.getElementById('drive-check');
    const gmailContainer = document.getElementById('gmail-input-container');
    const driveNote      = document.getElementById('drive-note');

    function updateDeliveryMethod() {
        if (gmailCheck && gmailCheck.checked) {
            gmailContainer.classList.remove('hidden');
            driveNote.classList.add('hidden');
        } else {
            gmailContainer?.classList.add('hidden');
            driveNote?.classList.remove('hidden');
        }
    }
    gmailCheck?.addEventListener('change', updateDeliveryMethod);
    driveCheck?.addEventListener('change', updateDeliveryMethod);

    // ============================================================
    // 4. Deadline cụ thể
    // ============================================================
    const dateCheck     = document.getElementById('date-check');
    const dateContainer = document.getElementById('date-input-container');
    document.querySelectorAll('input[name="deadline_opt"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (dateCheck && dateCheck.checked) {
                dateContainer.classList.remove('hidden');
            } else {
                dateContainer?.classList.add('hidden');
            }
        });
    });

    // ============================================================
    // 5. File input — hiển thị tên file
    // ============================================================
    document.querySelectorAll('.file-input-hidden').forEach(input => {
        const wrapper = input.closest('.file-input-wrapper');
        if (!wrapper) return;
        const btn  = wrapper.querySelector('.btn-file');
        const span = wrapper.querySelector('.file-name');
        if (btn) btn.onclick = () => input.click();
        input.onchange = () => {
            if (input.files.length > 0) {
                span.innerText = input.files.length > 1
                    ? `${input.files.length} tệp đã chọn`
                    : input.files[0].name;
                input.closest('.form-group')?.classList.remove('invalid');
            } else {
                span.innerText = 'Chưa chọn tệp nào';
            }
            saveProgress();
        };
    });

    // ============================================================
    // 6. Lưu & Khôi phục tiến độ (localStorage)
    // ============================================================
    function getSaveableInputs() {
        return document.querySelectorAll(
            '#comm-form input:not([type="file"]):not([type="submit"]), #comm-form textarea, #comm-form select'
        );
    }

    function saveProgress() {
        const data = {};
        getSaveableInputs().forEach(input => {
            if (!input.name) return;
            if (input.type === 'checkbox' || input.type === 'radio') {
                if (input.checked) data[input.name] = input.value;
            } else {
                data[input.name] = input.value;
            }
        });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch(e) { console.warn("Không lưu được tiến độ:", e); }
    }

    function restoreProgress() {
        let saved;
        try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); }
        catch(e) { return; }
        if (!saved) return;

        getSaveableInputs().forEach(input => {
            if (!input.name || !(input.name in saved)) return;
            if (input.type === 'radio') {
                if (input.value === saved[input.name]) {
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else if (input.type === 'checkbox') {
                if (saved[input.name] === input.value) input.checked = true;
            } else {
                input.value = saved[input.name] || '';
            }
        });
        toggleBriefSections();
        updateDeliveryMethod();
        showRestoreNotice();
    }

    function showRestoreNotice() {
        if (!localStorage.getItem(STORAGE_KEY)) return;
        if (document.getElementById('restore-notice')) return;
        const notice = document.createElement('div');
        notice.id = 'restore-notice';
        notice.innerHTML = `
            <span>💾 Tui đã khôi phục tiến độ lần trước của bồ nhen!</span>
            <button id="clear-progress-btn" type="button">Xóa & điền lại từ đầu</button>
        `;
        notice.style.cssText = `
            position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
            background:#FF8DA1; color:white; padding:12px 20px; border-radius:30px;
            font-family:'Quicksand',sans-serif; font-weight:600; font-size:0.9rem;
            display:flex; align-items:center; gap:15px;
            box-shadow:0 4px 15px rgba(255,141,161,0.5); z-index:9999;
        `;
        const clearBtn = notice.querySelector('#clear-progress-btn');
        clearBtn.style.cssText = `
            background:white; color:#FF8DA1; border:none;
            padding:6px 14px; border-radius:20px;
            font-family:inherit; font-weight:700; cursor:pointer; font-size:0.85rem;
        `;
        clearBtn.onclick = () => {
            localStorage.removeItem(STORAGE_KEY);
            notice.remove();
            document.getElementById('comm-form').reset();
            toggleBriefSections();
            updateDeliveryMethod();
        };
        document.body.appendChild(notice);
        setTimeout(() => {
            notice.style.transition = 'opacity 0.5s';
            notice.style.opacity = '0';
            setTimeout(() => notice.remove(), 500);
        }, 6000);
    }

    const form = document.getElementById('comm-form');
    form.addEventListener('change', saveProgress);
    form.addEventListener('input',  saveProgress);
    restoreProgress();

    // ============================================================
    // 7. Validate
    // ============================================================
    function validateGroup(group) {
        if (group.classList.contains('hidden')) return true;
        if (group.closest('.hidden')) return true;
        let isValid = true;

        const radioNames = new Set();
        group.querySelectorAll('input[type="radio"][required]').forEach(r => radioNames.add(r.name));
        radioNames.forEach(name => {
            if (!document.querySelector(`input[name="${name}"]:checked`)) isValid = false;
        });
        group.querySelectorAll('input[type="checkbox"][required]').forEach(cb => {
            if (!cb.checked) isValid = false;
        });
        group.querySelectorAll('input[type="file"][required]').forEach(fi => {
            if (!fi.closest('.hidden') && fi.files.length === 0) isValid = false;
        });
        group.querySelectorAll(
            'input[type="url"][required],input[type="text"][required],input[type="email"][required],input[type="date"][required],textarea[required]'
        ).forEach(inp => {
            if (!inp.closest('.hidden') && !inp.value.trim()) isValid = false;
        });

        group.classList.toggle('invalid', !isValid);
        return isValid;
    }

    form.addEventListener('change', (e) => {
        const group = e.target.closest('.form-group.invalid');
        if (group) validateGroup(group);
    });
    form.addEventListener('input', (e) => {
        const group = e.target.closest('.form-group.invalid');
        if (group) validateGroup(group);
    });

    // ============================================================
    // 8. Gửi Discord — đầy đủ theo từng câu hỏi trong form
    // ============================================================
    async function sendDiscord(p, files) {
        // Helper: trả về giá trị hoặc dấu gạch nếu trống
        const v = (val) => (val && val.trim && val.trim() !== '' && val !== '(Không điền)') ? val : '*(không điền)*';

        // --- Label loại comm ---
        const commMap = {
            '1_mat_truoc': '1 Mặt — Mặt trước (600k)',
            '1_mat_sau':   '1 Mặt — Mặt sau (500k)',
            '2_mat':       '2 Mặt — Trước và Sau (1tr1)',
        };

        // --- Label deadline ---
        const deadlineMap = {
            'under_1_month': 'Dưới 1 tháng (+200k phụ phí)',
            'under_1_week':  'Dưới 1 tuần (+400k phụ phí)',
            'normal':        'Theo deadline thường (1–3 tháng)',
            'specific_date': `Ngày cụ thể: **${v(p.specific_deadline_date)}**`,
        };

        // --- Label detail ---
        const detailMap = {
            '0k':   '0k — Giá gốc là được nhen cô chủ',
            '100k': '100k — Thêm nhiều chút thui cô chủ ạ',
            '200k': '200k — Thêm cái này, cái kia, cái kìa cho khách nựaa',
            '300k': '300k — Múa thoải mái, tiền khách lo',
            '400k': '400k — Giới hạn của cô chủ, không phải túi tiền của khách',
        };

        // --- Cách điền brief ---
        const fillLabel = p.fill_method === 'skip_to_3'
            ? '📎 Có sẵn link/ảnh → xem Câu 3'
            : '✏️ Điền trực tiếp (xem bên dưới)';

        // --- Câu 7 update ---
        const updateLabel = p.update_agree === 'okila'
            ? 'Khách đã Okila với TOS của cô chủ ᓚ₍⑅^..^₎♡'
            : `Có TOS riêng — khách sẽ nhắn riêng với cô chủ`;

        // --- Câu 10 nhận tranh ---
        const sendLabel = p.send_method === 'gmail'
            ? `Gmail: **${v(p.customer_gmail)}**`
            : 'Drive (cô chủ sẽ xóa sau 1 tháng)';

        // Xây dựng fields
        const fields = [
            {
                name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                value: "** **",
                inline: false
            },
            {
                name: "📱 Câu 1 — Link MXH",
                value: v(p.mxh_link),
                inline: false
            },
            {
                name: "🎨 Loại comm",
                value: commMap[p.comm_type] || v(p.comm_type),
                inline: false
            },

            // --- Câu 2: cách điền brief ---
            {
                name: "📋 Câu 2 — Cách điền brief",
                value: fillLabel,
                inline: false
            },
        ];

        // Nếu khách điền trực tiếp → hiện chi tiết brief
        if (p.fill_method !== 'skip_to_3') {
            fields.push(
                {
                    name: "👗 Phong cách thiết kế",
                    value: v(p.design_style),
                    inline: false
                },
                {
                    name: "🎨 Tone màu chủ đạo",
                    value: v(p.color_tone),
                    inline: false
                },
                {
                    name: "⭐ Signature của nhân vật",
                    value: v(p.char_signature),
                    inline: true
                },
                {
                    name: "💬 Chi tiết lặt vặt / vibe nhân vật",
                    value: v(p.other_details),
                    inline: false
                }
            );
        }

        // Câu 3: link drive (hiện khi khách skip hoặc có điền)
        if (p.fill_method === 'skip_to_3' || (p.drive_brief_link && p.drive_brief_link !== '(Không điền)')) {
            fields.push({
                name: "🔗 Câu 3 — Link Drive/Docs brief",
                value: v(p.drive_brief_link),
                inline: false
            });
        }

        // Câu 4–8
        fields.push(
            {
                name: "✨ Câu 4 — Độ detail",
                value: detailMap[p.detail_level] || v(p.detail_level),
                inline: false
            },
            {
                name: "⏰ Câu 5 — Deadline",
                value: deadlineMap[p.deadline_opt] || v(p.deadline_opt),
                inline: true
            },
            {
                name: "🔒 Câu 6 — Private",
                value: p.private_opt === 'private'
                    ? 'Có private (+15% tổng đơn)'
                    : 'Không cần private',
                inline: true
            },
            {
                name: "🔔 Câu 7 — Đồng ý lịch update",
                value: updateLabel,
                inline: false
            },
            {
                name: "✅ Câu 8 — Đồng ý TOS",
                value: p.tos_agree ? 'Đã đọc và chỉ có đồng ý ✅' : 'Chưa đồng ý ❌',
                inline: true
            },
            {
                name: "📦 Câu 10 — Phương thức nhận tranh",
                value: sendLabel,
                inline: true
            }
        );

        // P/s góp ý (chỉ hiện nếu có nội dung)
        if (p.feedback && p.feedback !== '(Không điền)' && p.feedback.trim() !== '') {
            fields.push({
                name: "💭 P/s 1 — Góp ý form",
                value: v(p.feedback),
                inline: false
            });
        }

        // P/s 2
        if (p.direct_message === 'agree') {
            fields.push({
                name: "💌 P/s 2 — Nhắn trực tiếp",
                value: 'Khách sẽ nhắn trực tiếp cho cô chủ nhen!',
                inline: false
            });
        }

        const embed = {
            title: "🍒 Cô chủ có đơn cơm mới!",
            color: 0xFF8DA1,
            fields: fields,
            footer: { text: `🕐 Nộp lúc: ${p.submitted_at}` },
        };

        // Gửi embed text
        const embedRes = await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
body: JSON.stringify({
    content: "<@680804392340946950> quack quack quack quack!!! 𓅭  𓅰  𓅭  𓅰\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    embeds: [embed]
})
        });
        if (!embedRes.ok) throw new Error("Discord embed lỗi: " + await embedRes.text());

        // Gửi từng nhóm file
        const fileGroups = [
            { label: "🖼️ Ảnh nhân vật / OC",    files: files.char_image     },
            { label: "👗 Ref trang phục",         files: files.outfit_ref     },
            { label: "🎨 Bảng màu",               files: files.palette_image  },
            { label: "💳 Bill chuyển khoản",      files: files.transfer_proof },
        ];

        for (const group of fileGroups) {
            const fileList = Array.from(group.files || []).filter(f => f && f.size > 0);
            if (fileList.length === 0) continue;

            const fd = new FormData();
            fd.append("payload_json", JSON.stringify({
                content: `**${group.label}** (${fileList.length} file)`
            }));
            fileList.forEach((file, i) => {
                fd.append(`files[${i}]`, file, file.name);
            });

            const fileRes = await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                body: fd
            });
            if (!fileRes.ok) {
                console.warn(`Gửi "${group.label}" lỗi:`, await fileRes.text());
            }

            await new Promise(r => setTimeout(r, 600));
        }
    }

    // ============================================================
    // 9. Submit Form
    // ============================================================
    const allRequiredGroups = document.querySelectorAll('.form-group.required');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate toàn bộ
        let formValid = true;
        let firstError = null;
        allRequiredGroups.forEach(group => {
            if (!validateGroup(group)) {
                formValid = false;
                if (!firstError) firstError = group;
            }
        });
        if (!formValid) {
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Gom dữ liệu text (bỏ qua File object)
        const formData = new FormData(form);
        const params   = {};
        for (const [key, value] of formData.entries()) {
            if (!(value instanceof File)) {
                params[key] = value || '(Không điền)';
            }
        }
        params['submitted_at'] = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        // Gom file riêng theo từng input name
        const files = {
            char_image:     document.querySelector('input[name="char_image"]')?.files     || [],
            outfit_ref:     document.querySelector('input[name="outfit_ref"]')?.files     || [],
            palette_image:  document.querySelector('input[name="palette_image"]')?.files  || [],
            transfer_proof: document.querySelector('input[name="transfer_proof"]')?.files || [],
        };

        // Disable nút để tránh bấm 2 lần
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi... ₍ᐢ. .ᐢ₎ ₊˚⊹♡';

        try {
            await sendDiscord(params, files);

            localStorage.removeItem(STORAGE_KEY);

            const successScreen = document.getElementById('success-screen');
            successScreen.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error("Lỗi gửi Discord:", err);
            alert("Ôi, có lỗi xảy ra khi gửi form \nBồ thử lại hoặc nhắn trực tiếp cho tui nhen!˙𐃷˙");
            submitBtn.disabled = false;
            submitBtn.textContent = '𓅭 𓅰  NỘP CƠM Ở ĐÂY  𓅭 𓅰';
        }
    });

});