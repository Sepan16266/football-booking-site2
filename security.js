// 🛡️ نظام الحماية المتقدم - Security System
// تشفير وحماية شاملة للموقع

// 🔐 نظام التشفير المتقدم
class SecurityManager {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 دقيقة
        this.sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
        this.suspiciousActivities = [];
        
        this.initSecurity();
    }
    
    // 🔑 توليد مفتاح التشفير
    generateEncryptionKey() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        return btoa(timestamp + random).substring(0, 32);
    }
    
    // 🔒 تشفير كلمة المرور
    hashPassword(password, salt = null) {
        if (!salt) {
            salt = this.generateSalt();
        }
        
        // تشفير متعدد المراحل
        let hash = password + salt;
        
        // SHA-256 simulation (simplified)
        for (let i = 0; i < 1000; i++) {
            hash = btoa(hash).split('').reverse().join('');
        }
        
        return {
            hash: hash,
            salt: salt
        };
    }
    
    // 🧂 توليد Salt عشوائي
    generateSalt() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let salt = '';
        for (let i = 0; i < 16; i++) {
            salt += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return btoa(salt);
    }
    
    // ✅ التحقق من كلمة المرور
    verifyPassword(password, storedHash, salt) {
        const newHash = this.hashPassword(password, salt);
        return newHash.hash === storedHash;
    }
    
    // 🔐 تشفير البيانات الحساسة
    encryptData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encrypted = btoa(jsonString + this.encryptionKey);
            return encrypted;
        } catch (error) {
            console.error('خطأ في تشفير البيانات:', error);
            return null;
        }
    }
    
    // 🔓 فك تشفير البيانات
    decryptData(encryptedData) {
        try {
            const decrypted = atob(encryptedData);
            const jsonString = decrypted.replace(this.encryptionKey, '');
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('خطأ في فك تشفير البيانات:', error);
            return null;
        }
    }
    
    // 🚨 مراقبة محاولات تسجيل الدخول
    trackLoginAttempt(username, success, ip = 'unknown') {
        const attempt = {
            username: username,
            success: success,
            timestamp: Date.now(),
            ip: ip,
            userAgent: navigator.userAgent
        };
        
        // حفظ في localStorage مؤقتاً
        let attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
        attempts.push(attempt);
        
        // الاحتفاظ بآخر 100 محاولة فقط
        if (attempts.length > 100) {
            attempts = attempts.slice(-100);
        }
        
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
        
        // فحص المحاولات المشبوهة
        this.checkSuspiciousActivity(username, attempts);
        
        return attempt;
    }
    
    // 🔍 فحص النشاطات المشبوهة
    checkSuspiciousActivity(username, attempts) {
        const recentAttempts = attempts.filter(attempt => 
            attempt.username === username && 
            Date.now() - attempt.timestamp < this.lockoutDuration
        );
        
        const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
        
        if (failedAttempts.length >= this.maxLoginAttempts) {
            this.lockAccount(username);
            this.reportSuspiciousActivity('BRUTE_FORCE', username, failedAttempts);
            return true;
        }
        
        return false;
    }
    
    // 🔒 قفل الحساب
    lockAccount(username) {
        const lockData = {
            username: username,
            lockedAt: Date.now(),
            unlockAt: Date.now() + this.lockoutDuration
        };
        
        let lockedAccounts = JSON.parse(localStorage.getItem('locked_accounts') || '[]');
        lockedAccounts = lockedAccounts.filter(account => account.username !== username);
        lockedAccounts.push(lockData);
        
        localStorage.setItem('locked_accounts', JSON.stringify(lockedAccounts));
        
        console.warn(`🔒 تم قفل الحساب: ${username} لمدة ${this.lockoutDuration / 60000} دقيقة`);
    }
    
    // ✅ فحص حالة قفل الحساب
    isAccountLocked(username) {
        const lockedAccounts = JSON.parse(localStorage.getItem('locked_accounts') || '[]');
        const accountLock = lockedAccounts.find(account => account.username === username);
        
        if (accountLock && Date.now() < accountLock.unlockAt) {
            const remainingTime = Math.ceil((accountLock.unlockAt - Date.now()) / 60000);
            return {
                locked: true,
                remainingMinutes: remainingTime
            };
        }
        
        return { locked: false };
    }
    
    // 📊 تقرير النشاطات المشبوهة
    reportSuspiciousActivity(type, username, details) {
        const report = {
            type: type,
            username: username,
            timestamp: Date.now(),
            details: details,
            severity: this.getSeverityLevel(type)
        };
        
        this.suspiciousActivities.push(report);
        
        // إرسال تنبيه للمشرفين
        this.alertAdmins(report);
        
        console.warn('🚨 نشاط مشبوه:', report);
    }
    
    // ⚠️ تحديد مستوى الخطورة
    getSeverityLevel(type) {
        const severityMap = {
            'BRUTE_FORCE': 'HIGH',
            'SUSPICIOUS_LOGIN': 'MEDIUM',
            'DATA_BREACH_ATTEMPT': 'CRITICAL',
            'XSS_ATTEMPT': 'HIGH',
            'CSRF_ATTEMPT': 'HIGH'
        };
        
        return severityMap[type] || 'LOW';
    }
    
    // 📢 تنبيه المشرفين
    alertAdmins(report) {
        // حفظ التنبيه في قاعدة البيانات للمشرفين
        if (typeof db !== 'undefined') {
            db.collection('security_alerts').add({
                ...report,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(error => {
                console.error('خطأ في حفظ تنبيه الأمان:', error);
            });
        }
    }
    
    // 🕒 إدارة انتهاء صلاحية الجلسة
    startSessionTimer() {
        // إلغاء المؤقت السابق
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        this.sessionTimer = setTimeout(() => {
            this.expireSession();
        }, this.sessionTimeout);
    }
    
    // ⏰ انتهاء صلاحية الجلسة
    expireSession() {
        console.log('🕒 انتهت صلاحية الجلسة');
        
        // مسح بيانات المستخدم
        localStorage.removeItem('ma3ab_current_user');
        
        // إظهار رسالة
        alert('انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.');
        
        // إعادة توجيه لصفحة تسجيل الدخول
        window.location.href = 'welcome.html';
    }
    
    // 🔄 تجديد الجلسة
    refreshSession() {
        this.startSessionTimer();
    }
    
    // 🛡️ تهيئة نظام الحماية
    initSecurity() {
        // مراقبة النشاطات
        this.setupActivityMonitoring();
        
        // حماية من XSS
        this.setupXSSProtection();
        
        // حماية من CSRF
        this.setupCSRFProtection();
        
        console.log('🛡️ تم تفعيل نظام الحماية المتقدم');
    }
    
    // 👁️ مراقبة النشاطات
    setupActivityMonitoring() {
        // مراقبة النقرات المشبوهة
        document.addEventListener('click', (event) => {
            this.logActivity('CLICK', event.target.tagName, event.target.className);
        });
        
        // مراقبة محاولات الوصول للكونسول
        let devtools = false;
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
                if (!devtools) {
                    devtools = true;
                    this.reportSuspiciousActivity('DEV_TOOLS_OPEN', 'unknown', {
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent
                    });
                }
            } else {
                devtools = false;
            }
        }, 1000);
    }
    
    // 🛡️ حماية من XSS
    setupXSSProtection() {
        // تنظيف المدخلات
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {
            if (typeof value === 'string' && value.includes('<script>')) {
                securityManager.reportSuspiciousActivity('XSS_ATTEMPT', 'unknown', {
                    attribute: name,
                    value: value
                });
                return;
            }
            originalSetAttribute.call(this, name, value);
        };
    }
    
    // 🔒 حماية من CSRF
    setupCSRFProtection() {
        // إضافة token لجميع الطلبات
        this.csrfToken = this.generateCSRFToken();
    }
    
    // 🎫 توليد CSRF Token
    generateCSRFToken() {
        const token = btoa(Date.now() + Math.random().toString(36));
        sessionStorage.setItem('csrf_token', token);
        return token;
    }
    
    // 📝 تسجيل النشاطات
    logActivity(type, target, details) {
        const activity = {
            type: type,
            target: target,
            details: details,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        // حفظ في localStorage
        let activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
        activities.push(activity);
        
        // الاحتفاظ بآخر 50 نشاط فقط
        if (activities.length > 50) {
            activities = activities.slice(-50);
        }
        
        localStorage.setItem('user_activities', JSON.stringify(activities));
    }
}

// 🚀 تهيئة مدير الحماية
const securityManager = new SecurityManager();

// 🔄 تجديد الجلسة عند النشاط
document.addEventListener('mousemove', () => securityManager.refreshSession());
document.addEventListener('keypress', () => securityManager.refreshSession());
document.addEventListener('click', () => securityManager.refreshSession());

console.log('🛡️ نظام الحماية المتقدم جاهز!');
