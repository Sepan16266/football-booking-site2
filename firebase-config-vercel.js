// إعدادات Firebase لـ Vercel - تعمل في بيئة الإنتاج
// هذا الملف يحتوي على الإعدادات الصحيحة للموقع المنشور

// إعدادات Firebase الصحيحة
const firebaseConfig = {
    apiKey: "AIzaSyDXsCN1JGyYGXk5FnzQPGKcL2JKBggi1v4",
    authDomain: "mala3b-67fca.firebaseapp.com",
    projectId: "mala3b-67fca",
    storageBucket: "mala3b-67fca.firebasestorage.app",
    messagingSenderId: "491005385668",
    appId: "1:491005385668:web:af8522302749092621a291"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تهيئة Firestore
const db = firebase.firestore();

// مرجع مجموعة الحجوزات في Firestore
const bookingsCollection = db.collection('bookings');

// إعدادات CallMeBot
const CALLMEBOT_CONFIG = {
    phoneNumber: '9647508275402',
    apiKey: '1002501'
};

// دالة إرسال رسالة WhatsApp للإدارة
async function sendWhatsAppMessage(bookingData) {
    console.log('📱 محاولة إرسال رسالة WhatsApp...');
    console.log('📋 إعدادات CallMeBot:', {
        phone: CALLMEBOT_CONFIG.phoneNumber,
        apiKey: CALLMEBOT_CONFIG.apiKey ? 'موجود' : 'مفقود'
    });

    if (!CALLMEBOT_CONFIG.phoneNumber || !CALLMEBOT_CONFIG.apiKey) {
        console.log('⚠️ إعدادات CallMeBot غير مكتملة');
        return false;
    }

    try {
        const message = `🔔 حجز جديد!

👤 الاسم: ${bookingData.fullName}
📱 الهاتف: ${bookingData.phoneNumber}
📅 التاريخ: ${bookingData.bookingDate}
⏰ الوقت: ${bookingData.bookingTime}
🏟️ الملعب: ${bookingData.fieldName || 'الملعب الرئيسي'}

تم الحجز بنجاح! ✅`;

        console.log('📝 نص الرسالة:', message);

        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_CONFIG.phoneNumber}&text=${encodedMessage}&apikey=${CALLMEBOT_CONFIG.apiKey}`;

        console.log('🌐 رابط الإرسال:', url);

        // استخدام no-cors لتجاوز مشاكل CORS
        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors'
        });

        console.log('📡 تم إرسال الطلب إلى CallMeBot');
        console.log('✅ تم إرسال رسالة WhatsApp (تحقق من الهاتف)');
        return true;

    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة WhatsApp:', error);
        return false;
    }
}

// دالة إرسال رسالة للعميل
async function sendCustomerWhatsApp(customerPhone, bookingData) {
    if (!CALLMEBOT_CONFIG.apiKey) {
        console.log('⚠️ إعدادات CallMeBot غير مكتملة');
        return false;
    }

    try {
        const message = `🎉 تم تأكيد حجزك!\n\n` +
                       `👤 مرحباً ${bookingData.fullName}\n` +
                       `📅 التاريخ: ${bookingData.bookingDate}\n` +
                       `⏰ الوقت: ${bookingData.bookingTime}\n` +
                       `🏟️ الملعب: ${bookingData.fieldName}\n\n` +
                       `شكراً لاختيارك ملاعبنا! ⚽`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = customerPhone.replace(/\D/g, '');
        const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_CONFIG.apiKey}`;

        const response = await fetch(url);
        
        if (response.ok) {
            console.log('✅ تم إرسال رسالة تأكيد للعميل');
            return true;
        } else {
            console.error('❌ فشل في إرسال رسالة للعميل:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة للعميل:', error);
        return false;
    }
}

// دالة لعرض رسائل التنبيه
function showToast(message, type = 'info') {
    const toastElement = document.getElementById('alertToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastElement || !toastMessage) {
        alert(message);
        return;
    }
    
    // تحديد لون التنبيه حسب النوع
    const toastHeader = toastElement.querySelector('.toast-header');
    toastHeader.className = 'toast-header';
    
    switch(type) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning', 'text-dark');
            break;
        default:
            toastHeader.classList.add('bg-info', 'text-white');
    }
    
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// دالة لعرض/إخفاء مؤشر التحميل
function toggleLoading(show = true) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        if (show) {
            loadingSpinner.classList.remove('d-none');
        } else {
            loadingSpinner.classList.add('d-none');
        }
    }
}

// دالة للتحقق من صحة البيانات
function validateBookingData(data) {
    const errors = [];

    // التحقق من الاسم
    if (!data.fullName || data.fullName.trim().length < 2) {
        errors.push('يجب أن يكون الاسم الكامل أكثر من حرفين');
    }

    // التحقق من رقم الهاتف
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!data.phoneNumber || !phoneRegex.test(data.phoneNumber.replace(/\s/g, ''))) {
        errors.push('رقم الهاتف غير صحيح (يجب أن يكون من 10-15 رقم)');
    }

    // التحقق من التاريخ
    const bookingDate = new Date(data.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
        errors.push('لا يمكن الحجز في تاريخ سابق');
    }

    // التحقق من الوقت
    if (!data.bookingTime) {
        errors.push('يجب اختيار وقت الحجز');
    }

    return errors;
}

// دالة لتنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// دالة لتنسيق الوقت
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
}

// دالة لتنسيق تاريخ الإنشاء
function formatCreatedAt(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// دالة للحصول على إحصائيات الحجوزات
async function getBookingStats() {
    try {
        const snapshot = await bookingsCollection.get();
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            return bookingDate.getTime() === today.getTime();
        });
        
        const upcomingBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            return bookingDate > today;
        });
        
        return {
            total: bookings.length,
            today: todayBookings.length,
            upcoming: upcomingBookings.length
        };
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return {
            total: 0,
            today: 0,
            upcoming: 0
        };
    }
}

console.log('🔥 Firebase تم تهيئته بنجاح - Vercel Edition!');
console.log('📱 CallMeBot جاهز لإرسال الرسائل');
console.log('💾 Firestore متصل وجاهز لحفظ الحجوزات');

// التأكد من تحميل دوال WhatsApp
console.log('🔍 فحص دوال WhatsApp:');
console.log('- sendWhatsAppMessage:', typeof sendWhatsAppMessage);
console.log('- sendCustomerWhatsApp:', typeof sendCustomerWhatsApp);
console.log('- CALLMEBOT_CONFIG:', CALLMEBOT_CONFIG);

// إضافة الدوال للنطاق العام للتأكد من الوصول إليها
window.sendWhatsAppMessage = sendWhatsAppMessage;
window.sendCustomerWhatsApp = sendCustomerWhatsApp;
window.CALLMEBOT_CONFIG = CALLMEBOT_CONFIG;
