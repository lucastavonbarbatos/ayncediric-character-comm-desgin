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

    const detailedRequiredInputs = detailedQuestions
        ? detailedQuestions.querySelectorAll('input[required], textarea[required]')
        : [];

    function toggleBriefSections() {
        if (methodDetailed && methodDetailed.checked) {
            detailedQuestions.classList.remove('hidden');
            detailedRequiredInputs.forEach(inp => inp.setAttribute('required', ''));
            driveLinkSection.classList.add('hidden');
            const driveInput = driveLinkSection.querySelector('input');
            if (driveInput) driveInput.removeAttribute('required');
        } else if (methodSkip && methodSkip.checked) {
            detailedQuestions.classList.add('hidden');
            detailedRequiredInputs.forEach(inp => inp.removeAttribute('required'));
            driveLinkSection.classList.remove('hidden');
            const driveInput = driveLinkSection.querySelector('input');
            if (driveInput) driveInput.setAttribute('required', '');
        }
    }
    methodDetailed?.addEventListener('change', toggleBriefSections);
    methodSkip?.addEventListener('change', toggleBriefSections);

    // Đảm bảo trạng thái ban đầu
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
            updatePrice();
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
    // 8. TÍNH GIÁ TỰ ĐỘNG
    // ============================================================
    const BASE_PRICE = {
        '1_mat_truoc': 600000,
        '1_mat_sau':   500000,
        '2_mat':       1100000,
    };
    const DETAIL_PRICE = {
        '0k': 0, '100k': 100000, '200k': 200000,
        '300k': 300000, '400k': 400000,
    };

    function formatVND(amount) {
        return amount.toLocaleString('vi-VN');
    }

    function createPriceBox() {
        const existing = document.getElementById('price-summary');
        if (existing) return existing;

        const box = document.createElement('div');
        box.id = 'price-summary';
        box.innerHTML = `
            <div class="price-title">🧾 Tổng tiền tạm tính</div>
            <div class="price-rows" id="price-rows"></div>
            <div class="price-total-row">
                <span>Tổng cần chuyển khoản:</span>
                <span id="price-total">—</span>
            </div>
            <div class="price-note">* Đây là giá tạm tính. Tui sẽ xác nhận lại tổng cuối cùng sau khi nhận brief nhen!</div>
        `;

// Chèn vào SAU .qr-section (phần bill CK),
        // tức là trước phần info-only-group thứ 2 (P/s 1)
        const qrSection = document.querySelector('.qr-section');
        if (qrSection) {
            qrSection.insertAdjacentElement('afterend', box);
        } else {
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.parentNode.insertBefore(box, submitBtn);
        }
        return box;
    }

    function updatePrice() {
        const commType     = document.querySelector('input[name="comm_type"]:checked')?.value;
        const detailLevel  = document.querySelector('input[name="detail_level"]:checked')?.value;
        const deadlineOpt  = document.querySelector('input[name="deadline_opt"]:checked')?.value;
        const privateOpt   = document.querySelector('input[name="private_opt"]:checked')?.value;
        const specificDate = document.querySelector('input[name="specific_deadline_date"]')?.value;

        // Chưa chọn comm type → ẩn box
        const existingBox = document.getElementById('price-summary');
        if (!commType) {
            if (existingBox) existingBox.style.display = 'none';
            return;
        }

        createPriceBox();
        document.getElementById('price-summary').style.display = 'block';

        const rows = [];
        let total = 0;

        // 1. Giá comm gốc
        const basePrice = BASE_PRICE[commType] || 0;
        total += basePrice;
        const commLabel = {
            '1_mat_truoc': '1 Mặt trước',
            '1_mat_sau':   '1 Mặt sau',
            '2_mat':       '2 Mặt (trước + sau)',
        }[commType];
        rows.push({ label: `Giá comm (${commLabel})`, value: basePrice });

        // 2. Phụ phí detail
        if (detailLevel && detailLevel !== '0k') {
            const detailFee = DETAIL_PRICE[detailLevel] || 0;
            const detailTotal = commType === '2_mat' ? detailFee * 2 : detailFee;
            if (detailTotal > 0) {
                total += detailTotal;
                const label = commType === '2_mat'
                    ? `Phụ phí detail ${detailLevel} × 2 mặt`
                    : `Phụ phí detail ${detailLevel}`;
                rows.push({ label, value: detailTotal });
            }
        }

        // 3. Phụ phí deadline
        let deadlineFee = 0;
        let deadlineLabel = '';

        if (deadlineOpt === 'under_1_week') {
            deadlineFee = 400000;
            deadlineLabel = 'Phụ phí deadline dưới 1 tuần';
        } else if (deadlineOpt === 'under_1_month') {
            deadlineFee = 200000;
            deadlineLabel = 'Phụ phí deadline dưới 1 tháng';
        } else if (deadlineOpt === 'specific_date' && specificDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(specificDate);
            target.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                deadlineFee = 400000;
                deadlineLabel = `Phụ phí deadline (ngày đã qua hoặc hôm nay)`;
            } else if (diffDays <= 7) {
                deadlineFee = 400000;
                deadlineLabel = `Phụ phí deadline dưới 1 tuần (còn ${diffDays} ngày)`;
            } else if (diffDays <= 30) {
                deadlineFee = 200000;
                deadlineLabel = `Phụ phí deadline dưới 1 tháng (còn ${diffDays} ngày)`;
            } else {
                deadlineLabel = `Deadline thường (còn ${diffDays} ngày)`;
            }
        }

        if (deadlineFee > 0) {
            total += deadlineFee;
            rows.push({ label: deadlineLabel, value: deadlineFee });
        } else if (deadlineLabel) {
            rows.push({ label: deadlineLabel, value: 0, isFree: true });
        }

        // 4. Phụ phí private (15%)
        if (privateOpt === 'private') {
            const privateFee = Math.round(total * 0.15);
            total += privateFee;
            rows.push({ label: 'Phí private (15% tổng đơn)', value: privateFee });
        }

        // Render rows
        const rowsEl = document.getElementById('price-rows');
        rowsEl.innerHTML = rows.map(r => `
            <div class="price-row">
                <span class="price-row-label">${r.label}</span>
                <span class="price-row-value ${r.isFree ? 'price-free' : ''}">
                    ${r.isFree ? 'Miễn phí' : '+' + formatVND(r.value)}
                </span>
            </div>
        `).join('');

        document.getElementById('price-total').textContent = formatVND(total) + ' VNĐ';
    }

    // Lắng nghe thay đổi để cập nhật giá
    ['comm_type', 'detail_level', 'deadline_opt', 'private_opt'].forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
            input.addEventListener('change', updatePrice);
        });
    });
    document.querySelector('input[name="specific_deadline_date"]')
        ?.addEventListener('change', updatePrice);
    document.querySelector('input[name="specific_deadline_date"]')
        ?.addEventListener('input', updatePrice);

    // Chạy lần đầu
    updatePrice();

    // ============================================================
    // 9. Gửi Discord
    // ============================================================
    function calculateTotal(p) {
        const BASE = { '1_mat_truoc': 600000, '1_mat_sau': 500000, '2_mat': 1100000 };
        const DETAIL = { '0k': 0, '100k': 100000, '200k': 200000, '300k': 300000, '400k': 400000 };
        const fmt = (n) => n.toLocaleString('vi-VN') + ' ₫';

        let lines = [];
        let total = 0;

        const base = BASE[p.comm_type] || 0;
        total += base;
        const commLabel = { '1_mat_truoc': '1 Mặt trước', '1_mat_sau': '1 Mặt sau', '2_mat': '2 Mặt' }[p.comm_type] || p.comm_type;
        lines.push(`Giá comm (${commLabel}): **${fmt(base)}**`);

        const detailFee = DETAIL[p.detail_level] || 0;
        if (detailFee > 0) {
            const detailTotal = p.comm_type === '2_mat' ? detailFee * 2 : detailFee;
            total += detailTotal;
            const suffix = p.comm_type === '2_mat' ? ` × 2 mặt` : '';
            lines.push(`Phụ phí detail (${p.detail_level}${suffix}): **+${fmt(detailTotal)}**`);
        }

        let deadlineFee = 0;
        if (p.deadline_opt === 'under_1_week') {
            deadlineFee = 400000;
            lines.push(`Phụ phí deadline (dưới 1 tuần): **+${fmt(deadlineFee)}**`);
        } else if (p.deadline_opt === 'under_1_month') {
            deadlineFee = 200000;
            lines.push(`Phụ phí deadline (dưới 1 tháng): **+${fmt(deadlineFee)}**`);
        } else if (p.deadline_opt === 'specific_date' && p.specific_deadline_date) {
            const today = new Date(); today.setHours(0,0,0,0);
            const target = new Date(p.specific_deadline_date); target.setHours(0,0,0,0);
            const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                deadlineFee = 400000;
                lines.push(`Phụ phí deadline (còn ${diffDays} ngày, dưới 1 tuần): **+${fmt(deadlineFee)}**`);
            } else if (diffDays <= 30) {
                deadlineFee = 200000;
                lines.push(`Phụ phí deadline (còn ${diffDays} ngày, dưới 1 tháng): **+${fmt(deadlineFee)}**`);
            } else {
                lines.push(`Deadline thường (còn ${diffDays} ngày): **+0 ₫**`);
            }
        }
        total += deadlineFee;

        if (p.private_opt === 'private') {
            const privateFee = Math.round(total * 0.15);
            total += privateFee;
            lines.push(`Phí private (15%): **+${fmt(privateFee)}**`);
        }

        lines.push(`━━━━━━━━━━━━━━━`);
        lines.push(`**TỔNG: ${fmt(total)}**`);
        return lines.join('\n');
    }

    async function sendDiscord(p, files) {
        const v = (val) => (val && val.trim && val.trim() !== '' && val !== '(Không điền)') ? val : '*(không điền)*';

        const commMap = {
            '1_mat_truoc': '1 Mặt — Mặt trước (600k)',
            '1_mat_sau':   '1 Mặt — Mặt sau (500k)',
            '2_mat':       '2 Mặt — Trước và Sau (1tr1)',
        };
        const deadlineMap = {
            'under_1_month': 'Dưới 1 tháng (+200k phụ phí)',
            'under_1_week':  'Dưới 1 tuần (+400k phụ phí)',
            'normal':        'Theo deadline thường (1–3 tháng)',
            'specific_date': `Ngày cụ thể: ${v(p.specific_deadline_date)}`,
        };
        const detailMap = {
            '0k':   '0k — Giá gốc là được nhen',
            '100k': '100k — Thêm nhiều chút thui',
            '200k': '200k — Thêm cái này, cái kia, cái kìa',
            '300k': '300k — Múa thoải mái, tiền khách lo',
            '400k': '400k — Giới hạn của cô chủ, không phải túi tiền của khách',
        };

        const fillLabel = p.fill_method === 'skip_to_3'
            ? '📎 Có sẵn link/ảnh → xem Câu 3'
            : '✏️ Điền trực tiếp (xem bên dưới)';

        const updateLabel = p.update_agree === 'okila'
            ? 'Okila với TOS của cô chủ ᓚ₍⑅^..^₎♡'
            : 'Có TOS riêng — khách sẽ nhắn riêng';

        const sendLabel = p.send_method === 'gmail'
            ? `Gmail: **${v(p.customer_gmail)}**`
            : 'Drive (cô chủ sẽ xóa sau 1 tháng)';

        const fields = [
            { name: "💰 Tổng tiền tạm tính", value: calculateTotal(p), inline: false },
            { name: "🏷️ Tên khách",          value: v(p.customer_name), inline: true  },
            { name: "📱 Link MXH",            value: v(p.mxh_link),      inline: false },
            { name: "🎨 Loại comm",           value: commMap[p.comm_type] || v(p.comm_type), inline: false },
            { name: "📋 Câu 2 — Cách điền brief", value: fillLabel,      inline: false },
        ];

        if (p.fill_method !== 'skip_to_3') {
            fields.push(
                { name: "👗 Phong cách thiết kế",        value: v(p.design_style),    inline: false },
                { name: "🎨 Tone màu chủ đạo",           value: v(p.color_tone),      inline: false },
                { name: "⭐ Signature nhân vật",          value: v(p.char_signature),  inline: true  },
                { name: "💬 Chi tiết khác / vibe nhân vật", value: v(p.other_details), inline: false }
            );
        }

        if (p.fill_method === 'skip_to_3' || (p.drive_brief_link && p.drive_brief_link !== '(Không điền)')) {
            fields.push({ name: "🔗 Câu 3 — Link Drive/Docs brief", value: v(p.drive_brief_link), inline: false });
        }

        fields.push(
            { name: "✨ Câu 4 — Độ detail",   value: detailMap[p.detail_level] || v(p.detail_level), inline: false },
            { name: "⏰ Câu 5 — Deadline",    value: deadlineMap[p.deadline_opt] || v(p.deadline_opt), inline: true },
            { name: "🔒 Câu 6 — Private",     value: p.private_opt === 'private' ? 'Có private (+15% tổng đơn)' : 'Không cần private', inline: true },
            { name: "🔔 Câu 7 — Update",      value: updateLabel, inline: false },
            { name: "✅ Câu 8 — TOS",         value: p.tos_agree ? 'Đã đọc và đồng ý ✅' : 'Chưa đồng ý ❌', inline: true },
            { name: "📦 Câu 10 — Nhận tranh", value: sendLabel, inline: true }
        );

        if (p.feedback && p.feedback !== '(Không điền)' && p.feedback.trim() !== '') {
            fields.push({ name: "💭 P/s 1 — Góp ý form", value: v(p.feedback), inline: false });
        }
        if (p.direct_message === 'agree') {
            fields.push({ name: "💌 P/s 2", value: 'Khách sẽ nhắn trực tiếp!', inline: false });
        }

        const embed = {
            title: "🍒 Cô chủ có đơn cơm mới!",
            color: 0xFF8DA1,
            fields,
            footer: { text: `🕐 Nộp lúc: ${p.submitted_at}` },
        };

        // Gửi embed text
        const embedRes = await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: "<@680804392340946950> quack quack quack!!! 𓅭 𓅰 𓅭 𓅰\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                embeds: [embed]
            })
        });
        if (!embedRes.ok) throw new Error("Discord embed lỗi: " + await embedRes.text());

        // Gửi file đính kèm theo nhóm
        const fileGroups = [
            { label: "🖼️ Ảnh nhân vật / OC",  files: files.char_image     },
            { label: "👗 Ref trang phục",       files: files.outfit_ref     },
            { label: "🎨 Bảng màu",             files: files.palette_image  },
            { label: "💳 Bill chuyển khoản",    files: files.transfer_proof },
        ];

        for (const group of fileGroups) {
            const fileList = Array.from(group.files || []).filter(f => f && f.size > 0);
            if (fileList.length === 0) continue;

            const fd = new FormData();
            fd.append("payload_json", JSON.stringify({
                content: `**${group.label}** (${fileList.length} file)`
            }));
            fileList.forEach((file, i) => fd.append(`files[${i}]`, file, file.name));

            const fileRes = await fetch(DISCORD_WEBHOOK, { method: "POST", body: fd });
            if (!fileRes.ok) console.warn(`Gửi "${group.label}" lỗi:`, await fileRes.text());

            await new Promise(r => setTimeout(r, 600));
        }
    }

    // ============================================================
    // 10. Submit Form
    // ============================================================
    const allRequiredGroups = document.querySelectorAll('.form-group.required');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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

        const formData = new FormData(form);
        const params   = {};
        for (const [key, value] of formData.entries()) {
            if (!(value instanceof File)) params[key] = value || '(Không điền)';
        }
        params['submitted_at'] = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        const files = {
            char_image:     document.querySelector('input[name="char_image"]')?.files     || [],
            outfit_ref:     document.querySelector('input[name="outfit_ref"]')?.files     || [],
            palette_image:  document.querySelector('input[name="palette_image"]')?.files  || [],
            transfer_proof: document.querySelector('input[name="transfer_proof"]')?.files || [],
        };

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
            alert("Ôi, có lỗi xảy ra khi gửi form 😢\nBồ thử lại hoặc nhắn trực tiếp cho tui nhen! ˙𐃷˙");
            submitBtn.disabled = false;
            submitBtn.textContent = '𓅭 𓅰  NỘP CƠM Ở ĐÂY  𓅭 𓅰';
        }
    });

});