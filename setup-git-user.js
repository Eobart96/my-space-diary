// Настройка Git пользователя
const { exec } = require('child_process');

const gitUser = {
    name: 'Eobart96',
    email: 'eobart96@example.com'
};

console.log('👤 Настройка Git пользователя...');
console.log(`📝 Имя: ${gitUser.name}`);
console.log(`📧 Email: ${gitUser.email}`);

// Установка имени
exec(`git config user.name "${gitUser.name}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Ошибка установки имени:', error.message);
        return;
    }
    console.log('✅ Имя пользователя установлено');
});

// Установка email
exec(`git config user.email "${gitUser.email}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Ошибка установки email:', error.message);
        return;
    }
    console.log('✅ Email пользователя установлен');
});

console.log('\n🎉 Git пользователь настроен!');
console.log('💡 Теперь можно синхронизироваться с GitHub');
