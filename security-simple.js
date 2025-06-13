// 🛡️ نظام الحماية المبسط - للاختبار والتطوير
// نسخة مبسطة تعمل بدون أخطاء

// 🔐 نظام التشفير البسيط
class SimpleSecurityManager {
    constructor() {
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 دقيقة
        this.sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
        this.suspiciousActivities = [];
        
        console.log('🛡️ تم تفعيل نظام الحماية المبسط');
    }
    
    // 🔒 تشفير كلمة المرور (مبسط)
    hashPassword(password, salt = null) {
        if (!salt) {
            salt = this.generateSalt();
        }
        
        // تشفير بسيط
        let hash = password + salt;
        hash = btoa(hash).split('').reverse().join('');
        
        return {
            hash: hash,
            salt: salt
        };
    }
    
    // 🧂 توليد Salt بسيط
    generateSalt() {
        return btoa(Math.random().toString(36) + Date.now().toString()).substring(0, 16);
    }
    
    // ✅ التحقق من كلمة المرور
    verifyPassword(password, storedHash, salt) {
        const newHash = this.hashPassword(password, salt);
        return newHash.hash === storedHash;
    }
    
    // 🔐 تشفير البيانات (مبسط)
    encryptData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encrypted = btoa(jsonString + '_encrypted_' + Date.now());
            return encrypted;
        } catch (error) {
            console.error('خطأ في تشفير البيانات:', error);
            return JSON.stringify(data); // fallback
        }
    }
    
    // 🔓 فك تشفير البيانات
    decryptData(encryptedData) {
        try {
            if (encryptedData.includes('_encrypted_')) {
                const decrypted = atob(encryptedData);
                const jsonString = decrypted.split('_encrypted_')[0];
                return JSON.parse(jsonString);
            } else {
                // البيانات غير مشفرة (النظام القديم)
                return JSON.parse(encryptedData);
            }
        } catch (error) {
            console.error('خطأ في فك تشفير البيانات:', error);
            try {
                return JSON.parse(encryptedData);
            } catch (parseError) {
                return null;
            }
        }
    }
    
    // 🚨 مراقبة محاولات تسجيل الدخول
    trackLoginAttempt(username, success, ip = 'unknown') {
        const attempt = {
            username: username,
            success: success,
            timestamp: Date.now(),
            ip: ip,
            userAgent: navigator.userAgent || 'unknown'
        };
        
        // حفظ في localStorage
        let attempts = [];
        try {
            attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
        } catch (error) {
            attempts = [];
        }
        
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
        
        let lockedAccounts = [];
        try {
            lockedAccounts = JSON.parse(localStorage.getItem('locked_accounts') || '[]');
        } catch (error) {
            lockedAccounts = [];
        }
        
        lockedAccounts = lockedAccounts.filter(account => account.username !== username);
        lockedAccounts.push(lockData);
        
        localStorage.setItem('locked_accounts', JSON.stringify(lockedAccounts));
        
        console.warn(`🔒 تم قفل الحساب: ${username} لمدة ${this.lockoutDuration / 60000} دقيقة`);
    }
    
    // ✅ فحص حالة قفل الحساب
    isAccountLocked(username) {
        let lockedAccounts = [];
        try {
            lockedAccounts = JSON.parse(localStorage.getItem('locked_accounts') || '[]');
        } catch (error) {
            return { locked: false };
        }
        
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
        
        console.warn('🚨 نشاط مشبوه:', report);
    }
    
    // ⚠️ تحديد مستوى الخطورة
    getSeverityLevel(type) {
        const severityMap = {
            'BRUTE_FORCE': 'HIGH',
            'SUSPICIOUS_LOGIN': 'MEDIUM',
            'DATA_BREACH_ATTEMPT': 'CRITICAL'
        };
        
        return severityMap[type] || 'LOW';
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
        let activities = [];
        try {
            activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
        } catch (error) {
            activities = [];
        }
        
        activities.push(activity);
        
        // الاحتفاظ بآخر 50 نشاط فقط
        if (activities.length > 50) {
            activities = activities.slice(-50);
        }
        
        localStorage.setItem('user_activities', JSON.stringify(activities));
    }
}

// 🚀 تهيئة مدير الحماية المبسط
const securityManager = new SimpleSecurityManager();

// 🔄 تجديد الجلسة عند النشاط
document.addEventListener('mousemove', () => {
    if (securityManager && securityManager.refreshSession) {
        securityManager.refreshSession();
    }
});

document.addEventListener('keypress', () => {
    if (securityManager && securityManager.refreshSession) {
        securityManager.refreshSession();
    }
});

document.addEventListener('click', () => {
    if (securityManager && securityManager.refreshSession) {
        securityManager.refreshSession();
    }
});

console.log('🛡️ نظام الحماية المبسط جاهز!');
