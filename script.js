// ملف JavaScript الرئيسي لموقع حجز الملاعب الخماسية

// الأوقات المتاحة (من 3 العصر حتى 2 بالليل)
const availableTimes = [
    { value: '15:00', label: '3:00 عصراً' },
    { value: '16:00', label: '4:00 عصراً' },
    { value: '17:00', label: '5:00 عصراً' },
    { value: '18:00', label: '6:00 مساءً' },
    { value: '19:00', label: '7:00 مساءً' },
    { value: '20:00', label: '8:00 مساءً' },
    { value: '21:00', label: '9:00 مساءً' },
    { value: '22:00', label: '10:00 مساءً' },
    { value: '23:00', label: '11:00 مساءً' },
    { value: '00:00', label: '12:00 منتصف الليل' },
    { value: '01:00', label: '1:00 صباحاً' },
    { value: '02:00', label: '2:00 صباحاً' }
];

// أيام الأسبوع
const weekDays = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

// متغيرات عامة
let currentBookings = [];
let filteredBookings = [];

// دالة تهيئة الصفحة حسب نوعها
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();

    switch(currentPage) {
        case 'index.html':
        case '':
            initHomePage();
            break;
        case 'times.html':
            initTimesPage();
            break;
        case 'booking.html':
            initBookingPage();
            break;
        case 'admin.html':
            initAdminPage();
            break;
    }
});

// تهيئة الصفحة الرئيسية
function initHomePage() {
    displayDays();
}

// عرض الأيام في الصفحة الرئيسية
function displayDays() {
    const daysContainer = document.getElementById('daysContainer');
    if (!daysContainer) return;

    daysContainer.innerHTML = '';

    // إنشاء الأيام للأسبوع القادم
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayCard = createDayCard(date, i === 0);
        daysContainer.appendChild(dayCard);
    }
}

// إنشاء بطاقة يوم محسنة للسرعة الخارقة
function createDayCard(date, isToday) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-2 col-md-3 col-sm-4 col-6 mb-4 lightning-fast';

    const dayName = weekDays[date.getDay()];
    const dayNumber = date.getDate();
    const monthName = date.toLocaleDateString('ar-SA', { month: 'long' });
    const dateString = date.toISOString().split('T')[0];

    const todayClass = isToday ? 'border-warning' : '';
    const todayBadge = isToday ? '<span class="badge bg-warning text-dark mb-2">اليوم</span>' : '';

    colDiv.innerHTML = `
        <div class="card-revolutionary day-card-square fade-in-up hover-glow hover-scale instant-response ${todayClass}" style="cursor: pointer;" onclick="selectDay('${dateString}', '${dayName} ${dayNumber} ${monthName}')">
            <div class="text-center d-flex flex-column justify-content-center h-100 p-3">
                ${todayBadge ? '<span class="badge bg-warning text-dark mb-1" style="font-size: 10px; padding: 2px 6px;">اليوم</span>' : ''}
                <i class="fas fa-calendar-day text-neon-blue fs-2 mb-2 float-animation"></i>
                <h5 class="text-neon-purple text-glow day-name mb-1">${dayName}</h5>
                <h3 class="text-neon-green text-glow day-number mb-1 fw-bold">${dayNumber}</h3>
                <small class="text-white">${monthName}</small>
            </div>
        </div>
    `;

    return colDiv;
}

// دالة اختيار اليوم
function selectDay(dateString, dayLabel) {
    // حفظ التاريخ المحدد في localStorage
    localStorage.setItem('selectedDate', dateString);
    localStorage.setItem('selectedDayLabel', dayLabel);
    // الانتقال لصفحة اختيار الوقت
    window.location.href = 'times.html';
}

// تهيئة صفحة اختيار الأوقات
function initTimesPage() {
    const selectedDate = localStorage.getItem('selectedDate');
    const selectedDayLabel = localStorage.getItem('selectedDayLabel');

    if (!selectedDate || !selectedDayLabel) {
        // إذا لم يتم اختيار يوم، العودة للصفحة الرئيسية
        window.location.href = 'index.html';
        return;
    }

    // عرض اليوم المحدد
    document.getElementById('selectedDay').textContent = selectedDayLabel;

    // عرض الأوقات المتاحة
    displayTimes(selectedDate);
}

// عرض الأوقات المتاحة
async function displayTimes(selectedDate) {
    const timesContainer = document.getElementById('timesContainer');
    if (!timesContainer) return;

    timesContainer.innerHTML = '';

    try {
        toggleLoading(true);

        // جلب الحجوزات الموجودة لهذا التاريخ
        const bookedTimes = await getBookedTimes(selectedDate);

        // إنشاء بطاقات الأوقات
        availableTimes.forEach(time => {
            const isBooked = bookedTimes.includes(time.value);
            const timeCard = createTimeCard(time, isBooked, selectedDate);
            timesContainer.appendChild(timeCard);
        });

    } catch (error) {
        console.error('خطأ في تحميل الأوقات:', error);
        showToast('خطأ في تحميل الأوقات المتاحة', 'error');
    } finally {
        toggleLoading(false);
    }
}

// إنشاء بطاقة وقت محسنة للسرعة الخارقة
function createTimeCard(time, isBooked, selectedDate) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-3 col-md-4 col-sm-6 col-6 mb-4 lightning-fast';

    const cardClass = isBooked ? 'time-card-square-booked' : 'time-card-square-available';
    const clickHandler = isBooked ? '' : `onclick="selectTime('${time.value}', '${time.label}', '${selectedDate}')"`;
    const timeIcon = isBooked ? 'fas fa-ban' : 'fas fa-clock';
    const statusText = isBooked ? 'محجوز' : 'متاح';
    const statusIcon = isBooked ? '🚫' : '✅';

    colDiv.innerHTML = `
        <div class="card-revolutionary ${cardClass} hover-glow hover-scale instant-response time-slot ${isBooked ? 'booked' : 'available'}"
             style="cursor: ${isBooked ? 'not-allowed' : 'pointer'}; aspect-ratio: 1; min-height: 150px;"
             ${clickHandler}>
            <div class="text-center d-flex flex-column justify-content-center h-100 p-3">
                <i class="${timeIcon} fs-2 mb-2 float-animation" style="color: ${isBooked ? '#dc3545' : '#28a745'};"></i>
                <h5 class="mb-2 fw-bold" style="color: black !important; text-shadow: none;">${time.label}</h5>
                <small class="fw-bold" style="color: ${isBooked ? '#dc3545' : '#28a745'};">${statusIcon} ${statusText}</small>
            </div>
        </div>
    `;

    return colDiv;
}

// جلب الأوقات المحجوزة لتاريخ معين
async function getBookedTimes(date) {
    try {
        const query = bookingsCollection.where('bookingDate', '==', date);
        const snapshot = await query.get();

        const bookedTimes = [];
        snapshot.forEach(doc => {
            bookedTimes.push(doc.data().bookingTime);
        });

        return bookedTimes;
    } catch (error) {
        console.error('خطأ في جلب الأوقات المحجوزة:', error);
        return [];
    }
}

// دالة اختيار الوقت
function selectTime(timeValue, timeLabel, selectedDate) {
    // حفظ الوقت المحدد في localStorage
    localStorage.setItem('selectedTime', timeValue);
    localStorage.setItem('selectedTimeLabel', timeLabel);
    // الانتقال لصفحة إتمام الحجز
    window.location.href = 'booking.html';
}

// تهيئة صفحة الحجز
function initBookingPage() {
    const selectedDate = localStorage.getItem('selectedDate');
    const selectedDayLabel = localStorage.getItem('selectedDayLabel');
    const selectedTime = localStorage.getItem('selectedTime');
    const selectedTimeLabel = localStorage.getItem('selectedTimeLabel');

    if (!selectedDate || !selectedTime) {
        // إذا لم يتم اختيار التاريخ والوقت، العودة للصفحة الرئيسية
        window.location.href = 'index.html';
        return;
    }

    // عرض معلومات الحجز المحدد
    document.getElementById('selectedDate').textContent = selectedDayLabel;
    document.getElementById('selectedTime').textContent = selectedTimeLabel;

    // تعيين القيم المخفية
    document.getElementById('bookingDate').value = selectedDate;
    document.getElementById('bookingTime').value = selectedTime;

    // ربط نموذج الحجز
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
}

// معالجة إرسال نموذج الحجز
async function handleBookingSubmit(event) {
    event.preventDefault();

    // التحقق من تسجيل الدخول
    const savedUser = localStorage.getItem('ma3ab_current_user');
    if (!savedUser) {
        showToast('يجب تسجيل الدخول أولاً للحجز', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    const currentUser = JSON.parse(savedUser);

    // جمع بيانات النموذج
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        bookingDate: document.getElementById('bookingDate').value,
        bookingTime: document.getElementById('bookingTime').value,
        userId: currentUser.id,
        username: currentUser.username
    };

    // التحقق من صحة البيانات
    const validationErrors = validateBookingData(formData);
    if (validationErrors.length > 0) {
        showToast(validationErrors.join('\n'), 'error');
        return;
    }

    try {
        toggleLoading(true);

        // التحقق من توفر الموعد مرة أخرى
        const isAvailable = await checkAvailability(formData.bookingDate, formData.bookingTime);

        if (!isAvailable) {
            showToast('عذراً، هذا الموعد محجوز مسبقاً. يرجى اختيار موعد آخر.', 'warning');
            toggleLoading(false);
            // العودة لصفحة اختيار الوقت
            setTimeout(() => {
                window.location.href = 'times.html';
            }, 2000);
            return;
        }

        // حفظ الحجز
        await saveBooking(formData);

        showToast('تم تأكيد حجزك بنجاح! شكراً لك.', 'success');

        // إرسال رسالة WhatsApp (في الخلفية)
        try {
            // إرسال رسالة للمدير
            const adminMessageSent = await sendWhatsAppMessage(formData);

            // إرسال رسالة للعميل (اختياري)
            const customerMessageSent = await sendCustomerWhatsApp(formData.phoneNumber, formData);

            if (adminMessageSent || customerMessageSent) {
                console.log('✅ تم إرسال رسائل WhatsApp');
            }
        } catch (error) {
            console.error('⚠️ خطأ في إرسال رسائل WhatsApp:', error);
            // لا نوقف العملية حتى لو فشل إرسال الرسالة
        }

        // مسح البيانات المحفوظة
        localStorage.removeItem('selectedDate');
        localStorage.removeItem('selectedDayLabel');
        localStorage.removeItem('selectedTime');
        localStorage.removeItem('selectedTimeLabel');

        // العودة للصفحة الرئيسية بعد 3 ثوان
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);

    } catch (error) {
        console.error('خطأ في الحجز:', error);
        showToast('حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        toggleLoading(false);
    }
}

// التحقق من توفر الموعد
async function checkAvailability(date, time) {
    try {
        const query = bookingsCollection
            .where('bookingDate', '==', date)
            .where('bookingTime', '==', time);

        const snapshot = await query.get();
        return snapshot.empty; // إذا كان فارغاً فالموعد متاح
    } catch (error) {
        console.error('خطأ في التحقق من التوفر:', error);
        throw error;
    }
}

// حفظ الحجز في Firebase
async function saveBooking(bookingData) {
    try {
        const docRef = await bookingsCollection.add({
            ...bookingData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'confirmed'
        });

        console.log('تم حفظ الحجز بمعرف:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('خطأ في حفظ الحجز:', error);
        throw error;
    }
}

// تهيئة صفحة الإدارة
function initAdminPage() {
    loadBookings();
    setupAdminEventListeners();
    updateStats();
}

// إعداد مستمعي الأحداث لصفحة الإدارة
function setupAdminEventListeners() {
    // البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterBookings);
    }

    // فلتر الوقت
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', filterBookings);
    }

    // فلتر التاريخ
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterBookings);
    }
}

// تحميل جميع الحجوزات
async function loadBookings() {
    try {
        toggleLoading(true);

        const snapshot = await bookingsCollection
            .orderBy('createdAt', 'desc')
            .get();

        currentBookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        filteredBookings = [...currentBookings];
        displayBookings();
        updateStats();

    } catch (error) {
        console.error('خطأ في تحميل الحجوزات:', error);
        showToast('خطأ في تحميل الحجوزات', 'error');
    } finally {
        toggleLoading(false);
    }
}

// عرض الحجوزات في الجدول
function displayBookings() {
    const tableBody = document.getElementById('bookingsTableBody');
    const noDataMessage = document.getElementById('noDataMessage');

    if (!tableBody) return;

    if (filteredBookings.length === 0) {
        tableBody.innerHTML = '';
        if (noDataMessage) {
            noDataMessage.classList.remove('d-none');
        }
        return;
    }

    if (noDataMessage) {
        noDataMessage.classList.add('d-none');
    }

    tableBody.innerHTML = '';

    filteredBookings.forEach((booking, index) => {
        const row = createBookingRow(booking, index + 1);
        tableBody.appendChild(row);
    });
}

// إنشاء صف في جدول الحجوزات
function createBookingRow(booking, index) {
    const row = document.createElement('tr');
    row.className = 'text-white';

    row.innerHTML = `
        <td class="text-center text-neon-blue fw-bold">${index}</td>
        <td class="text-center text-white fw-bold">${booking.fullName}</td>
        <td class="text-center text-neon-green fw-bold">${booking.phoneNumber}</td>
        <td class="text-center text-neon-purple fw-bold">${formatDate(booking.bookingDate)}</td>
        <td class="text-center text-neon-yellow fw-bold">${formatTime(booking.bookingTime)}</td>
        <td class="text-center text-white">${formatCreatedAt(booking.createdAt)}</td>
        <td class="text-center">
            <button class="btn-revolutionary btn-danger-rev btn-sm" onclick="deleteBooking('${booking.id}')">
                <i class="fas fa-trash me-1"></i>🗑️ حذف
            </button>
        </td>
    `;

    return row;
}

// فلترة الحجوزات
function filterBookings() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const timeFilter = document.getElementById('timeFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';

    filteredBookings = currentBookings.filter(booking => {
        const matchesSearch = booking.fullName.toLowerCase().includes(searchTerm) ||
                            booking.phoneNumber.includes(searchTerm);

        const matchesTime = !timeFilter || booking.bookingTime === timeFilter;

        const matchesDate = !dateFilter || booking.bookingDate === dateFilter;

        return matchesSearch && matchesTime && matchesDate;
    });

    displayBookings();
}

// حذف حجز
async function deleteBooking(bookingId) {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
        return;
    }

    try {
        toggleLoading(true);

        await bookingsCollection.doc(bookingId).delete();

        // إزالة الحجز من المصفوفة المحلية
        currentBookings = currentBookings.filter(booking => booking.id !== bookingId);
        filteredBookings = filteredBookings.filter(booking => booking.id !== bookingId);

        displayBookings();
        updateStats();

        showToast('تم حذف الحجز بنجاح', 'success');

    } catch (error) {
        console.error('خطأ في حذف الحجز:', error);
        showToast('خطأ في حذف الحجز', 'error');
    } finally {
        toggleLoading(false);
    }
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        const stats = await getBookingStats();

        const totalElement = document.getElementById('totalBookings');
        const todayElement = document.getElementById('todayBookings');
        const upcomingElement = document.getElementById('upcomingBookings');

        if (totalElement) totalElement.textContent = stats.total;
        if (todayElement) todayElement.textContent = stats.today;
        if (upcomingElement) upcomingElement.textContent = stats.upcoming;

    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}

// تحديث الحجوزات (دالة للزر)
function refreshBookings() {
    loadBookings();
}
